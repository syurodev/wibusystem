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

// Bảng Drizzle cho roles
export const RolesSchema = pgTable(
  "roles",
  {
    id: serial("id").primaryKey(), // serial vì đây là bảng danh mục, không cần bigint
    name: varchar("name", { length: 50 }).notNull().unique(),
    description: text("description"), // Có thể null
    created_at: bigint("created_at", { mode: "bigint" })
      .notNull()
      .default(sql`EXTRACT(EPOCH FROM NOW())::bigint`),
    updated_at: bigint("updated_at", { mode: "bigint" })
      .notNull()
      // .$onUpdate(() => sql`EXTRACT(EPOCH FROM NOW())::bigint`), // Bật nếu muốn tự động cập nhật khi bản ghi thay đổi
      // Nếu không dùng $onUpdate, cần cập nhật thủ công ở tầng service
      // Để đơn giản và nhất quán với created_at, có thể tạm thời dùng default giống created_at
      // Hoặc, theo đúng tinh thần của updated_at, nó nên được cập nhật khi có thay đổi.
      // Chọn $onUpdate là tốt nhất cho updated_at.
      .$onUpdate(() => sql`EXTRACT(EPOCH FROM NOW())::bigint`),
  },
  (table) => [index("idx_roles_name").on(table.name)]
);

// --- Định nghĩa thủ công các Schema TypeBox ---

const RoleBaseProperties = {
  id: t.Number({ description: "Role ID" }),
  name: t.String({
    description: "Unique name of the role (e.g., ADMIN, USER)",
  }),
  description: t.Optional(
    t.String({ description: "Optional description of the role" })
  ),
  created_at: t.Number({ description: "Timestamp of role creation" }),
  updated_at: t.Number({ description: "Timestamp of last role update" }),
};

export const RoleSelectSchema = t.Object(RoleBaseProperties, {
  $id: "RoleSelect",
  description: "Represents a role record",
});
export type RoleSelect = Static<typeof RoleSelectSchema>;

const RoleInsertProperties = {
  name: t.String({ minLength: 1, description: "Name for the new role" }),
  description: t.Optional(
    t.String({ description: "Description for the new role" })
  ),
  // id, created_at, updated_at sẽ được quản lý tự động
};

export const RoleInsertSchema = t.Object(RoleInsertProperties, {
  $id: "RoleInsert",
  description: "Schema for creating a new role",
});
export type RoleInsert = Static<typeof RoleInsertSchema>;

// Schema cho việc cập nhật Role (ví dụ: chỉ cho phép cập nhật description)
const RoleUpdateProperties = {
  description: t.Optional(t.String()),
  // name thường không nên cho phép thay đổi dễ dàng vì nó là unique identifier
  // Nếu muốn cho phép đổi name, cần xử lý cẩn thận ở service
};

export const RoleUpdateSchema = t.Partial(t.Object(RoleUpdateProperties), {
  $id: "RoleUpdate",
  description: "Schema for updating an existing role (e.g., description)",
});
export type RoleUpdate = Static<typeof RoleUpdateSchema>;
