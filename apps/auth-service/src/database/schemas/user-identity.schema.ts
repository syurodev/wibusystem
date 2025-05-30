import {
  bigint,
  index,
  integer,
  pgTable,
  serial,
  smallint,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Bảng lưu các phương thức xác thực của người dùng
 * Cho phép người dùng đăng nhập bằng nhiều phương thức khác nhau (email, số điện thoại, OAuth, ...)
 */
export const UserIdentity = pgTable(
  "user_identity",
  {
    id: serial("id").primaryKey(), // ID của bản ghi, khóa chính
    user_id: integer("user_id").notNull().default(0), // Liên kết đến bảng User
    identity_type: smallint("identity_type").notNull().default(0), // Loại phương thức xác thực: 0: email, 1: phone, 2: oauth
    identity_value: varchar("identity_value", { length: 255 })
      .notNull()
      .default(""), // Giá trị định danh (email, số điện thoại, id từ oauth provider)
    provider: varchar("provider", { length: 64 }).notNull().default(""), // Nhà cung cấp OAuth (google, facebook, github, ...)
    created_at: bigint("created_at", { mode: "number" }).notNull().default(0), // Thời gian tạo, dạng unix time
  },
  (table) => [
    index("user_identity_user_id_idx").on(table.user_id), // Index cho user_id để tìm kiếm nhanh
    index("user_identity_value_idx").on(table.identity_value), // Index cho identity_value để tìm kiếm nhanh
    index("user_identity_type_idx").on(table.identity_type), // Index cho identity_type để lọc theo loại
    index("user_identity_provider_idx").on(table.provider), // Index cho provider để lọc theo nhà cung cấp
    uniqueIndex("user_identity_unique_idx").on(
      table.identity_type,
      table.identity_value,
      table.provider
    ), // Đảm bảo không có định danh trùng lặp
  ]
);

export type UserIdentitySelect = typeof UserIdentity.$inferSelect;
export type UserIdentityInsert = typeof UserIdentity.$inferInsert;
