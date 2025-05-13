// Types for migrations module

import { QueryResult, QueryResultRow } from "pg";

/**
 * Định nghĩa đối tượng thực thi các câu lệnh SQL trong một migration.
 * Nó có thể là một `PoolClient` từ thư viện `pg` hoặc một wrapper tùy chỉnh.
 */
export interface MigrationExecutor {
  /**
   * Thực thi một câu lệnh SQL.
   * @param sql Câu lệnh SQL cần thực thi.
   * @param params Các tham số cho câu lệnh SQL (nếu có).
   * @returns Promise chứa kết quả truy vấn theo cấu trúc QueryResult của thư viện pg.
   */
  query<R extends QueryResultRow = any>(
    sql: string,
    params?: any[]
  ): Promise<QueryResult<R>>;
  // Có thể thêm các phương thức helper khác nếu cần, ví dụ:
  // tableExists(tableName: string): Promise<boolean>;
  // columnExists(tableName: string, columnName: string): Promise<boolean>;
}

/**
 * Đại diện cho một file migration đã được load, bao gồm tên và instance của migration.
 */
// export interface LoadedMigrationFile {
//   name: string;        // Tên migration, thường là timestamp_description
//   instance: Migration; // Instance của class migration
//   filePath: string;    // Đường dẫn đến file migration
// }
