import {
  bigint,
  index,
  integer,
  pgTable,
  serial,
  smallint,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Bảng lưu thông tin giới hạn tần suất
 * Sử dụng để giới hạn số lượng yêu cầu từ một IP hoặc người dùng trong một khoảng thời gian
 */
export const RateLimit = pgTable(
  "rate_limits",
  {
    id: serial("id").primaryKey(), // ID của bản ghi giới hạn, khóa chính
    key: varchar("key", { length: 255 }).notNull().default(""), // Khóa định danh (IP, user_id, api_key)
    type: smallint("type").notNull().default(0), // Loại giới hạn: 0: IP, 1: user_id, 2: api_key
    count: integer("count").notNull().default(0), // Số lần đã yêu cầu
    expires_at: bigint("expires_at", { mode: "number" }).notNull().default(0), // Thời gian hết hạn giới hạn, dạng unix time
    created_at: bigint("created_at", { mode: "number" }).notNull().default(0), // Thời gian tạo, dạng unix time
  },
  (table) => [
    index("rate_limit_key_idx").on(table.key), // Index cho key để tìm kiếm nhanh
    index("rate_limit_type_idx").on(table.type), // Index cho type để lọc theo loại
    index("rate_limit_expires_at_idx").on(table.expires_at), // Index cho expires_at để lọc giới hạn hết hạn
  ]
);

export type RateLimitSelect = typeof RateLimit.$inferSelect;
export type RateLimitInsert = typeof RateLimit.$inferInsert;
