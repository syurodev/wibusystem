import { UserStatus } from "@repo/common";
import { InferInsertModel, InferSelectModel, sql } from "drizzle-orm";
import {
  bigint,
  bigserial,
  index,
  pgTable,
  smallint,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Bảng `users`: Lưu trữ thông tin cơ bản của người dùng.
 */
export const users = pgTable(
  "users",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    email: varchar("email", { length: 255 }).notNull().default(""),
    hashedPassword: varchar("hashed_password", { length: 255 })
      .notNull()
      .default(""),
    accountStatus: smallint("account_status")
      .notNull()
      .default(UserStatus.INACTIVE),
    displayName: varchar("display_name", { length: 255 }).default(""),
    username: varchar("username", { length: 255 }).default(""),
    avatarUrl: text("avatar_url").default(""),
    coverUrl: text("cover_url").default(""),
    lastLoginAt: bigint("last_login_at", { mode: "number" }).default(0),
    emailVerifiedAt: bigint("email_verified_at", { mode: "number" }).default(0),
    createdAt: bigint("created_at", { mode: "number" })
      .notNull()
      .default(sql`extract(epoch from now())`),
    updatedAt: bigint("updated_at", { mode: "number" })
      .notNull()
      .default(sql`extract(epoch from now())`)
      .$onUpdate(() => sql`extract(epoch from now())`),
    deletedAt: bigint("deleted_at", { mode: "number" }).default(0),
  },
  (table) => [
    uniqueIndex("idx_users_email").on(table.email),
    index("idx_users_account_status").on(table.accountStatus),
    index("idx_users_username_fts").using(
      "gin",
      sql`to_tsvector('simple', ${table.username})`
    ),
    index("idx_users_display_name_fts").using(
      "gin",
      sql`to_tsvector('simple', ${table.displayName})`
    ),
  ]
);

export type NewUser = InferInsertModel<typeof users>;
export type User = InferSelectModel<typeof users>;
