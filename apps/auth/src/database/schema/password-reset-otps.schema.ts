import { InferInsertModel, InferSelectModel, sql } from "drizzle-orm";
import {
  bigint,
  bigserial,
  index,
  pgTable,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Bảng `password_reset_otps`: Lưu trữ mã OTP/token cho việc đặt lại mật khẩu.
 */
export const passwordResetOtps = pgTable(
  "password_reset_otps",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: bigint("user_id", { mode: "number" }).notNull().default(0),
    otpHash: varchar("otp_hash", { length: 255 }).notNull().default(""),
    expiresAt: bigint("expires_at", { mode: "number" }).notNull().default(0),
    usedAt: bigint("used_at", { mode: "number" }).default(0),
    createdAt: bigint("created_at", { mode: "number" })
      .notNull()
      .default(sql`extract(epoch from now())`),
  },
  (table) => [
    index("idx_password_reset_otps_user_id").on(table.userId),
    index("idx_password_reset_otps_otp_hash").on(table.otpHash),
    index("idx_password_reset_otps_expires_at").on(table.expiresAt),
  ]
);

export type NewPasswordResetOtp = InferInsertModel<typeof passwordResetOtps>;
export type PasswordResetOtp = InferSelectModel<typeof passwordResetOtps>;
