import { sql } from "drizzle-orm";
import {
  bigint,
  bigserial,
  index,
  pgTable,
  varchar,
} from "drizzle-orm/pg-core";
import { t, type Static } from "elysia";

// Bảng Drizzle cho password_reset_otps
export const PasswordResetOtpsSchema = pgTable(
  "password_reset_otps",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    user_id: bigint("user_id", { mode: "bigint" }).notNull(),
    otp_hash: varchar("otp_hash", { length: 255 }).notNull(),
    expires_at: bigint("expires_at", { mode: "bigint" }).notNull(),
    used_at: bigint("used_at", { mode: "bigint" }), // Có thể null, được set khi OTP được sử dụng
    created_at: bigint("created_at", { mode: "bigint" })
      .notNull()
      .default(sql`EXTRACT(EPOCH FROM NOW())::bigint`),
  },
  // Cập nhật theo API mới của Drizzle
  (table) => [
    index("idx_password_reset_otps_user_id").on(table.user_id),
    index("idx_password_reset_otps_otp_hash").on(table.otp_hash),
    index("idx_password_reset_otps_expires_at").on(table.expires_at),
  ]
);

// --- Định nghĩa thủ công các Schema TypeBox ---

const PasswordResetOtpBaseProperties = {
  id: t.Number({ description: "OTP record ID" }),
  user_id: t.Number({ description: "User ID associated with the OTP" }),
  otp_hash: t.String({ description: "Hashed OTP value" }),
  expires_at: t.Number({ description: "Timestamp when the OTP expires" }),
  used_at: t.Optional(
    t.Number({ description: "Timestamp when the OTP was used" })
  ),
  created_at: t.Number({ description: "Timestamp of OTP creation" }),
};

export const PasswordResetOtpSelectSchema = t.Object(
  PasswordResetOtpBaseProperties,
  {
    $id: "PasswordResetOtpSelect",
    description: "Represents a password reset OTP record",
  }
);
export type PasswordResetOtpSelect = Static<
  typeof PasswordResetOtpSelectSchema
>;

// Khi tạo OTP, chúng ta chỉ cần user_id, otp_hash (do service tạo), và expires_at
// id, created_at, used_at sẽ được quản lý tự động hoặc cập nhật sau
const PasswordResetOtpInsertProperties = {
  user_id: t.Number(),
  otp_hash: t.String(),
  expires_at: t.Number(),
};

export const PasswordResetOtpInsertSchema = t.Object(
  PasswordResetOtpInsertProperties,
  {
    $id: "PasswordResetOtpInsert",
    description: "Schema for creating a new password reset OTP",
  }
);
export type PasswordResetOtpInsert = Static<
  typeof PasswordResetOtpInsertSchema
>;

// Có thể thêm các schema khác nếu cần, ví dụ schema để xác thực OTP
export const VerifyOtpSchema = t.Object({
  user_id: t.Number(), // Hoặc email tùy theo flow
  otp: t.String({ minLength: 6, maxLength: 6 }), // Giả sử OTP là 6 ký tự số
});
export type VerifyOtp = Static<typeof VerifyOtpSchema>;
