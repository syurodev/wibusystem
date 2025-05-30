import {
  bigint,
  boolean,
  index,
  pgTable,
  serial,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Bảng lưu vai trò người dùng
 * Vai trò được sử dụng để phân quyền trong hệ thống
 */
export const Role = pgTable(
  "roles",
  {
    id: serial("id").primaryKey(), // ID của vai trò, khóa chính
    name: varchar("name", { length: 255 }).notNull().default("").unique(), // Tên vai trò, phải duy nhất
    is_system: boolean("is_system").notNull().default(false), // Đánh dấu vai trò hệ thống (không thể xóa)
    description: varchar("description", { length: 255 }).notNull().default(""), // Mô tả về vai trò
    created_at: bigint("created_at", { mode: "number" }).notNull().default(0), // Thời gian tạo, dạng unix time
    updated_at: bigint("updated_at", { mode: "number" }).notNull().default(0), // Thời gian cập nhật gần nhất, dạng unix time
  },
  (table) => [
    index("roles_name_idx").on(table.name), // Index cho tên vai trò để tìm kiếm nhanh
    index("roles_is_system_idx").on(table.is_system), // Index cho is_system để lọc vai trò hệ thống
  ]
);

export type RoleSelect = typeof Role.$inferSelect;
export type RoleInsert = typeof Role.$inferInsert;
