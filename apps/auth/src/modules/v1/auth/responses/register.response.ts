import { t } from "elysia";

export const registerDataSchema = t.Object({
  id: t.Any({}),
  email: t.String({
    format: "email",
  }),
});

export type RegisterData = typeof registerDataSchema.static;
