// Defines the core Migration interface

import { MigrationExecutor } from "./types";

/**
 * Interface cốt lõi cho một file migration.
 * Mỗi file migration phải implement interface này.
 */
export interface Migration {
  /**
   * Tên định danh duy nhất cho migration, thường là timestamp kết hợp mô tả ngắn.
   * Ví dụ: '20231027103000_CreateUsersTable'
   * Tên này sẽ được sử dụng để theo dõi các migration đã được áp dụng.
   * Khuyến nghị sử dụng readonly để đảm bảo không bị thay đổi sau khi khởi tạo.
   */
  readonly name: string;

  /**
   * Mô tả chi tiết hơn về những gì migration này thực hiện.
   * Đây là trường tùy chọn nhưng rất khuyến khích để có.
   */
  readonly description?: string;

  /**
   * Hàm thực thi các thay đổi schema (áp dụng migration).
   * Tất cả các thao tác trong hàm `up` nên được thiết kế để có thể chạy lại
   * mà không gây lỗi nếu migration đã được áp dụng một phần (idempotent nếu có thể).
   * @param executor Đối tượng để thực thi các câu lệnh SQL.
   *                 Nó sẽ được cung cấp bởi MigrationRunner và thường được bọc trong một transaction.
   */
  up(executor: MigrationExecutor): Promise<void>;

  /**
   * Hàm hoàn tác các thay đổi schema (rollback migration).
   * Hàm này nên hoàn tác chính xác những gì hàm `up` đã thực hiện.
   * @param executor Đối tượng để thực thi các câu lệnh SQL.
   *                 Nó sẽ được cung cấp bởi MigrationRunner và thường được bọc trong một transaction.
   */
  down(executor: MigrationExecutor): Promise<void>;
}
