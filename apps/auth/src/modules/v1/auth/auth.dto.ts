import { t } from "elysia";

export namespace AuthDto {
  export const registerAccountSchema = t.Object({
    email: t.String({
      format: "email",
    }),
    password: t.String({
      minLength: 8,
      maxLength: 255,
    }),
  });

  export type RegisterAccountSchema = typeof registerAccountSchema.static;

  // Device fingerprint schema
  export const deviceFingerprintSchema = t.Object({
    deviceInfo: t.String(),
  });

  export type DeviceFingerprintSchema = typeof deviceFingerprintSchema.static;

  export const deviceLinkSchema = t.Object({
    user_id: t.String(),
    access_token: t.String(),
    refresh_token: t.String(),
  });

  export type DeviceLinkSchema = typeof deviceLinkSchema.static;
}
