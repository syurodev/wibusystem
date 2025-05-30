import {
  bigint,
  index,
  integer,
  pgTable,
  serial,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Bảng liên kết giữa người dùng và vai trò
 * Cho phép xác định mỗi người dùng có những vai trò gì
 */
export const UserRole = pgTable(
  "user_role",
  {
    id: serial("id").primaryKey(), // ID của liên kết, khóa chính
    user_id: integer("user_id").notNull().default(0), // Liên kết đến bảng User
    role_id: integer("role_id").notNull().default(0), // Liên kết đến bảng Role
    created_at: bigint("created_at", { mode: "number" }).notNull().default(0), // Thời gian tạo, dạng unix time
  },
  (table) => [
    index("user_role_user_id_idx").on(table.user_id), // Index cho user_id để tìm kiếm nhanh
    index("user_role_role_id_idx").on(table.role_id), // Index cho role_id để tìm kiếm nhanh
    uniqueIndex("user_role_unique_idx").on(table.user_id, table.role_id), // Đảm bảo không có sự kết hợp trùng lặp
  ]
);

export type UserRoleSelect = typeof UserRole.$inferSelect;
export type UserRoleInsert = typeof UserRole.$inferInsert;
