// Template for creating new migration files

import { Migration } from "./migration.interface";
import { MigrationExecutor } from "./types";

/**
 * LƯU Ý QUAN TRỌNG KHI TẠO MIGRATION:
 * 1. ĐỔI TÊN CLASS: Thay thế `TemplateMigration` bằng một tên có ý nghĩa, ví dụ: `CreateUsersTableMigration`.
 * 2. CẬP NHẬT `name`: Thuộc tính `name` RẤT QUAN TRỌNG. Nó phải là DUY NHẤT cho mỗi migration.
 *    - Định dạng khuyến nghị: `YYYYMMDDHHMMSS_TenMigrationNganGon` (ví dụ: `20231028140000_CreateUsersTable`).
 *    - Timestamp giúp sắp xếp thứ tự chạy migration.
 *    - `TenMigrationNganGon` giúp người đọc hiểu mục đích của migration.
 * 3. CẬP NHẬT `description`: Cung cấp mô tả rõ ràng về các thay đổi.
 * 4. VIẾT CODE TRONG `up()`: Triển khai các thay đổi schema (CREATE TABLE, ALTER TABLE, CREATE INDEX, ...).
 *    - Cố gắng làm cho các lệnh có tính idempotent (có thể chạy lại nhiều lần mà không gây lỗi, ví dụ dùng `IF NOT EXISTS`, `IF EXISTS`).
 * 5. VIẾT CODE TRONG `down()`: Triển khai logic để HOÀN TÁC chính xác những gì `up()` đã làm.
 *    - Thứ tự các lệnh trong `down()` thường ngược lại với `up()`.
 * 6. KIỂM TRA KỸ: Luôn kiểm tra migration trên môi trường development trước khi áp dụng cho production.
 */
export class TemplateMigration implements Migration {
  // QUAN TRỌNG: Thay đổi giá trị này! Ví dụ: '20231028140000_InitialSchema'
  public readonly name = "YYYYMMDDHHMMSS_TemplateMigrationName";

  public readonly description = "Mô tả chi tiết về migration này.";

  public async up(executor: MigrationExecutor): Promise<void> {
    console.log(`Migration UP: ${this.name} - ${this.description}`);

    // Ví dụ: Tạo một bảng mới
    await executor.query(
      "CREATE TABLE IF NOT EXISTS example_users (" +
        "id SERIAL PRIMARY KEY, " +
        "username VARCHAR(100) UNIQUE NOT NULL, " +
        "email VARCHAR(255) UNIQUE, " +
        "password_hash TEXT NOT NULL, " +
        "created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, " +
        "updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP" +
        ");"
    );

    // --- HỖ TRỢ FULL TEXT SEARCH ---
    // Ví dụ: Thêm cột tsvector
    // await executor.query(
    //   "ALTER TABLE documents ADD COLUMN IF NOT EXISTS content_tsvector TSVECTOR;"
    // );

    // Ví dụ: Tạo GIN index trên cột tsvector
    // await executor.query(
    //   'CREATE INDEX IF NOT EXISTS idx_documents_content_tsvector ' +
    //   'ON documents ' +
    //   'USING GIN (content_tsvector);'
    // );

    // Ví dụ: Tạo trigger FTS (SQL phức tạp - người dùng tự điền)
    /*
      Người dùng cần cung cấp SQL đầy đủ và chính xác tại đây để tạo function và trigger cho FTS.
      Ví dụ về cấu trúc (nhưng cần điều chỉnh cho đúng cú pháp SQL và logic của bạn):

      const createFunctionSql = `
        CREATE OR REPLACE FUNCTION your_fts_function_name() RETURNS trigger AS $$
        BEGIN
          NEW.your_tsvector_column := 
            to_tsvector(\'your_fts_config\', coalesce(NEW.source_column1, \'\') || \' \' || coalesce(NEW.source_column2, \'\'));
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `;
      await executor.query(createFunctionSql);

      const createTriggerSql = `
        CREATE TRIGGER your_fts_trigger_name
        BEFORE INSERT OR UPDATE ON your_table_name
        FOR EACH ROW EXECUTE FUNCTION your_fts_function_name();
      `;
      await executor.query(createTriggerSql);
    */
    console.log(`Migration UP: ${this.name} - Hoàn thành.`);
  }

  public async down(executor: MigrationExecutor): Promise<void> {
    console.log(`Migration DOWN: ${this.name} - ${this.description}`);

    // --- HỖ TRỢ FULL TEXT SEARCH (Hoàn tác) ---
    // Ví dụ: Xóa trigger và function FTS (người dùng tự điền SQL đúng)
    /*
      await executor.query("DROP TRIGGER IF EXISTS your_fts_trigger_name ON your_table_name;");
      await executor.query("DROP FUNCTION IF EXISTS your_fts_function_name();");
    */

    // Ví dụ: Xóa GIN index
    // await executor.query("DROP INDEX IF EXISTS idx_documents_content_tsvector;");

    // Ví dụ: Xóa cột tsvector
    // await executor.query("ALTER TABLE documents DROP COLUMN IF EXISTS content_tsvector;");

    // Ví dụ: Xóa bảng (thứ tự ngược lại với hàm up)
    await executor.query("DROP TABLE IF EXISTS example_users;");

    console.log(`Migration DOWN: ${this.name} - Hoàn thành.`);
  }
}
