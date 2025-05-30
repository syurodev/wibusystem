import {
  bigint,
  bigserial,
  boolean,
  index,
  integer,
  json,
  pgTable,
  smallint,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Bảng lưu thông tin subscription của người dùng
 * Hỗ trợ model freemium và premium cho hệ thống
 */
export const UserSubscription = pgTable(
  "user_subscriptions",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(), // ID subscription, khóa chính
    user_id: bigint("user_id", { mode: "number" }).notNull().default(0), // Liên kết đến bảng User

    // Thông tin gói
    plan_type: smallint("plan_type").notNull().default(0), // Loại gói: 0: free, 1: basic, 2: premium, 3: pro
    plan_name: varchar("plan_name", { length: 100 }).notNull().default(""), // Tên gói subscription

    // Thông tin thanh toán
    payment_method: smallint("payment_method").notNull().default(0), // Phương thức thanh toán: 0: none, 1: card, 2: paypal, 3: crypto
    payment_provider: varchar("payment_provider", { length: 50 })
      .notNull()
      .default(""), // Nhà cung cấp thanh toán
    external_subscription_id: varchar("external_subscription_id", {
      length: 255,
    })
      .notNull()
      .default(""), // ID subscription từ payment provider

    // Thời gian
    started_at: bigint("started_at", { mode: "number" }).notNull().default(0), // Thời gian bắt đầu
    expires_at: bigint("expires_at", { mode: "number" }).notNull().default(0), // Thời gian hết hạn
    trial_ends_at: bigint("trial_ends_at", { mode: "number" })
      .notNull()
      .default(0), // Thời gian kết thúc trial

    // Trạng thái
    status: smallint("status").notNull().default(1), // Trạng thái: 0: cancelled, 1: active, 2: expired, 3: suspended, 4: trial
    is_auto_renew: boolean("is_auto_renew").notNull().default(true), // Tự động gia hạn
    is_trial: boolean("is_trial").notNull().default(false), // Đang trong thời gian trial

    // Tính năng được phép
    features: json("features").notNull().default({}), // Các tính năng được phép sử dụng
    limits: json("limits").notNull().default({}), // Giới hạn sử dụng (downloads, streams, etc.)

    // Thông tin billing
    billing_cycle: smallint("billing_cycle").notNull().default(1), // Chu kỳ billing: 1: monthly, 2: quarterly, 3: yearly
    amount: integer("amount").notNull().default(0), // Số tiền (cents)
    currency: varchar("currency", { length: 3 }).notNull().default("USD"), // Đơn vị tiền tệ

    // Metadata
    metadata: json("metadata").notNull().default({}), // Dữ liệu bổ sung

    created_at: bigint("created_at", { mode: "number" }).notNull().default(0), // Thời gian tạo
    updated_at: bigint("updated_at", { mode: "number" }).notNull().default(0), // Thời gian cập nhật
  },
  (table) => [
    index("user_subscriptions_user_id_idx").on(table.user_id),
    index("user_subscriptions_status_idx").on(table.status),
    index("user_subscriptions_plan_type_idx").on(table.plan_type),
    index("user_subscriptions_expires_at_idx").on(table.expires_at),
    index("user_subscriptions_external_id_idx").on(
      table.external_subscription_id
    ),
  ]
);

export type UserSubscriptionSelect = typeof UserSubscription.$inferSelect;
export type UserSubscriptionInsert = typeof UserSubscription.$inferInsert;
