import { sql } from "drizzle-orm";
import {
  bigint,
  bigserial,
  index, // Thêm index
  pgTable,
  smallint, // Thêm smallint cho is_active
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./users.schema";
// QUAN TRỌNG: Đảm bảo bạn đã tạo file user-devices.schema.ts và export userDevices từ đó
import { BOOLEAN } from "@repo/common";
import { userDevices } from "./user-devices.schema"; // Giả định tên bảng là userDevices

/**
 * Bảng `sessions`: Lưu trữ thông tin session của người dùng,
 * bao gồm cả thông tin refresh token đã được gộp.
 */
export const sessionsTable = pgTable(
  "sessions",
  {
    // Khóa chính tự tăng của bảng sessions
    id: bigserial("id", { mode: "number" }).primaryKey(),

    // Định danh session công khai (UUID)
    publicSessionId: uuid("public_session_id")
      .notNull()
      .unique()
      .defaultRandom(),

    // userId tham chiếu đến users.id (bigint)
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // userDeviceId tham chiếu đến user_devices.id (bigint)
    // Thay thế cho deviceId (varchar fingerprint) cũ
    userDeviceId: bigint("user_device_id", { mode: "number" })
      .notNull()
      .references(() => userDevices.id, { onDelete: "cascade" }), // QUAN TRỌNG: Kiểm tra tên bảng userDevices

    hashedRefreshToken: text("hashed_refresh_token").notNull(),

    // familyId để nhóm các token xoay vòng (token cũ và token mới sau khi xoay vòng)
    familyId: uuid("family_id")
      .notNull()
      .default(sql`gen_random_uuid()`),

    expiresAt: bigint("expires_at", { mode: "number" }).notNull(),

    createdAt: bigint("created_at", { mode: "number" })
      .notNull()
      .default(sql`extract(epoch from now())`),

    updatedAt: bigint("updated_at", { mode: "number" })
      .notNull()
      .default(sql`extract(epoch from now())`)
      .$onUpdate(() => sql`extract(epoch from now())`),

    revokedAt: bigint("revoked_at", { mode: "number" }).notNull().default(0),

    isActive: smallint("is_active").notNull().default(BOOLEAN.TRUE),
  },
  (table) => [
    index("idx_sessions_user_id").on(table.userId),
    index("idx_sessions_user_device_id").on(table.userDeviceId),
    index("idx_sessions_hashed_refresh_token").on(table.hashedRefreshToken),
    index("idx_sessions_family_id").on(table.familyId),
    index("idx_sessions_expires_at").on(table.expiresAt),
    index("idx_sessions_is_active").on(table.isActive),
  ]
);

export type SessionSchema = typeof sessionsTable.$inferSelect; // Type for querying
export type NewSessionSchema = typeof sessionsTable.$inferInsert; // Type for inserting
