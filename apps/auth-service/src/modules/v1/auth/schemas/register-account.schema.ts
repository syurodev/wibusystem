import { t } from "elysia";

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
