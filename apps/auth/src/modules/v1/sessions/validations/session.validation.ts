/**
 * @file Validation schemas cho Session module (nếu cần).
 * @author Your Name
 */

import { t } from "elysia";

/**
 * Schema validation cho ID của session
 */
export const SessionIdParamSchema = t.Object(
  {
    sessionId: t.Numeric({
      error: "Session ID phải là số",
    }),
  },
  {
    description: "Parameter cho ID của session",
  }
);

/**
 * Schema validation cho refresh token family ID
 */
export const RefreshTokenFamilyIdSchema = t.Object(
  {
    familyId: t.String({
      format: "uuid",
      error: "Token family ID không hợp lệ",
    }),
  },
  {
    description: "Dữ liệu token family ID",
  }
);

// Ví dụ: Schema cho path parameter sessionId nếu cần validation chi tiết
// export const SessionIdParamSchema = t.Object({
//   sessionId: t.String({ format: "uuid" }) // Hoặc kiểu ID phù hợp
// });

// Hiện tại để trống theo kế hoạch
