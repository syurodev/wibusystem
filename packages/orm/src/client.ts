import { QueryResult, QueryResultRow } from "pg";
import { ConnectionManager } from "./connection/connection-manager";
import { ModelManager } from "./model/model-manager";
import { QueryBuilder } from "./query-builder";

/**
 * Client chính của ORM, cung cấp các phương thức để tương tác với database
 */
export class OrmClient {
  private readonly modelManager: ModelManager;

  constructor(private readonly connectionManager: ConnectionManager) {
    this.modelManager = new ModelManager(); // ModelManager sẽ được khởi tạo ở đây
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
  public createQueryBuilder<Entity = any>(
    // eslint-disable-next-line @typescript-eslint/ban-types
    target: string | Function
  ): QueryBuilder<Entity> {
    return new QueryBuilder<Entity>(
      this.connectionManager,
      this.modelManager,
      target
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
    return this.modelManager.toDatabase(className, modelInstance);
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
    return this.modelManager.fromDatabase<T>(className, dbData);
  }

  /**
   * Lấy tên bảng của một model
   * @param target Class của model hoặc tên class
   */
  // eslint-disable-next-line @typescript-eslint/ban-types
  public getTableName(target: Function | string): string | undefined {
    const className = typeof target === "function" ? target.name : target;
    return this.modelManager.getTableName(className);
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
    return this.modelManager.getColumnName(className, propertyName);
  }
}
