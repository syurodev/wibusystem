import { t } from "elysia";

export namespace AuthResponse {
  export const registerDataSchema = t.Object({
    id: t.Any({}),
    email: t.String({
      format: "email",
    }),
  });

  export type RegisterData = typeof registerDataSchema.static;

  // Device token response schema
  export const deviceTokenSchema = t.Object({
    deviceToken: t.String(),
    deviceId: t.String(),
    fingerprint: t.String(),
    expiresAt: t.String(),
    createdAt: t.String(),
    isGuest: t.Boolean(),
  });

  export type DeviceTokenData = typeof deviceTokenSchema.static;

  // Device verification response schema
  export const deviceVerificationSchema = t.Object({
    isValid: t.Boolean(),
    deviceId: t.Number(),
    fingerprint: t.String(),
    confidence: t.Number(), // 0-1
    lastSeen: t.String(),
    isNewDevice: t.Boolean(),
  });

  export type DeviceVerificationData = typeof deviceVerificationSchema.static;
}
