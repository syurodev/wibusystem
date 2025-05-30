import {
  bigint,
  boolean,
  index,
  integer,
  pgTable,
  serial,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Bảng lưu token đặt lại mật khẩu
 * Quản lý quá trình đặt lại mật khẩu cho người dùng
 */
export const PasswordReset = pgTable(
  "password_resets",
  {
    id: serial("id").primaryKey(), // ID của token đặt lại mật khẩu, khóa chính
    user_id: integer("user_id").notNull().default(0), // Liên kết đến bảng User
    token: varchar("token", { length: 255 }).notNull().default("").unique(), // Token duy nhất dùng trong URL đặt lại mật khẩu
    expires_at: bigint("expires_at", { mode: "number" }).notNull().default(0), // Thời gian hết hạn token, dạng unix time
    is_used: boolean("is_used").notNull().default(false), // Trạng thái sử dụng của token
    created_at: bigint("created_at", { mode: "number" }).notNull().default(0), // Thời gian tạo, dạng unix time
  },
  (table) => [
    index("password_reset_user_id_idx").on(table.user_id), // Index cho user_id để tìm kiếm nhanh
    index("password_reset_token_idx").on(table.token), // Index cho token để tìm kiếm nhanh
    index("password_reset_expires_at_idx").on(table.expires_at), // Index cho expires_at để lọc token hết hạn
  ]
);

export type PasswordResetSelect = typeof PasswordReset.$inferSelect;
export type PasswordResetInsert = typeof PasswordReset.$inferInsert;
