import { InferInsertModel, InferSelectModel, sql } from "drizzle-orm";
import {
  bigint,
  pgTable,
  serial,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Bảng `roles`: Định nghĩa các vai trò trong hệ thống.
 */
export const roles = pgTable(
  "roles",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 50 }).notNull(),
    description: text("description"),
    createdAt: bigint("created_at", { mode: "number" })
      .notNull()
      .default(sql`extract(epoch from now())`),
    updatedAt: bigint("updated_at", { mode: "number" })
      .notNull()
      .default(sql`extract(epoch from now())`)
      .$onUpdate(() => sql`extract(epoch from now())`),
  },
  (table) => [uniqueIndex("idx_roles_name").on(table.name)]
);

export type NewRole = InferInsertModel<typeof roles>;
export type Role = InferSelectModel<typeof roles>;
