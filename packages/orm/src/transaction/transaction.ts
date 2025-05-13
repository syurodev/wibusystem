import { PoolClient, QueryResult, QueryResultRow } from "pg";
import { ConnectionManager } from "../connection/connection-manager";
import { TransactionError } from "../errors";
import type { Constructor } from "../model/types";
import { QueryBuilder } from "../query-builder/query-builder";

/**
 * Đại diện cho một giao dịch cơ sở dữ liệu.
 * Quản lý vòng đời của một PoolClient cho các thao tác giao dịch.
 */
export class Transaction {
  private readonly client: PoolClient;
  private readonly connectionManager: ConnectionManager;
  private released: boolean = false;
  private readonly logger: ((message: string) => void) | null;

  /**
   * Tạo một instance Transaction mới.
   * @param client PoolClient được sử dụng cho giao dịch này.
   * @param connectionManager Instance của ConnectionManager.
   */
  constructor(client: PoolClient, connectionManager: ConnectionManager) {
    this.client = client;
    this.connectionManager = connectionManager;
    // Cố gắng lấy logger từ ConnectionManager nếu có thể (ví dụ qua một phương thức getter công khai)
    // Hiện tại, ConnectionManager không expose logger trực tiếp, nên chúng ta không thể lấy ở đây
    // Thay vào đó, ConnectionManager.query() sẽ tự xử lý logging.
    this.logger = null; // Hoặc lấy từ một nguồn logger chung nếu có
  }

  /**
   * Lấy PoolClient được liên kết với giao dịch này.
   * @returns PoolClient.
   */
  public getClient(): PoolClient {
    return this.client;
  }

  /**
   * Bắt đầu giao dịch (BEGIN).
   */
  public async begin(): Promise<void> {
    if (this.released) {
      throw new TransactionError(
        "Giao dịch đã được giải phóng, không thể bắt đầu."
      );
    }
    await this.connectionManager.query("BEGIN", [], this.client);
    this.log("Giao dịch đã bắt đầu.");
  }

  /**
   * Xác nhận giao dịch (COMMIT).
   */
  public async commit(): Promise<void> {
    if (this.released) {
      throw new TransactionError(
        "Giao dịch đã được giải phóng, không thể xác nhận."
      );
    }
    await this.connectionManager.query("COMMIT", [], this.client);
    this.log("Giao dịch đã được xác nhận (commit).");
  }

  /**
   * Hủy bỏ giao dịch (ROLLBACK).
   */
  public async rollback(): Promise<void> {
    if (this.released) {
      this.log("Cảnh báo: Cố gắng rollback một giao dịch đã được giải phóng.");
      return; // Không throw lỗi, chỉ cảnh báo và bỏ qua
    }
    await this.connectionManager.query("ROLLBACK", [], this.client);
    this.log("Giao dịch đã được hủy bỏ (rollback).");
  }

  /**
   * Thực thi một truy vấn SQL trong ngữ Kontext của giao dịch này.
   * @param sql Câu lệnh SQL.
   * @param params Các tham số cho câu lệnh SQL (nếu có).
   */
  public async query<R extends QueryResultRow = any>(
    sql: string,
    params: unknown[] = []
  ): Promise<QueryResult<R>> {
    if (this.released) {
      throw new TransactionError(
        "Giao dịch đã được giải phóng, không thể thực thi truy vấn."
      );
    }
    // connectionManager.query sẽ tự log nếu được cấu hình
    return this.connectionManager.query<R>(sql, params, this.client);
  }

  /**
   * Giải phóng PoolClient trở lại pool.
   * Nên được gọi sau khi giao dịch hoàn tất (commit hoặc rollback).
   * @param error Một lỗi tùy chọn. Nếu được cung cấp, client có thể bị hủy thay vì trả về pool.
   */
  public releaseClient(error?: Error | unknown): void {
    if (!this.released) {
      // Nếu có lỗi, truyền true để client có thể bị hủy thay vì trả về pool.
      // Nếu không có lỗi, client.release() hoặc client.release(false) sẽ trả client về pool.
      this.client.release(error ? true : undefined);
      this.released = true;
      this.log("Client của giao dịch đã được giải phóng.");
    } else {
      this.log(
        "Cảnh báo: Cố gắng giải phóng client của giao dịch đã được giải phóng trước đó."
      );
    }
  }

  private log(message: string): void {
    // Logging của Transaction sẽ độc lập hoặc dựa vào một logger được truyền vào
    // vì ConnectionManager không expose logger của nó.
    // Hiện tại, ConnectionManager.query() đã có logging riêng.
    // Các log này của Transaction chỉ mang tính thông tin cho trạng thái của Transaction.
    if (this.logger) {
      this.logger(`[PG ORM Transaction] ${message}`);
    } else {
      // Hoặc console.log nếu không có logger nào được cung cấp
      // console.log(`[PG ORM Transaction] ${message}`);
      // Quyết định: không log mặc định từ Transaction để tránh nhiễu, ConnectionManager đã log query.
    }
  }

  /**
   * Tạo một instance của QueryBuilder trong ngữ cảnh của giao dịch này.
   * @param target Tên bảng (string) hoặc lớp Entity (constructor function).
   * @returns Một instance của QueryBuilder được gắn với client của giao dịch này.
   */
  public createQueryBuilder<Entity extends object = any>(
    target: string | Constructor<Entity>
  ): QueryBuilder<Entity> {
    return new QueryBuilder<Entity>(
      this.connectionManager,
      target,
      this.client // Truyền client của transaction vào QueryBuilder
    );
  }
}
