import {
  bigint,
  bigserial,
  boolean,
  index,
  integer,
  pgTable,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Bảng lưu API key của người dùng
 * Cho phép người dùng tạo và quản lý API key để truy cập API
 */
export const ApiKey = pgTable(
  "api_key",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(), // ID của API key, khóa chính
    user_id: integer("user_id").notNull().default(0), // Liên kết đến bảng User
    api_key: varchar("api_key", { length: 255 }).notNull().default("").unique(), // API key, mã duy nhất để xác thực
    description: varchar("description", { length: 255 }).notNull().default(""), // Mô tả về API key, giúp người dùng nhận biết
    is_active: boolean("is_active").notNull().default(true), // Trạng thái kích hoạt của API key
    created_at: bigint("created_at", { mode: "number" }).notNull().default(0), // Thời gian tạo, dạng unix time
    updated_at: bigint("updated_at", { mode: "number" }).notNull().default(0), // Thời gian cập nhật gần nhất, dạng unix time
  },
  (table) => [
    index("api_key_user_id_idx").on(table.user_id), // Index cho user_id để tìm kiếm nhanh
    index("api_key_api_key_idx").on(table.api_key), // Index cho api_key để tìm kiếm nhanh
    index("api_key_is_active_idx").on(table.is_active), // Index cho is_active để lọc API key đang hoạt động
  ]
);

export type ApiKeySelect = typeof ApiKey.$inferSelect;
export type ApiKeyInsert = typeof ApiKey.$inferInsert;
