// Manages the storage of migration history in the database

import { MigrationExecutor } from "./types";

export class MigrationStorage {
  private readonly tableName: string;

  constructor(tableName: string = "schema_migrations") {
    this.tableName = tableName;
  }

  /**
   * Đảm bảo rằng bảng lưu trữ lịch sử migration tồn tại trong database.
   * Nếu chưa tồn tại, bảng sẽ được tạo.
   * @param executor Đối tượng để thực thi các câu lệnh SQL.
   */
  public async ensureMigrationTableExists(
    executor: MigrationExecutor
  ): Promise<void> {
    const sql =
      "CREATE TABLE IF NOT EXISTS " +
      this.tableName +
      " (" +
      "id SERIAL PRIMARY KEY," +
      "version VARCHAR(255) NOT NULL UNIQUE," +
      "description TEXT NULLABLE," +
      "applied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL" +
      ");";

    try {
      await executor.query(sql);
      // Sử dụng console.info hoặc một logger chuyên dụng nếu có
      console.log(`Migration history table '${this.tableName}' is ready.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // Nên sử dụng một logger chuyên dụng ở đây
      console.error(
        `Error ensuring migration history table '${this.tableName}' exists: ${message}`
      );
      throw new Error(
        `Could not create or verify migration history table '${this.tableName}': ${message}`
      );
    }
  }

  /**
   * Lấy danh sách các phiên bản (tên) của migrations đã được áp dụng từ database.
   * @param executor Đối tượng để thực thi các câu lệnh SQL.
   * @returns Promise chứa một mảng các chuỗi là tên của migrations đã áp dụng, sắp xếp theo thứ tự áp dụng.
   */
  public async getAppliedMigrationVersions(
    executor: MigrationExecutor
  ): Promise<string[]> {
    const sql = `SELECT version FROM ${this.tableName} ORDER BY applied_at ASC, id ASC;`;
    // Sắp xếp theo applied_at rồi đến id để đảm bảo thứ tự nhất quán nếu applied_at giống hệt nhau (dù hiếm)
    try {
      const result = await executor.query<{ version: string }>(sql);
      return result.rows.map((row: { version: string }) => row.version);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `Error fetching applied migration versions from '${this.tableName}': ${message}`
      );
      // Nếu bảng chưa tồn tại, lỗi này có thể xảy ra.
      // ensureMigrationTableExists nên được gọi trước khi dùng phương thức này.
      throw new Error(
        `Could not fetch applied migration versions from '${this.tableName}': ${message}`
      );
    }
  }

  /**
   * Đánh dấu một migration là đã được áp dụng bằng cách chèn một bản ghi vào bảng lịch sử.
   * @param executor Đối tượng để thực thi các câu lệnh SQL.
   * @param version Tên/phiên bản của migration đã được áp dụng.
   * @param description Mô tả tùy chọn của migration.
   */
  public async markAsApplied(
    executor: MigrationExecutor,
    version: string,
    description?: string
  ): Promise<void> {
    const sql = `
      INSERT INTO ${this.tableName} (version, description)
      VALUES ($1, $2)
      ON CONFLICT (version) DO NOTHING;
    `; // ON CONFLICT để tránh lỗi nếu cố gắng ghi lại migration đã tồn tại (dù logic của runner nên ngăn chặn điều này)
    try {
      await executor.query(sql, [version, description ?? null]);
      console.log(`Migration '${version}' marked as applied.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `Error marking migration '${version}' as applied: ${message}`
      );
      throw new Error(
        `Could not mark migration '${version}' as applied in '${this.tableName}': ${message}`
      );
    }
  }

  /**
   * Đánh dấu một migration là chưa được áp dụng (khi rollback) bằng cách xóa bản ghi khỏi bảng lịch sử.
   * @param executor Đối tượng để thực thi các câu lệnh SQL.
   * @param version Tên/phiên bản của migration cần xóa.
   */
  public async markAsUnapplied(
    executor: MigrationExecutor,
    version: string
  ): Promise<void> {
    const sql = `DELETE FROM ${this.tableName} WHERE version = $1;`;
    try {
      const result = await executor.query(sql, [version]);
      if (typeof result.rowCount === "number" && result.rowCount > 0) {
        console.log(`Migration '${version}' marked as unapplied.`);
      } else {
        console.warn(
          `Attempted to mark migration '${version}' as unapplied. It was either not found in '${this.tableName}' or the row count was not returned by the delete operation.`
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `Error marking migration '${version}' as unapplied: ${message}`
      );
      throw new Error(
        `Could not mark migration '${version}' as unapplied in '${this.tableName}': ${message}`
      );
    }
  }
}
