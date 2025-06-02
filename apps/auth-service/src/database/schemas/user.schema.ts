import { sql } from "drizzle-orm";
import {
  bigint,
  bigserial,
  boolean,
  index,
  json,
  pgTable,
  smallint,
  text,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Bảng lưu thông tin người dùng
 * Chứa thông tin cá nhân, thông tin xác thực và trạng thái tài khoản
 */
export const User = pgTable(
  "users",
  {
    id: bigserial({ mode: "number" }).primaryKey(), // ID người dùng, khóa chính
    user_name: varchar({ length: 255 }).notNull().default(""), // Tên đăng nhập, dùng để đăng nhập và hiển thị
    email: varchar({ length: 255 }).notNull().default("").unique(), // Email người dùng, dùng để đăng nhập và liên hệ
    password: varchar({ length: 500 }).notNull().default(""), // Mật khẩu đã được hash
    phone_number: varchar({ length: 20 }).notNull().default(""), // Số điện thoại, có thể dùng để đăng nhập và xác thực
    display_name: varchar({ length: 255 }).notNull().default(""), // Tên hiển thị, dùng để hiển thị trên UI
    avatar_url: text("avatar_url").notNull().default(""), // URL ảnh đại diện
    cover_url: text("cover_url").notNull().default(""), // URL ảnh bìa
    bio: varchar({ length: 255 }).notNull().default(""), // Tiểu sử, giới thiệu ngắn về người dùng
    gender: smallint().notNull().default(0), // Giới tính: 0: khác, 1: nam, 2: nữ
    date_of_birth: bigint({ mode: "number" }).notNull().default(0), // Ngày sinh, lưu dạng timestamp (unix time)
    metadata: json("metadata").notNull().default({}), // Dữ liệu mở rộng, lưu các thông tin bổ sung
    is_email_verified: boolean().notNull().default(false), // Trạng thái xác thực email
    is_phone_verified: boolean().notNull().default(false), // Trạng thái xác thực số điện thoại
    is_active: boolean().notNull().default(false), // Trạng thái hoạt động của tài khoản
    is_deleted: boolean().notNull().default(false), // Trạng thái xóa (soft delete)
    created_at: bigint({ mode: "number" }).notNull().default(0), // Thời gian tạo, dạng unix time
    updated_at: bigint({ mode: "number" }).notNull().default(0), // Thời gian cập nhật gần nhất, dạng unix time
  },
  (table) => [
    index("users_email_idx").on(table.email), // Index cho email để tìm kiếm nhanh
    index("users_username_idx").on(table.user_name), // Index cho username để tìm kiếm nhanh
    index("users_phone_idx").on(table.phone_number), // Index cho số điện thoại để tìm kiếm nhanh
    index("users_display_name_fts_idx").using(
      "gin",
      sql`to_tsvector('simple', ${table.display_name})`
    ), // GIN index cho FTS không phân biệt ngôn ngữ
  ]
);

// Tạo migration riêng để thêm cột tsvector và index gin
// CREATE INDEX users_display_name_tsv_idx ON users USING GIN (to_tsvector('simple', display_name));

export type UserSelect = typeof User.$inferSelect;
export type UserInsert = typeof User.$inferInsert;
