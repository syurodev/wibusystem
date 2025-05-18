import { sql } from "drizzle-orm";
import {
  bigint,
  index,
  integer,
  pgTable,
  primaryKey,
} from "drizzle-orm/pg-core";
import { t, type Static } from "elysia";

// Bảng Drizzle cho role_permissions (bảng map many-to-many)
export const RolePermissionsSchema = pgTable(
  "role_permissions",
  {
    role_id: integer("role_id").notNull(), // Tham chiếu logic tới roles.id
    permission_id: integer("permission_id").notNull(), // Tham chiếu logic tới permissions.id
    assigned_at: bigint("assigned_at", { mode: "bigint" })
      .notNull()
      .default(sql`EXTRACT(EPOCH FROM NOW())::bigint`),
  },
  (table) => [
    primaryKey({ columns: [table.role_id, table.permission_id] }),
    index("idx_role_permissions_role_id").on(table.role_id),
    index("idx_role_permissions_permission_id").on(table.permission_id),
  ]
);

// --- Định nghĩa thủ công các Schema TypeBox ---

const RolePermissionBaseProperties = {
  role_id: t.Number({ description: "Role ID" }),
  permission_id: t.Number({ description: "Permission ID" }),
  assigned_at: t.Number({
    description: "Timestamp when the permission was assigned to the role",
  }),
};

export const RolePermissionSelectSchema = t.Object(
  RolePermissionBaseProperties,
  {
    $id: "RolePermissionSelect",
    description: "Represents a role-permission mapping record",
  }
);
export type RolePermissionSelect = Static<typeof RolePermissionSelectSchema>;

const RolePermissionInsertProperties = {
  role_id: t.Number({ description: "ID of the role to assign the permission" }),
  permission_id: t.Number({
    description: "ID of the permission to be assigned",
  }),
};

export const RolePermissionInsertSchema = t.Object(
  RolePermissionInsertProperties,
  {
    $id: "RolePermissionInsert",
    description: "Schema for assigning a permission to a role",
  }
);
export type RolePermissionInsert = Static<typeof RolePermissionInsertSchema>;

// Tương tự user_roles, không cần RolePermissionUpdateSchema.
