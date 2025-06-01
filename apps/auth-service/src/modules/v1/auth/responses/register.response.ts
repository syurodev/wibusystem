import { createSuccessResponseSchema } from "@repo/elysia-common";
import { t } from "elysia";
import { UserSelect } from "../../../../database/schemas";

export const registerDataSchema = t.Object({
  id: t.Number(),
  email: t.String({ format: "email" }),
});

export const registerResponseSchema =
  createSuccessResponseSchema(registerDataSchema);

export type RegisterData = typeof registerDataSchema.static;
export type RegisterResponseType = typeof registerResponseSchema.static;

export const registerResponse = (userData: UserSelect): RegisterData => ({
  id: userData.id,
  email: userData.email,
});
