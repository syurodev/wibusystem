import { InferInsertModel, InferSelectModel, sql } from "drizzle-orm";
import {
  bigint,
  bigserial,
  index,
  pgTable,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Bảng `user_social_accounts`: Lưu trữ thông tin liên kết tài khoản người dùng với các nhà cung cấp OAuth (ví dụ: Google, Facebook, GitHub).
 */
export const userSocialAccounts = pgTable(
  "user_social_accounts",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: bigint("user_id", { mode: "number" }).notNull().default(0), // Tham chiếu logic tới users.id

    providerName: varchar("provider_name", { length: 50 })
      .notNull()
      .default(""), // Ví dụ: 'google', 'facebook', 'github'
    providerUserId: varchar("provider_user_id", { length: 255 })
      .notNull()
      .default(""), // ID của người dùng từ nhà cung cấp

    // Thông tin hồ sơ tùy chọn từ nhà cung cấp, có thể không cần thiết nếu đã có trong bảng users
    email: varchar("email", { length: 255 }).default(""),
    displayName: varchar("display_name", { length: 255 }).default(""),
    avatarUrl: text("avatar_url").default(""),

    // Tokens (lưu trữ an toàn, ví dụ: mã hóa)
    // Cân nhắc xem có thực sự cần lưu trữ access/refresh token ở đây không, tùy thuộc vào luồng OAuth
    accessTokenHash: text("access_token_hash").default(""),
    refreshTokenHash: text("refresh_token_hash").default(""),
    scopes: text("scopes").default(""), // Các scope được cấp phép, ví dụ: 'email,profile'

    linkedAt: bigint("linked_at", { mode: "number" })
      .notNull()
      .default(sql`extract(epoch from now())`),
    updatedAt: bigint("updated_at", { mode: "number" })
      .notNull()
      .default(sql`extract(epoch from now())`)
      .$onUpdate(() => sql`extract(epoch from now())`),
  },
  (table) => [
    index("idx_user_social_accounts_user_id").on(table.userId),
    uniqueIndex("idx_user_social_provider_user").on(
      table.providerName,
      table.providerUserId
    ),
    index("idx_user_social_accounts_email").on(table.email), // Hữu ích nếu dùng email từ provider để tìm user
  ]
);

export type NewUserSocialAccount = InferInsertModel<typeof userSocialAccounts>;
export type UserSocialAccount = InferSelectModel<typeof userSocialAccounts>;
