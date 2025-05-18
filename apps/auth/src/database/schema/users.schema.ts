import { sql } from "drizzle-orm";
import {
  bigint,
  bigserial,
  index,
  pgTable,
  smallint,
  text,
  varchar,
} from "drizzle-orm/pg-core";
// Không cần createSelectSchema, createInsertSchema từ drizzle-typebox nữa
import { t, type Static } from "elysia";

// Bảng usersTable định nghĩa lại theo database-design.md
export const UsersSchema = pgTable(
  "users",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    hashed_password: varchar("hashed_password", { length: 255 }).notNull(),
    account_status: smallint("account_status").notNull().default(0),
    full_name: varchar("full_name", { length: 255 }),
    avatar_url: text("avatar_url"),
    last_login_at: bigint("last_login_at", { mode: "bigint" }),
    created_at: bigint("created_at", { mode: "bigint" })
      .notNull()
      .default(sql`EXTRACT(EPOCH FROM NOW())::bigint`),
    updated_at: bigint("updated_at", { mode: "bigint" })
      .notNull()
      .$onUpdate(() => sql`EXTRACT(EPOCH FROM NOW())::bigint`),
  },
  (table) => [
    index("idx_users_email").on(table.email),
    index("idx_users_account_status").on(table.account_status),
  ]
);

// --- Định nghĩa thủ công các Schema TypeBox ---

// Schema cơ bản cho các thuộc tính của User (phản ánh dữ liệu từ DB)
// Lưu ý: BigInt từ DB sẽ được đại diện là t.Number() trong TypeBox cho API/validation
const UserBaseProperties = {
  id: t.Number({ description: "User ID" }),
  email: t.String({ format: "email", description: "User email" }),
  // hashed_password thường không được expose
  account_status: t.Integer({
    minimum: 0,
    description: "Account status enum value",
  }),
  full_name: t.Optional(t.String({ description: "User full name" })),
  avatar_url: t.Optional(
    t.String({ format: "url", description: "User avatar URL" })
  ),
  last_login_at: t.Optional(
    t.Number({ description: "Timestamp of last login" })
  ),
  created_at: t.Number({ description: "Timestamp of creation" }),
  updated_at: t.Number({ description: "Timestamp of last update" }),
};

export const UserSelectSchema = t.Object(UserBaseProperties, {
  $id: "UserSelect",
  description: "Represents a user record retrieved from the database",
});
export type UserSelect = Static<typeof UserSelectSchema>;

const UserInsertProperties = {
  email: t.String({
    format: "email",
    minLength: 1,
    description: "User email for registration",
  }),
  hashed_password: t.String({
    minLength: 8, // Ví dụ: yêu cầu mật khẩu tối thiểu 8 ký tự
    description: "Hashed password for the user",
  }),
  account_status: t.Optional(
    t.Integer({ minimum: 0, description: "Initial account status (optional)" })
  ), // Có default trong DB
  full_name: t.Optional(
    t.String({ minLength: 1, description: "User full name (optional)" })
  ),
  avatar_url: t.Optional(
    t.String({
      format: "url",
      description: "User avatar URL (optional)",
    })
  ),
  // id, created_at, updated_at, last_login_at không được cung cấp khi tạo user
};

export const UserInsertSchema = t.Object(UserInsertProperties, {
  $id: "UserInsert",
  description: "Schema for creating a new user",
});
export type UserInsert = Static<typeof UserInsertSchema>;

export const UserProfileUpdateSchema = t.Partial(
  t.Pick(t.Object(UserInsertProperties), ["full_name", "avatar_url"]),
  {
    $id: "UserProfileUpdate",
    description:
      "Schema for updating user profile information (full_name, avatar_url)",
  }
);
export type UserProfileUpdate = Static<typeof UserProfileUpdateSchema>;

export const UserPublicSelectSchema = t.Pick(
  UserSelectSchema,
  ["id", "full_name", "avatar_url", "created_at"],
  {
    $id: "UserPublicSelect",
    description: "Publicly available information about a user",
  }
);
export type UserPublicSelect = Static<typeof UserPublicSelectSchema>;

export const UserAccountStatusUpdateSchema = t.Object(
  {
    account_status: t.Integer({
      minimum: 0,
      description: "New account status enum value",
    }),
  },
  {
    $id: "UserAccountStatusUpdate",
    description: "Schema for updating a user's account status",
  }
);
export type UserAccountStatusUpdate = Static<
  typeof UserAccountStatusUpdateSchema
>;
