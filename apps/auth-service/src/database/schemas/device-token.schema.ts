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
 * Bảng lưu token thiết bị tạm thời cho người dùng chưa đăng nhập
 * Cho phép tracking và bảo mật cơ bản cho anonymous users
 */
export const DeviceToken = pgTable(
  "device_tokens",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(), // ID token thiết bị
    device_id: varchar("device_id", { length: 255 }).notNull().unique(), // UUID thiết bị do client tạo
    device_fingerprint: text("device_fingerprint").notNull().default(""), // Fingerprint để phát hiện duplicate
    access_token: text("access_token").notNull().unique(), // JWT token tạm thời
    device_name: varchar("device_name", { length: 255 }).notNull().default(""), // Tên thiết bị
    device_type: varchar("device_type", { length: 50 }).notNull().default(""), // mobile, tablet, desktop
    device_os: varchar("device_os", { length: 255 }).notNull().default(""), // Hệ điều hành
    device_browser: varchar("device_browser", { length: 255 })
      .notNull()
      .default(""), // Trình duyệt
    user_agent: varchar("user_agent", { length: 500 }).notNull().default(""), // User agent đầy đủ
    ip_address: varchar("ip_address", { length: 64 }).notNull().default(""), // IP đăng ký
    location: varchar("location", { length: 255 }).notNull().default(""), // Vị trí ước tính
    permissions: json("permissions").notNull().default([]), // Quyền cho phép của token (read-only, limited access)
    metadata: json("metadata").notNull().default({}), // Thông tin bổ sung
    request_count: bigint("request_count", { mode: "number" })
      .notNull()
      .default(0), // Số lượng request đã thực hiện
    last_used_at: bigint("last_used_at", { mode: "number" })
      .notNull()
      .default(0), // Lần sử dụng cuối
    risk_score: smallint("risk_score").notNull().default(0), // Điểm rủi ro (0-100)
    is_blocked: boolean("is_blocked").notNull().default(false), // Trạng thái block
    blocked_reason: varchar("blocked_reason", { length: 255 })
      .notNull()
      .default(""), // Lý do block
    expires_at: bigint("expires_at", { mode: "number" }).notNull(), // Thời gian hết hạn (24h default)
    created_at: bigint("created_at", { mode: "number" }).notNull().default(0), // Thời gian tạo
    updated_at: bigint("updated_at", { mode: "number" }).notNull().default(0), // Thời gian cập nhật
  },
  (table) => [
    index("device_tokens_device_id_idx").on(table.device_id),
    index("device_tokens_access_token_idx").on(table.access_token),
    index("device_tokens_fingerprint_idx").on(table.device_fingerprint),
    index("device_tokens_ip_address_idx").on(table.ip_address),
    index("device_tokens_expires_at_idx").on(table.expires_at),
    index("device_tokens_is_blocked_idx").on(table.is_blocked),
    index("device_tokens_last_used_idx").on(table.last_used_at),
  ]
);

export type DeviceTokenSelect = typeof DeviceToken.$inferSelect;
export type DeviceTokenInsert = typeof DeviceToken.$inferInsert;
