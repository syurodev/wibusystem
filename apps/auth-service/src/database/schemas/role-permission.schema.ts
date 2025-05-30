import {
  bigint,
  index,
  integer,
  pgTable,
  serial,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Bảng liên kết giữa vai trò và quyền
 * Cho phép xác định mỗi vai trò có những quyền gì
 */
export const RolePermission = pgTable(
  "role_permission",
  {
    id: serial("id").primaryKey(), // ID của liên kết, khóa chính
    role_id: integer("role_id").notNull().default(0), // Liên kết đến bảng Role
    permission_id: integer("permission_id").notNull().default(0), // Liên kết đến bảng Permission
    created_at: bigint("created_at", { mode: "number" }).notNull().default(0), // Thời gian tạo, dạng unix time
  },
  (table) => [
    index("role_permission_role_id_idx").on(table.role_id), // Index cho role_id để tìm kiếm nhanh
    index("role_permission_permission_id_idx").on(table.permission_id), // Index cho permission_id để tìm kiếm nhanh
    uniqueIndex("role_permission_unique_idx").on(
      table.role_id,
      table.permission_id
    ), // Đảm bảo không có sự kết hợp trùng lặp
  ]
);

export type RolePermissionSelect = typeof RolePermission.$inferSelect;
export type RolePermissionInsert = typeof RolePermission.$inferInsert;
