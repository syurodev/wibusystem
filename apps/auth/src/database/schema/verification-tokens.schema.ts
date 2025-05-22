import { InferInsertModel, InferSelectModel, sql } from "drizzle-orm";
import {
  bigint,
  bigserial,
  index,
  pgTable,
  smallint,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

// It is recommended to define VerificationTokenType in a shared enum file e.g., apps/auth/src/types/enums.ts
// export enum VerificationTokenType {
//   EMAIL_VERIFICATION = 0,
//   PHONE_VERIFICATION = 1,
//   // Add other types as needed
// }

/**
 * Bảng `verification_tokens`: Lưu trữ các token dùng cho các mục đích xác thực khác nhau
 * như xác thực email, xác thực số điện thoại, v.v.
 */
export const verificationTokens = pgTable(
  "verification_tokens",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: bigint("user_id", { mode: "number" }).notNull().default(0), // Tham chiếu logic tới users.id

    /**
     * Loại token xác thực. Ví dụ: 0 cho EMAIL_VERIFICATION, 1 cho PHONE_VERIFICATION.
     * Nên sử dụng enum VerificationTokenType được định nghĩa ở apps/auth/src/types/enums.ts.
     */
    tokenType: smallint("token_type").notNull().default(0),

    tokenHash: varchar("token_hash", { length: 255 }).notNull().default(""), // Token đã được hash
    target: varchar("target", { length: 255 }).notNull().default(""), // Mục tiêu xác thực (ví dụ: địa chỉ email, số điện thoại)

    expiresAt: bigint("expires_at", { mode: "number" }).notNull().default(0), // Thời điểm token hết hạn
    isUsed: smallint("is_used").notNull().default(0), // 0: Chưa sử dụng, 1: Đã sử dụng
    usedAt: bigint("used_at", { mode: "number" }).default(0), // Thời điểm token được sử dụng

    createdAt: bigint("created_at", { mode: "number" })
      .notNull()
      .default(sql`extract(epoch from now())`),
  },
  (table) => [
    index("idx_verification_tokens_user_id").on(table.userId),
    uniqueIndex("idx_verification_tokens_hash").on(table.tokenHash), // Token hash nên là unique
    index("idx_verification_tokens_type_target").on(
      table.tokenType,
      table.target
    ),
    index("idx_verification_tokens_expires_at").on(table.expiresAt),
  ]
);

export type NewVerificationToken = InferInsertModel<typeof verificationTokens>;
export type VerificationToken = InferSelectModel<typeof verificationTokens>;
