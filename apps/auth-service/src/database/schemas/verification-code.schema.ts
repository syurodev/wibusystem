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
 * Bảng lưu mã xác thực (email/phone)
 * Quản lý các mã xác thực gửi đến người dùng qua email hoặc SMS
 */
export const VerificationCode = pgTable(
  "verification_code",
  {
    id: serial("id").primaryKey(), // ID của mã xác thực, khóa chính
    user_id: integer("user_id").notNull().default(0), // Liên kết đến bảng User
    code: varchar("code", { length: 32 }).notNull().default(""), // Mã xác thực được gửi đến người dùng
    type: integer("type").notNull().default(0), // Loại xác thực: 0: email, 1: phone
    expires_at: bigint("expires_at", { mode: "number" }).notNull().default(0), // Thời gian hết hạn mã xác thực, dạng unix time
    is_used: boolean("is_used").notNull().default(false), // Trạng thái sử dụng mã xác thực
    created_at: bigint("created_at", { mode: "number" }).notNull().default(0), // Thời gian tạo, dạng unix time
  },
  (table) => [
    index("verification_code_user_id_idx").on(table.user_id), // Index cho user_id để tìm kiếm nhanh
    index("verification_code_code_idx").on(table.code), // Index cho code để tìm kiếm nhanh
    index("verification_code_type_idx").on(table.type), // Index cho type để lọc theo loại
    index("verification_code_expires_at_idx").on(table.expires_at), // Index cho expires_at để lọc mã hết hạn
    index("verification_code_is_used_idx").on(table.is_used), // Index cho is_used để lọc mã đã sử dụng
  ]
);

export type VerificationCodeSelect = typeof VerificationCode.$inferSelect;
export type VerificationCodeInsert = typeof VerificationCode.$inferInsert;
