import { InferInsertModel, InferSelectModel, sql } from "drizzle-orm";
import {
  bigint,
  index,
  pgTable,
  serial,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Bảng `permissions`: Định nghĩa các quyền hạn chi tiết trong hệ thống.
 */
export const permissions = pgTable(
  "permissions",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull().default(""),
    description: text("description").default(""),
    groupName: varchar("group_name", { length: 50 }).notNull().default(""),
    createdAt: bigint("created_at", { mode: "number" })
      .notNull()
      .default(sql`extract(epoch from now())`),
    updatedAt: bigint("updated_at", { mode: "number" })
      .notNull()
      .default(sql`extract(epoch from now())`)
      .$onUpdate(() => sql`extract(epoch from now())`),
  },
  (table) => [
    uniqueIndex("idx_permissions_name").on(table.name),
    index("idx_permissions_group_name").on(table.groupName),
  ]
);

export type NewPermission = InferInsertModel<typeof permissions>;
export type Permission = InferSelectModel<typeof permissions>;
