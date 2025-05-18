import { sql } from "drizzle-orm";
import {
  bigint,
  bigserial,
  index,
  pgTable,
  smallint,
  text,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { t, type Static } from "elysia";

// Bảng Drizzle cho refresh_tokens
export const RefreshTokensSchema = pgTable(
  "refresh_tokens",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    user_id: bigint("user_id", { mode: "bigint" }).notNull(),
    token_hash: varchar("token_hash", { length: 255 }).notNull().unique(),
    family_id: uuid("family_id").notNull(), // Để theo dõi chuỗi refresh token (rotation detection)
    device_info: text("device_info"), // User agent, etc. (optional)
    ip_address: varchar("ip_address", { length: 45 }), // (optional)
    is_active: smallint("is_active").notNull().default(1), // 1 = active, 0 = revoked/inactive
    expires_at: bigint("expires_at", { mode: "bigint" }).notNull(),
    created_at: bigint("created_at", { mode: "bigint" })
      .notNull()
      .default(sql`EXTRACT(EPOCH FROM NOW())::bigint`),
    revoked_at: bigint("revoked_at", { mode: "bigint" }), // Timestamp khi token bị thu hồi (optional)
  },
  (table) => [
    index("idx_refresh_tokens_user_id").on(table.user_id),
    index("idx_refresh_tokens_token_hash").on(table.token_hash),
    index("idx_refresh_tokens_family_id").on(table.family_id),
    index("idx_refresh_tokens_expires_at").on(table.expires_at),
  ]
);

// --- Định nghĩa thủ công các Schema TypeBox ---

const RefreshTokenBaseProperties = {
  id: t.Number({ description: "Refresh token record ID" }),
  user_id: t.Number({ description: "User ID owning the token" }),
  token_hash: t.String({ description: "Hashed value of the refresh token" }),
  family_id: t.String({
    format: "uuid",
    description: "Family ID for token rotation tracking",
  }),
  device_info: t.Optional(
    t.String({ description: "Device information (e.g., User Agent)" })
  ),
  ip_address: t.Optional(
    t.String({ description: "IP address when token was issued" })
  ),
  is_active: t.Integer({
    description: "Token status (1 for active, 0 for inactive)",
  }),
  expires_at: t.Number({ description: "Timestamp when the token expires" }),
  created_at: t.Number({ description: "Timestamp of token creation" }),
  revoked_at: t.Optional(
    t.Number({ description: "Timestamp when the token was revoked" })
  ),
};

export const RefreshTokenSelectSchema = t.Object(RefreshTokenBaseProperties, {
  $id: "RefreshTokenSelect",
  description: "Represents a refresh token record",
});
export type RefreshTokenSelect = Static<typeof RefreshTokenSelectSchema>;

// Khi tạo refresh token, service sẽ cung cấp hầu hết các trường
// trừ id (tự tạo), created_at (default), revoked_at (sẽ là null ban đầu)
const RefreshTokenInsertProperties = {
  user_id: t.Integer({ format: 'int64' }), // Sử dụng integer 64-bit cho bigint
  token_hash: t.String(),
  family_id: t.String({ format: "uuid" }),
  device_info: t.Optional(t.String()),
  ip_address: t.Optional(t.String()),
  is_active: t.Optional(t.Integer({ default: 1 })), // Mặc định là active khi tạo
  expires_at: t.Integer({ format: 'int64' }), // Sử dụng integer 64-bit cho timestamp
  // revoked_at không cần khi insert, sẽ là null
};

export const RefreshTokenInsertSchema = t.Object(RefreshTokenInsertProperties, {
  $id: "RefreshTokenInsert",
  description: "Schema for creating a new refresh token",
});
export type RefreshTokenInsert = Static<typeof RefreshTokenInsertSchema>;

// Không thường xuyên "cập nhật" toàn bộ refresh token.
// Thường là đánh dấu revoked (cập nhật is_active và revoked_at) hoặc xóa.
// Schema cho việc thu hồi một token cụ thể:
export const RevokeTokenUpdateSchema = t.Object(
  {
    is_active: t.Literal(0), // Set is_active to 0 (inactive)
    revoked_at: t.Number(), // Thời điểm thu hồi
  },
  {
    $id: "RevokeTokenUpdate",
    description:
      "Schema for revoking a refresh token by setting it inactive and recording revoke time",
  }
);
export type RevokeTokenUpdate = Static<typeof RevokeTokenUpdateSchema>;
