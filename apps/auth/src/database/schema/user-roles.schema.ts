import { InferInsertModel, InferSelectModel, sql } from "drizzle-orm";
import {
  bigint,
  index,
  integer,
  pgTable,
  primaryKey,
} from "drizzle-orm/pg-core";

/**
 * Bảng `user_roles`: Bảng trung gian cho mối quan hệ many-to-many giữa users và roles.
 */
export const userRoles = pgTable(
  "user_roles",
  {
    userId: bigint("user_id", { mode: "number" }).notNull().default(0), // Tham chiếu logic tới users.id
    roleId: integer("role_id").notNull().default(0), // Tham chiếu logic tới roles.id
    assignedAt: bigint("assigned_at", { mode: "number" })
      .notNull()
      .default(sql`extract(epoch from now())`),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.roleId] }),
    index("idx_user_roles_user_id").on(table.userId),
    index("idx_user_roles_role_id").on(table.roleId),
  ]
);

export type NewUserRole = InferInsertModel<typeof userRoles>;
export type UserRole = InferSelectModel<typeof userRoles>;
