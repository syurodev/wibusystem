import { QueryResult, QueryResultRow } from "pg";
import { ConnectionManager } from "./connection/connection-manager";
import { OrmError, TransactionError } from "./errors";
import { Logger } from "./logger";
import { ModelManager } from "./model/model-manager";
import type { Constructor } from "./model/types";
import { QueryBuilder } from "./query-builder";
import { Transaction } from "./transaction/transaction";

/**
 * Client chính của ORM, cung cấp các phương thức để tương tác với database
 */
export class OrmClient {
  private readonly connectionManager: ConnectionManager;
  private readonly modelManager: ModelManager;
  private readonly logger: Logger = Logger.getInstance();

  constructor(
    connectionManager: ConnectionManager,
    modelManager: ModelManager
  ) {
    this.connectionManager = connectionManager;
    this.modelManager = modelManager;
  }

  /**
   * Thực thi một truy vấn SQL trực tiếp
   * @param sql Câu lệnh SQL
   * @param params Các tham số cho câu lệnh SQL
   */
  public async query<T extends QueryResultRow = any>(
    sql: string,
    params: unknown[] = []
  ): Promise<QueryResult<T>> {
    return this.connectionManager.query<T>(sql, params);
  }

  /**
   * Tạo một instance của QueryBuilder cho một bảng hoặc Entity cụ thể.
   * @param target Tên bảng (string) hoặc lớp Entity (constructor function).
   * @returns Một instance của QueryBuilder.
   */
  public createQueryBuilder<Entity extends object = any>(
    // eslint-disable-next-line @typescript-eslint/ban-types
    target: string | Function
  ): QueryBuilder<Entity> {
    return new QueryBuilder<Entity>(
      this.connectionManager,
      target as string | Constructor<Entity>
    );
  }

  /**
   * Chuyển đổi một đối tượng model thành dữ liệu để lưu vào database
   * @param target Class của model hoặc tên class
   * @param modelInstance Instance của model
   */
  public toDatabase<T extends object>(
    // eslint-disable-next-line @typescript-eslint/ban-types
    target: Function | string,
    modelInstance: T
  ): Record<string, any> {
    const className = typeof target === "function" ? target.name : target;
    return this.modelManager.convertToDatabaseFormat(
      modelInstance,
      className as any
    );
  }

  /**
   * Chuyển đổi dữ liệu từ database thành một đối tượng model
   * @param target Class của model hoặc tên class
   * @param dbData Dữ liệu từ database
   */
  public fromDatabase<T extends object>(
    // eslint-disable-next-line @typescript-eslint/ban-types
    target: Function | string,
    dbData: Record<string, any>
  ): Partial<T> {
    const className = typeof target === "function" ? target.name : target;
    return this.modelManager.convertFromDatabaseFormat<T>(
      dbData,
      className as any
    );
  }

  /**
   * Lấy tên bảng của một model
   * @param target Class của model hoặc tên class
   */
  // eslint-disable-next-line @typescript-eslint/ban-types
  public getTableName(target: Function | string): string | undefined {
    const className = typeof target === "function" ? target.name : target;
    return this.modelManager.getTableName(className as any);
  }

  /**
   * Lấy tên cột trong database từ tên thuộc tính trong model
   * @param target Class của model hoặc tên class
   * @param propertyName Tên thuộc tính trong model
   */
  public getColumnName(
    // eslint-disable-next-line @typescript-eslint/ban-types
    target: Function | string,
    propertyName: string
  ): string | undefined {
    const className = typeof target === "function" ? target.name : target;
    return this.modelManager.getColumnName<any>(
      className as any,
      propertyName as any
    );
  }

  public async transaction<T>(
    callback: (transaction: Transaction) => Promise<T>
  ): Promise<T> {
    const client = await this.connectionManager.getClientForTransaction();
    const transaction = new Transaction(client, this.connectionManager);

    try {
      await transaction.begin();
      this.logger.info("Transaction đã bắt đầu.");
      const result = await callback(transaction);
      await transaction.commit();
      this.logger.info("Transaction đã commit thành công.");
      return result;
    } catch (error: any) {
      this.logger.error(
        "Lỗi xảy ra trong transaction, đang rollback...",
        error
      );
      try {
        await transaction.rollback();
        this.logger.info("Transaction đã rollback thành công.");
      } catch (rollbackError: any) {
        this.logger.error(
          "Lỗi khi thực hiện rollback transaction sau một lỗi khác:",
          rollbackError
        );
      }

      if (error instanceof OrmError) {
        throw error;
      } else if (error instanceof Error) {
        throw new TransactionError(
          `Lỗi trong quá trình giao dịch: ${error.message}`,
          error
        );
      } else {
        throw new TransactionError(
          "Lỗi không xác định trong quá trình giao dịch.",
          error
        );
      }
    } finally {
      transaction.releaseClient();
      this.logger.info("Client của transaction đã được giải phóng.");
    }
  }
}
