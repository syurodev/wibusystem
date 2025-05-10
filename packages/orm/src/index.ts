// Entry point for the @repo/orm package
import { QueryResult, QueryResultRow } from "pg";
import { ConnectionManager } from "./connection/connection-manager";
import { ConnectionConfig } from "./connection/types";
import { ModelManager } from "./model/model-manager";

/**
 * Factory class để khởi tạo và quản lý ORM
 */
export class OrmFactory {
  /**
   * Khởi tạo ORM với cấu hình kết nối
   * @param config Cấu hình kết nối đến PostgreSQL
   */
  public static async initialize(config: ConnectionConfig): Promise<OrmClient> {
    const connectionManager = ConnectionManager.getInstance();
    await connectionManager.initialize(config);
    return new OrmClient(connectionManager);
  }

  /**
   * Đóng tất cả các kết nối
   */
  public static async close(): Promise<void> {
    const connectionManager = ConnectionManager.getInstance();
    await connectionManager.close();
  }
}

/**
 * Client chính của ORM, cung cấp các phương thức để tương tác với database
 */
export class OrmClient {
  private readonly modelManager: ModelManager;

  constructor(private readonly connectionManager: ConnectionManager) {
    this.modelManager = new ModelManager();
  }

  /**
   * Thực thi một truy vấn SQL trực tiếp
   * @param sql Câu lệnh SQL
   * @param params Các tham số cho câu lệnh SQL
   */
  public async query<T extends QueryResultRow = any>(
    sql: string,
    params: any[] = []
  ): Promise<QueryResult<T>> {
    return this.connectionManager.query<T>(sql, params);
  }

  // Các phương thức khác sẽ được thêm vào sau khi triển khai QueryBuilder

  /**
   * Chuyển đổi một đối tượng model thành dữ liệu để lưu vào database
   * @param className Tên class của model
   * @param modelInstance Instance của model
   */
  public toDatabase<T extends Record<string, any>>(
    className: string,
    modelInstance: T
  ): Record<string, any> {
    return this.modelManager.toDatabase(className, modelInstance);
  }

  /**
   * Chuyển đổi dữ liệu từ database thành một đối tượng model
   * @param className Tên class của model
   * @param dbData Dữ liệu từ database
   */
  public fromDatabase<T>(
    className: string,
    dbData: Record<string, any>
  ): Partial<T> {
    return this.modelManager.fromDatabase<T>(className, dbData);
  }

  /**
   * Lấy tên bảng của một model
   * @param className Tên class của model
   */
  public getTableName(className: string): string | undefined {
    return this.modelManager.getTableName(className);
  }

  /**
   * Lấy tên cột trong database từ tên thuộc tính trong model
   * @param className Tên class của model
   * @param propertyName Tên thuộc tính trong model
   */
  public getColumnName(
    className: string,
    propertyName: string
  ): string | undefined {
    return this.modelManager.getColumnName(className, propertyName);
  }
}

// Re-export các types và errors
export type { ConnectionConfig, ConnectionStatus } from "./connection/types";
export {
  ConnectionError,
  ModelError,
  ModelNotRegisteredError,
  OrmError,
  PoolNotInitializedError,
  PropertyNotFoundError,
  QueryFailedError,
  ValueConversionError,
} from "./errors";

// Export OrmErrorCode enum
export { OrmErrorCode } from "./errors";

// Export các decorators và types từ model
export {
  Column,
  Entity,
  ForeignKey,
  Index,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UniqueIndex,
} from "./model/decorators";
export { PostgresDataType } from "./model/types";
export type {
  ColumnDefinition,
  ForeignKeyDefinition,
  IndexDefinition,
  ModelMetadata,
} from "./model/types";

// Export các base entity
export { AutoUpdateTimestamp, BaseEntity } from "./model/base-entity";

// Export type QueryResult từ pg
export type { QueryResult, QueryResultRow } from "pg";
