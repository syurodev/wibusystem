import {
  bigint,
  bigserial,
  boolean,
  index,
  pgTable,
  smallint,
  text,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Bảng lưu địa chỉ của người dùng
 * Một người dùng có thể có nhiều địa chỉ cho thương mại điện tử
 */
export const UserAddress = pgTable(
  "user_addresses",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(), // ID địa chỉ, khóa chính
    user_id: bigint("user_id", { mode: "number" }).notNull().default(0), // Liên kết đến bảng User

    // Thông tin địa chỉ
    label: varchar("label", { length: 100 }).notNull().default(""), // Nhãn địa chỉ (Nhà riêng, Công ty, etc.)
    recipient_name: varchar("recipient_name", { length: 255 })
      .notNull()
      .default(""), // Tên người nhận
    phone_number: varchar("phone_number", { length: 20 }).notNull().default(""), // Số điện thoại người nhận

    // Địa chỉ chi tiết
    address_line_1: text("address_line_1").notNull().default(""), // Địa chỉ dòng 1
    address_line_2: text("address_line_2").notNull().default(""), // Địa chỉ dòng 2 (tùy chọn)
    city: varchar("city", { length: 100 }).notNull().default(""), // Thành phố
    state_province: varchar("state_province", { length: 100 })
      .notNull()
      .default(""), // Tỉnh/Bang
    postal_code: varchar("postal_code", { length: 20 }).notNull().default(""), // Mã bưu điện
    country: varchar("country", { length: 100 }).notNull().default(""), // Quốc gia
    country_code: varchar("country_code", { length: 2 }).notNull().default(""), // Mã quốc gia (VN, US, etc.)

    // Loại địa chỉ
    address_type: smallint("address_type").notNull().default(0), // Loại: 0: shipping, 1: billing, 2: both

    // Trạng thái
    is_default: boolean("is_default").notNull().default(false), // Địa chỉ mặc định
    is_active: boolean("is_active").notNull().default(true), // Địa chỉ đang hoạt động

    // Thông tin bổ sung
    delivery_instructions: text("delivery_instructions").notNull().default(""), // Hướng dẫn giao hàng

    created_at: bigint("created_at", { mode: "number" }).notNull().default(0), // Thời gian tạo
    updated_at: bigint("updated_at", { mode: "number" }).notNull().default(0), // Thời gian cập nhật
  },
  (table) => [
    index("user_addresses_user_id_idx").on(table.user_id),
    index("user_addresses_country_idx").on(table.country),
    index("user_addresses_is_default_idx").on(table.is_default),
    index("user_addresses_address_type_idx").on(table.address_type),
  ]
);

export type UserAddressSelect = typeof UserAddress.$inferSelect;
export type UserAddressInsert = typeof UserAddress.$inferInsert;
