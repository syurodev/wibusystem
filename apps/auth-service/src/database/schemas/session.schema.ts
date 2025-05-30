import {
  bigint,
  bigserial,
  boolean,
  index,
  integer,
  pgTable,
  text,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Bảng lưu thông tin phiên đăng nhập
 * Theo dõi các phiên đăng nhập của người dùng và thông tin thiết bị
 */
export const Session = pgTable(
  "sessions",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(), // ID của phiên, khóa chính
    user_id: integer("user_id").notNull().default(0), // Liên kết đến bảng User
    refresh_token: text("refresh_token").notNull().default(""), // Token để làm mới access token
    user_agent: varchar("user_agent", { length: 500 }).notNull().default(""), // Thông tin user agent của trình duyệt/thiết bị
    ip_address: varchar("ip_address", { length: 64 }).notNull().default(""), // Địa chỉ IP đăng nhập
    device_id: varchar("device_id", { length: 255 }).notNull().default(""), // ID duy nhất của thiết bị
    device_name: varchar("device_name", { length: 255 }).notNull().default(""), // Tên thiết bị
    device_type: varchar("device_type", { length: 255 }).notNull().default(""), // Loại thiết bị (mobile, tablet, desktop)
    device_os: varchar("device_os", { length: 255 }).notNull().default(""), // Hệ điều hành của thiết bị
    device_browser: varchar("device_browser", { length: 255 })
      .notNull()
      .default(""), // Trình duyệt của thiết bị
    device_location: varchar("device_location", { length: 255 })
      .notNull()
      .default(""), // Vị trí địa lý ước tính của thiết bị
    is_active: boolean("is_active").notNull().default(true), // Trạng thái hoạt động của phiên
    revoked_at: bigint("revoked_at", { mode: "number" }).notNull().default(0), // Thời gian thu hồi phiên (nếu có)
    expires_at: bigint("expires_at", { mode: "number" }).notNull().default(0), // Thời gian hết hạn phiên
    created_at: bigint("created_at", { mode: "number" }).notNull().default(0), // Thời gian tạo phiên
  },
  (table) => [
    index("sessions_user_id_idx").on(table.user_id), // Index cho user_id để tìm kiếm nhanh
    index("sessions_device_id_idx").on(table.device_id), // Index cho device_id để tìm kiếm nhanh
    index("sessions_is_active_idx").on(table.is_active), // Index cho is_active để lọc phiên đang hoạt động
    index("sessions_expires_at_idx").on(table.expires_at), // Index cho expires_at để lọc phiên hết hạn
  ]
);

export type SessionSelect = typeof Session.$inferSelect;
export type SessionInsert = typeof Session.$inferInsert;
