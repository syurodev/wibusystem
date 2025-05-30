import {
  bigint,
  boolean,
  index,
  pgTable,
  serial,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Bảng lưu các quyền trong hệ thống
 * Quyền được sử dụng để kiểm soát truy cập vào các chức năng
 */
export const Permission = pgTable(
  "permissions",
  {
    id: serial("id").primaryKey(), // ID của quyền, khóa chính
    name: varchar("name", { length: 255 }).notNull().default("").unique(), // Tên quyền, phải duy nhất
    is_system: boolean("is_system").notNull().default(false), // Đánh dấu quyền hệ thống (không thể xóa)
    description: varchar("description", { length: 255 }).notNull().default(""), // Mô tả về quyền
    created_at: bigint("created_at", { mode: "number" }).notNull().default(0), // Thời gian tạo, dạng unix time
    updated_at: bigint("updated_at", { mode: "number" }).notNull().default(0), // Thời gian cập nhật gần nhất, dạng unix time
  },
  (table) => [
    index("permissions_name_idx").on(table.name), // Index cho tên quyền để tìm kiếm nhanh
    index("permissions_is_system_idx").on(table.is_system), // Index cho is_system để lọc quyền hệ thống
  ]
);

export type PermissionSelect = typeof Permission.$inferSelect;
export type PermissionInsert = typeof Permission.$inferInsert;
