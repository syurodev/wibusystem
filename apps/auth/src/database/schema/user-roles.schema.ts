import { sql } from "drizzle-orm";
import {
  bigint,
  index,
  integer,
  pgTable,
  primaryKey,
} from "drizzle-orm/pg-core";
import { t, type Static } from "elysia";

// Bảng Drizzle cho user_roles (bảng map many-to-many)
export const UserRolesSchema = pgTable(
  "user_roles",
  {
    user_id: bigint("user_id", { mode: "bigint" }).notNull(), // Tham chiếu logic tới users.id
    role_id: integer("role_id").notNull(), // Tham chiếu logic tới roles.id
    assigned_at: bigint("assigned_at", { mode: "bigint" })
      .notNull()
      .default(sql`EXTRACT(EPOCH FROM NOW())::bigint`),
  },
  (table) => [
    primaryKey({ columns: [table.user_id, table.role_id] }),
    index("idx_user_roles_user_id").on(table.user_id),
    index("idx_user_roles_role_id").on(table.role_id),
  ]
);

// --- Định nghĩa thủ công các Schema TypeBox ---

const UserRoleBaseProperties = {
  user_id: t.Number({ description: "User ID" }),
  role_id: t.Number({ description: "Role ID" }),
  assigned_at: t.Number({
    description: "Timestamp when the role was assigned to the user",
  }),
};

export const UserRoleSelectSchema = t.Object(UserRoleBaseProperties, {
  $id: "UserRoleSelect",
  description: "Represents a user-role mapping record",
});
export type UserRoleSelect = Static<typeof UserRoleSelectSchema>;

// Khi gán vai trò cho người dùng, chỉ cần user_id và role_id
// assigned_at sẽ được quản lý tự động
const UserRoleInsertProperties = {
  user_id: t.Number({ description: "ID of the user to assign the role" }),
  role_id: t.Number({ description: "ID of the role to be assigned" }),
};

export const UserRoleInsertSchema = t.Object(UserRoleInsertProperties, {
  $id: "UserRoleInsert",
  description: "Schema for assigning a role to a user",
});
export type UserRoleInsert = Static<typeof UserRoleInsertSchema>;

// Thông thường không có nhu cầu "cập nhật" một bản ghi user_roles.
// Nếu muốn thay đổi vai trò của user, sẽ là xóa bản ghi cũ và tạo bản ghi mới.
// Do đó, không cần UserRoleUpdateSchema.
