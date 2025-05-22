import { InferInsertModel, InferSelectModel, sql } from "drizzle-orm";
import {
  bigint,
  bigserial,
  index,
  pgTable,
  smallint,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Bảng `user_mfa_backup_codes`: Lưu trữ các mã khôi phục (backup codes) cho MFA.
 * Mỗi mã chỉ có thể được sử dụng một lần.
 */
export const userMfaBackupCodes = pgTable(
  "user_mfa_backup_codes",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    // Tham chiếu logic tới userMfaSettings.id, cụ thể là của phương thức MFA (ví dụ: TOTP) mà các mã này thuộc về.
    userMfaSettingId: bigint("user_mfa_setting_id", { mode: "number" })
      .notNull()
      .default(0),

    codeHash: varchar("code_hash", { length: 255 }).notNull().default(""), // Mã backup đã được hash
    isUsed: smallint("is_used").notNull().default(0), // 0: Chưa sử dụng, 1: Đã sử dụng
    usedAt: bigint("used_at", { mode: "number" }).default(0), // Thời điểm mã được sử dụng

    createdAt: bigint("created_at", { mode: "number" })
      .notNull()
      .default(sql`extract(epoch from now())`),
  },
  (table) => [
    index("idx_user_mfa_backup_codes_setting_id").on(table.userMfaSettingId),
    index("idx_user_mfa_backup_codes_is_used").on(table.isUsed),
  ]
);

export type NewUserMfaBackupCodes = InferInsertModel<typeof userMfaBackupCodes>;
export type UserMfaBackupCodes = InferSelectModel<typeof userMfaBackupCodes>;
