import { Pool, PoolClient, PoolConfig, QueryResult, QueryResultRow } from "pg";
import {
  ConnectionError,
  PoolNotInitializedError,
  QueryFailedError,
} from "../errors";
import { ConnectionConfig, ConnectionStatus } from "./types";

/**
 * ConnectionManager: Quản lý kết nối đến cơ sở dữ liệu PostgreSQL.
 *
 * Sử dụng Singleton Pattern để đảm bảo chỉ có một instance duy nhất
 * trong suốt vòng đời của ứng dụng.
 */
export class ConnectionManager {
  private static instance: ConnectionManager | null = null;
  private pool: Pool | null = null;
  private status: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private poolConfig: PoolConfig | null = null;
  private loggingConfig: ConnectionConfig["logging"] = false;
  private logger: ((message: string) => void) | null = null;

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
  public async initialize(config: ConnectionConfig): Promise<void> {
    if (this.pool) {
      this.log("Connection pool đã được khởi tạo trước đó. Sử dụng lại.");
      return;
    }

    this.loggingConfig = config.logging;

    this.poolConfig = {
      host: config.host ?? "localhost",
      port: config.port ?? 5432,
      user: config.user,
      password: config.password,
      database: config.database,
      max: config.maxConnections ?? 10,
      idleTimeoutMillis: config.idleTimeoutMillis ?? 30000,
      connectionTimeoutMillis: config.connectionTimeoutMillis ?? 10000,
      ssl: config.ssl ?? false,
    };

    // Thiết lập logger
    if (typeof this.loggingConfig === "function") {
      this.logger = this.loggingConfig;
    } else if (this.loggingConfig === true) {
      this.logger = (message: string) => console.log(`[PG ORM] ${message}`);
    } else if (Array.isArray(this.loggingConfig)) {
      this.logger ??= (message: string) => {
        // Có thể cải tiến để kiểm tra các từ khóa cụ thể trong mảng loggingConfig
        // ví dụ: chỉ log nếu message chứa một từ khóa nhất định có trong mảng.
        // Hiện tại, sẽ log mọi thứ với prefix [PG ORM ARRAY] nếu loggingConfig là mảng.
        console.log(`[PG ORM ARRAY] ${message}`);
      };
    }

    try {
      this.pool = new Pool(this.poolConfig);

      // Kiểm tra kết nối ban đầu
      const client = await this.pool.connect();
      client.release();

      this.status = ConnectionStatus.CONNECTED;
      this.log("Kết nối thành công đến PostgreSQL.");

      // Xử lý sự kiện lỗi của pool
      this.pool.on("error", (err) => {
        this.status = ConnectionStatus.ERROR;
        const errorMessage = err.message || "Lỗi pool không xác định";
        if (
          this.logger &&
          (this.loggingConfig === true ||
            (Array.isArray(this.loggingConfig) &&
              this.loggingConfig.includes("error")))
        ) {
          this.log(`Lỗi pool: ${errorMessage}`);
        }
        // Cân nhắc throw một ConnectionError ở đây hoặc chỉ log, tùy theo yêu cầu xử lý lỗi.
      });
    } catch (error) {
      this.status = ConnectionStatus.ERROR;
      const message =
        error instanceof Error ? error.message : "Lỗi kết nối không xác định";
      if (
        this.logger &&
        (this.loggingConfig === true ||
          (Array.isArray(this.loggingConfig) &&
            this.loggingConfig.includes("error")))
      ) {
        this.log(`Không thể kết nối đến PostgreSQL: ${message}`);
      }
      throw new ConnectionError(`Không thể kết nối đến PostgreSQL: ${message}`);
    }
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
      this.log(`Lỗi khi lấy client từ pool: ${message}`);
      throw new ConnectionError(`Không thể lấy client từ pool: ${message}`);
    }
  }

  /**
   * Kiểm tra xem có nên thực hiện logging cho một level cụ thể không.
   * @param level Loại log ('query' hoặc 'error').
   */
  private shouldLog(level: "query" | "error"): boolean {
    if (!this.logger) {
      return false; // Không có logger nào được cấu hình
    }
    if (this.loggingConfig === true) {
      return true; // Log tất cả nếu loggingConfig là true
    }
    if (Array.isArray(this.loggingConfig)) {
      return this.loggingConfig.includes(level); // Log nếu level có trong mảng loggingConfig
    }
    if (typeof this.loggingConfig === "function") {
      return true; // Nếu là một hàm log tùy chỉnh, luôn cho phép gọi để hàm đó tự quyết định
    }
    return false; // Mặc định không log nếu không rơi vào các trường hợp trên
  }

  /**
   * Thực thi một truy vấn SQL.
   * @param sql Câu lệnh SQL.
   * @param params Các tham số cho câu lệnh SQL (nếu có).
   */
  public async query<T extends QueryResultRow = any>(
    sql: string,
    params: unknown[] = []
  ): Promise<QueryResult<T>> {
    if (!this.pool) {
      throw new PoolNotInitializedError();
    }

    if (this.shouldLog("query")) {
      this.log(`Thực thi truy vấn: ${sql}`);
      if (params.length > 0) {
        this.log(`Với tham số: ${JSON.stringify(params)}`);
      }
    }

    try {
      const start = Date.now();
      const result = await this.pool.query<T>(sql, params);
      const duration = Date.now() - start;

      if (this.shouldLog("query")) {
        this.log(
          `Truy vấn hoàn thành trong ${duration}ms. Số hàng: ${result.rowCount}`
        );
      }
      return result;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Lỗi truy vấn không xác định";
      if (this.shouldLog("error")) {
        this.log(`Lỗi khi thực thi truy vấn: ${message}`);
      }
      throw new QueryFailedError(
        `Truy vấn thất bại: ${message}. SQL: ${sql}. Tham số: ${JSON.stringify(
          params
        )}`
      );
    }
  }

  /**
   * Đóng tất cả các kết nối trong pool.
   */
  public async close(): Promise<void> {
    if (this.pool) {
      this.log("Đang đóng connection pool...");
      await this.pool.end();
      this.pool = null;
      this.status = ConnectionStatus.DISCONNECTED;
      this.log("Connection pool đã đóng.");
    }
  }

  /**
   * Lấy trạng thái hiện tại của ConnectionManager.
   */
  public getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Ghi log nội bộ nếu logger đã được cấu hình.
   */
  private log(message: string): void {
    if (this.logger) {
      this.logger(message);
    }
  }
}
