import {
  bigint,
  boolean,
  index,
  integer,
  pgTable,
  serial,
  smallint,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Bảng lưu thông tin xác thực đa yếu tố (MFA)
 * Hỗ trợ các phương thức xác thực thứ hai như TOTP, SMS, v.v.
 */
export const Mfa = pgTable(
  "mfa",
  {
    id: serial("id").primaryKey(), // ID của cấu hình MFA, khóa chính
    user_id: integer("user_id").notNull().default(0), // Liên kết đến bảng User
    secret: varchar("secret", { length: 64 }).notNull().default(""), // Khóa bí mật dùng để tạo mã MFA
    type: smallint("type").notNull().default(0), // Loại MFA: 0: TOTP (Google Authenticator), 1: SMS, ...
    is_active: boolean("is_active").notNull().default(true), // Trạng thái kích hoạt của MFA
    created_at: bigint("created_at", { mode: "number" }).notNull().default(0), // Thời gian tạo, dạng unix time
  },
  (table) => [
    index("mfa_user_id_idx").on(table.user_id), // Index cho user_id để tìm kiếm nhanh
    index("mfa_type_idx").on(table.type), // Index cho type để lọc theo loại
    index("mfa_is_active_idx").on(table.is_active), // Index cho is_active để lọc MFA đang hoạt động
  ]
);

export type MfaSelect = typeof Mfa.$inferSelect;
export type MfaInsert = typeof Mfa.$inferInsert;
