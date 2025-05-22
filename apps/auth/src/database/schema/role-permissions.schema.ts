import { InferInsertModel, InferSelectModel, sql } from "drizzle-orm";
import {
  bigint,
  index,
  integer,
  pgTable,
  primaryKey,
} from "drizzle-orm/pg-core";

/**
 * Bảng `role_permissions`: Bảng trung gian cho mối quan hệ many-to-many giữa roles và permissions.
 */
export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: integer("role_id").notNull().default(0), // Tham chiếu logic tới roles.id
    permissionId: integer("permission_id").notNull().default(0), // Tham chiếu logic tới permissions.id
    assignedAt: bigint("assigned_at", { mode: "number" })
      .notNull()
      .default(sql`extract(epoch from now())`),
  },
  (table) => [
    primaryKey({ columns: [table.roleId, table.permissionId] }),
    index("idx_role_permissions_role_id").on(table.roleId),
    index("idx_role_permissions_permission_id").on(table.permissionId),
  ]
);

export type NewRolePermission = InferInsertModel<typeof rolePermissions>;
export type RolePermission = InferSelectModel<typeof rolePermissions>;
