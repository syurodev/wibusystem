import { Pool, PoolClient, PoolConfig, QueryResult, QueryResultRow } from "pg";
import {
  ConnectionError,
  OrmErrorCode,
  PoolNotInitializedError,
  QueryFailedError,
} from "../errors";
import { Logger } from "../logger";
import {
  ConnectionStatus,
  type ConnectionConfig,
  type LoggingConfig,
} from "./types";

/**
 * ConnectionManager: Quản lý kết nối đến cơ sở dữ liệu PostgreSQL.
 *
 * Sử dụng Singleton Pattern để đảm bảo chỉ có một instance duy nhất
 * trong suốt vòng đời của ứng dụng.
 */
export class ConnectionManager {
  private static instance: ConnectionManager | null = null;
  private pool: Pool | null = null;
  private config: ConnectionConfig | null = null;
  private loggingConfig: LoggingConfig | null = null;
  private status: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private readonly logger: Logger = Logger.getInstance();

  /**
   * Constructor riêng tư để ngăn việc tạo instance trực tiếp.
   */
  private constructor() {}

  /**
   * Lấy instance duy nhất của ConnectionManager.
   */
  public static getInstance(): ConnectionManager {
    ConnectionManager.instance ??= new ConnectionManager();
    return ConnectionManager.instance;
  }

  /**
   * Khởi tạo connection pool với PostgreSQL.
   * @param config Cấu hình kết nối.
   */
  public initialize(config: ConnectionConfig): void {
    if (this.pool) {
      this.logger.warn(
        "ConnectionManager đã được khởi tạo. Bỏ qua lần gọi initialize này."
      );
      return;
    }
    this.config = config;
    this.loggingConfig = config.logging ?? false;
    this.status = ConnectionStatus.DISCONNECTED;

    const pgPoolConfig: PoolConfig = {
      user: config.user,
      host: config.host ?? "localhost",
      database: config.database,
      password: config.password,
      port: config.port ?? 5432,
      max: config.maxConnections ?? 10,
      idleTimeoutMillis: config.idleTimeoutMillis ?? 30000,
      connectionTimeoutMillis: config.connectionTimeoutMillis ?? 2000,
      ssl: config.ssl,
    };

    this.pool = new Pool(pgPoolConfig);

    this.pool.on("connect", (client) => {
      if (this.shouldLog("info")) {
        this.logger.info(
          `Client mới đã kết nối. Tổng số client: ${this.pool?.totalCount}, client đang chờ: ${this.pool?.waitingCount}`
        );
      }
    });

    this.pool.on("acquire", (_client) => {
      if (this.shouldLog("debug")) {
        this.logger.debug(
          `Client đã được lấy từ pool. Tổng số client: ${this.pool?.totalCount}, client đang chờ: ${this.pool?.waitingCount}`
        );
      }
    });

    this.pool.on("error", (err, _client) => {
      this.status = ConnectionStatus.ERROR;
      if (this.shouldLog("error")) {
        this.logger.error(`Lỗi từ idle client trong pool: ${err.message}`, err);
      }
    });

    this.pool
      .connect()
      .then((client) => {
        client.release();
        this.status = ConnectionStatus.CONNECTED;
        if (this.shouldLog("info")) {
          this.logger.info(
            `ConnectionManager đã khởi tạo và kết nối thành công tới ${config.host}:${config.port}, database: ${config.database}`
          );
        }
      })
      .catch((err) => {
        this.status = ConnectionStatus.ERROR;
        if (this.shouldLog("error")) {
          this.logger.error(
            `Lỗi khởi tạo ConnectionManager: Không thể kết nối tới DB. ${err.message}`,
            err
          );
        }
      });
  }

  /**
   * Lấy một client từ pool.
   * Thường dùng cho các thao tác giao dịch (transaction).
   */
  public async getClient(): Promise<PoolClient> {
    if (!this.pool) {
      throw new PoolNotInitializedError();
    }

    try {
      return await this.pool.connect();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Lỗi không xác định khi lấy client từ pool";
      this.logger.error(`Lỗi khi lấy client từ pool: ${message}`);
      throw new ConnectionError(`Không thể lấy client từ pool: ${message}`);
    }
  }

  /**
   * Kiểm tra xem có nên thực hiện logging cho một level cụ thể không.
   * @param level Loại log ('query' hoặc 'error').
   */
  private shouldLog(
    level: "query" | "error" | "warn" | "info" | "debug"
  ): boolean {
    if (!this.loggingConfig) return false;
    if (this.loggingConfig === true) return true;
    if (Array.isArray(this.loggingConfig)) {
      return this.loggingConfig.includes(level as any);
    }
    if (typeof this.loggingConfig === "object" && this.loggingConfig !== null) {
      return this.loggingConfig[level] === true;
    }
    return false;
  }

  /**
   * Thực thi một truy vấn SQL.
   * @param sql Câu lệnh SQL.
   * @param params Các tham số cho câu lệnh SQL (nếu có).
   * @param client Một PoolClient tùy chọn để thực thi truy vấn (sử dụng cho transactions).
   */
  public async query<R extends QueryResultRow = any>(
    sql: string,
    params: unknown[] = [],
    client?: PoolClient
  ): Promise<QueryResult<R>> {
    const source = client || this.pool;
    let startTime = 0;

    if (!source) {
      this.logger.error(
        "Không có pool hoặc client nào để thực thi truy vấn. Gọi initialize() trước."
      );
      throw new PoolNotInitializedError();
    }
    if (this.status !== ConnectionStatus.CONNECTED && !client) {
      this.logger.error(
        `Không thể thực thi truy vấn vì ConnectionManager không ở trạng thái CONNECTED (hiện tại: ${this.status}).`
      );
      throw new ConnectionError(
        `Connection pool không sẵn sàng (trạng thái: ${this.status}).`,
        OrmErrorCode.CONNECTION_ERROR
      );
    }

    startTime = Date.now();
    try {
      const result = await source.query<R>(sql, params);
      const duration = Date.now() - startTime;

      if (this.shouldLog("query")) {
        this.logger.log(
          `QUERY: ${sql} | PARAMS: ${JSON.stringify(params)} | DURATION: ${duration}ms | ROWS: ${result.rowCount}`
        );
      }
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const message =
        error instanceof Error ? error.message : "Lỗi truy vấn không xác định";
      if (this.shouldLog("error")) {
        this.logger.error(
          `Lỗi QUERY: ${sql} | PARAMS: ${JSON.stringify(params)} | DURATION: ${duration}ms | ERROR: ${message}`,
          error
        );
      }
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore Linter đang báo sai số lượng tham số, cách gọi này là đúng
      throw new QueryFailedError(sql, params, message, error);
    }
  }

  /**
   * Đóng tất cả các kết nối trong pool.
   */
  public async close(): Promise<void> {
    if (this.pool) {
      this.logger.info("Đang đóng connection pool...");
      await this.pool.end();
      this.pool = null;
      this.config = null;
      this.loggingConfig = null;
      this.status = ConnectionStatus.DISCONNECTED;
      this.logger.info("Connection pool đã đóng.");
    } else {
      this.logger.warn("Không có pool nào để đóng.");
    }
  }

  /**
   * Lấy trạng thái hiện tại của ConnectionManager.
   */
  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public async getClientForTransaction(): Promise<PoolClient> {
    if (!this.pool) {
      this.logger.error(
        "Pool chưa được khởi tạo. Gọi initialize() trước khi lấy client cho transaction."
      );
      throw new PoolNotInitializedError();
    }
    if (this.status !== ConnectionStatus.CONNECTED) {
      this.logger.error(
        `Không thể lấy client cho transaction vì ConnectionManager không ở trạng thái CONNECTED (hiện tại: ${this.status}).`
      );
      throw new ConnectionError(
        `Pool không sẵn sàng cho transaction (trạng thái: ${this.status}).`,
        OrmErrorCode.CONNECTION_ERROR
      );
    }
    try {
      const client = await this.pool.connect();
      if (this.shouldLog("info")) {
        this.logger.info("Một client đã được lấy từ pool cho transaction.");
      }
      return client;
    } catch (err: any) {
      if (this.shouldLog("error")) {
        this.logger.error(
          `Lỗi khi lấy client từ pool cho transaction: ${err.message}`,
          err
        );
      }
      // eslint-disable-next-line
      throw new ConnectionError(
        `Không thể lấy client từ pool cho transaction: ${err.message}`,
        OrmErrorCode.CONNECTION_ERROR
      );
    }
  }
}
