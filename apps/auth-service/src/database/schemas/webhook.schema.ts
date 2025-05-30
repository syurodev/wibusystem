import {
  bigint,
  boolean,
  index,
  pgTable,
  serial,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Bảng lưu webhook
 * Cho phép gửi thông báo về các sự kiện trong hệ thống đến các URL bên ngoài
 */
export const Webhook = pgTable(
  "webhooks",
  {
    id: serial("id").primaryKey(), // ID của webhook, khóa chính
    url: varchar("url", { length: 500 }).notNull().default(""), // URL nhận webhook
    secret: varchar("secret", { length: 255 }).notNull().default(""), // Khóa bí mật dùng để xác thực webhook
    events: varchar("events", { length: 500 }).notNull().default(""), // Danh sách sự kiện webhook lắng nghe, phân cách bằng dấu phẩy
    is_active: boolean("is_active").notNull().default(true), // Trạng thái kích hoạt của webhook
    created_at: bigint("created_at", { mode: "number" }).notNull().default(0), // Thời gian tạo, dạng unix time
    updated_at: bigint("updated_at", { mode: "number" }).notNull().default(0), // Thời gian cập nhật gần nhất, dạng unix time
  },
  (table) => [
    index("webhooks_url_idx").on(table.url), // Index cho url để tìm kiếm nhanh
    index("webhooks_events_idx").on(table.events), // Index cho events để lọc theo sự kiện
  ]
);

export type WebhookSelect = typeof Webhook.$inferSelect;
export type WebhookInsert = typeof Webhook.$inferInsert;
