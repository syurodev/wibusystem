import { sql } from "drizzle-orm";
import {
  bigint,
  index,
  pgTable,
  serial,
  text,
  varchar,
} from "drizzle-orm/pg-core";
import { t, type Static } from "elysia";

// Bảng Drizzle cho permissions
export const PermissionsSchema = pgTable(
  "permissions",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull().unique(), // e.g., "users:create", "posts:read_all"
    description: text("description"), // Có thể null
    group_name: varchar("group_name", { length: 50 }).notNull(), // e.g., "User Management", "Content"
    created_at: bigint("created_at", { mode: "bigint" })
      .notNull()
      .default(sql`EXTRACT(EPOCH FROM NOW())::bigint`),
    updated_at: bigint("updated_at", { mode: "bigint" })
      .notNull()
      .$onUpdate(() => sql`EXTRACT(EPOCH FROM NOW())::bigint`),
  },
  (table) => [
    index("idx_permissions_name").on(table.name),
    index("idx_permissions_group_name").on(table.group_name),
  ]
);

// --- Định nghĩa thủ công các Schema TypeBox ---

const PermissionBaseProperties = {
  id: t.Number({ description: "Permission ID" }),
  name: t.String({
    description: "Unique name of the permission (e.g., resource:action)",
  }),
  description: t.Optional(
    t.String({ description: "Optional description of the permission" })
  ),
  group_name: t.String({ description: "Grouping name for the permission" }),
  created_at: t.Number({ description: "Timestamp of permission creation" }),
  updated_at: t.Number({ description: "Timestamp of last permission update" }),
};

export const PermissionSelectSchema = t.Object(PermissionBaseProperties, {
  $id: "PermissionSelect",
  description: "Represents a permission record",
});
export type PermissionSelect = Static<typeof PermissionSelectSchema>;

const PermissionInsertProperties = {
  name: t.String({
    minLength: 1,
    description: "Name for the new permission (e.g., resource:action)",
    // pattern: "^[a-z0-9_]+:[a-z0-9_]+$", // Optional: regex pattern for name
  }),
  description: t.Optional(
    t.String({ description: "Description for the new permission" })
  ),
  group_name: t.String({
    minLength: 1,
    description: "Group name for the new permission",
  }),
  // id, created_at, updated_at sẽ được quản lý tự động
};

export const PermissionInsertSchema = t.Object(PermissionInsertProperties, {
  $id: "PermissionInsert",
  description: "Schema for creating a new permission",
});
export type PermissionInsert = Static<typeof PermissionInsertSchema>;

// Schema cho việc cập nhật Permission (ví dụ: description, group_name)
// name thường là cố định, không nên cho phép thay đổi dễ dàng.
const PermissionUpdateProperties = {
  description: t.Optional(t.String()),
  group_name: t.Optional(t.String({ minLength: 1 })),
};

export const PermissionUpdateSchema = t.Partial(
  t.Object(PermissionUpdateProperties),
  {
    $id: "PermissionUpdate",
    description: "Schema for updating an existing permission",
  }
);
export type PermissionUpdate = Static<typeof PermissionUpdateSchema>;
