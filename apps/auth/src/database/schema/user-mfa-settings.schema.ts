import { InferInsertModel, InferSelectModel, sql } from "drizzle-orm";
import {
  bigint,
  bigserial,
  index,
  pgTable,
  smallint,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// It is recommended to define MfaMethodType in a shared enum file e.g., apps/auth/src/types/enums.ts
// export enum MfaMethodType {
//   TOTP = 0,
//   SMS = 1,
//   // Add other methods as needed
// }

/**
 * Bảng \`user_mfa_settings\`: Lưu trữ cài đặt xác thực đa yếu tố (MFA) cho người dùng.
 * Mỗi người dùng có thể có nhiều phương thức MFA được kích hoạt (ví dụ: TOTP, SMS).
 */
export const userMfaSettings = pgTable(
  "user_mfa_settings",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: bigint("user_id", { mode: "number" }).notNull().default(0), // Tham chiếu logic tới users.id

    /**
     * Loại phương thức MFA. Ví dụ: 0 cho TOTP, 1 cho SMS.
     * Nên sử dụng enum MfaMethodType được định nghĩa ở apps/auth/src/types/enums.ts.
     */
    methodType: smallint("method_type").notNull().default(0),

    // Đối với TOTP, đây là secret đã được mã hóa.
    // Đối với SMS, đây có thể là số điện thoại đã được mã hóa hoặc một tham chiếu.
    secretKey: text("secret_key").notNull().default(""),

    isEnabled: smallint("is_enabled").notNull().default(0), // 0: Vô hiệu hóa, 1: Kích hoạt

    verifiedAt: bigint("verified_at", { mode: "number" }).default(0), // Thời điểm phương thức này được xác minh và kích hoạt

    createdAt: bigint("created_at", { mode: "number" })
      .notNull()
      .default(sql`extract(epoch from now())`),
    updatedAt: bigint("updated_at", { mode: "number" })
      .notNull()
      .default(sql`extract(epoch from now())`)
      .$onUpdate(() => sql`extract(epoch from now())`),
  },
  (table) => [
    index("idx_user_mfa_settings_user_id").on(table.userId),
    uniqueIndex("idx_user_mfa_user_method").on(table.userId, table.methodType), // Đảm bảo mỗi người dùng chỉ có một cài đặt cho mỗi loại MFA
    index("idx_user_mfa_settings_method_type").on(table.methodType),
    index("idx_user_mfa_settings_is_enabled").on(table.isEnabled),
  ]
);

export type NewUserMfaSettings = InferInsertModel<typeof userMfaSettings>;
export type UserMfaSettings = InferSelectModel<typeof userMfaSettings>;
