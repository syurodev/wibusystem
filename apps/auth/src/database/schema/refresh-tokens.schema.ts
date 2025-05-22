import { InferInsertModel, InferSelectModel, sql } from "drizzle-orm";
import {
  bigint,
  bigserial,
  index,
  pgTable,
  smallint,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Bảng `refresh_tokens`: Lưu trữ thông tin về các refresh token.
 */
export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: bigint("user_id", { mode: "number" }).notNull().default(0), // Tham chiếu logic tới users.id
    tokenHash: varchar("token_hash", { length: 255 }).notNull().default(""),
    familyId: uuid("family_id")
      .notNull()
      .default(sql`gen_random_uuid()`), // ID để nhóm các token xoay vòng (token cũ và token mới sau khi xoay vòng)
    userDeviceId: bigint("user_device_id", { mode: "number" }).default(0), // Tham chiếu logic tới user_devices.id. Nullable nếu token không gắn với thiết bị cụ thể.
    deviceInfo: text("device_info").default(""),
    ipAddress: varchar("ip_address", { length: 45 }).default(""),
    isActive: smallint("is_active").notNull().default(1),
    expiresAt: bigint("expires_at", { mode: "number" }).notNull().default(0),
    createdAt: bigint("created_at", { mode: "number" })
      .notNull()
      .default(sql`extract(epoch from now())`),
    revokedAt: bigint("revoked_at", { mode: "number" }).default(0),
  },
  (table) => [
    index("idx_refresh_tokens_user_id").on(table.userId),
    uniqueIndex("idx_refresh_tokens_token_hash").on(table.tokenHash),
    index("idx_refresh_tokens_family_id").on(table.familyId),
    index("idx_refresh_tokens_user_device_id").on(table.userDeviceId),
    index("idx_refresh_tokens_expires_at").on(table.expiresAt),
  ]
);

export type NewRefreshToken = InferInsertModel<typeof refreshTokens>;
export type RefreshToken = InferSelectModel<typeof refreshTokens>;
