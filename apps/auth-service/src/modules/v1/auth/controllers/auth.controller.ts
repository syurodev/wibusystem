import { createCreatedResponse } from "@repo/common";
import { Elysia } from "elysia";
import {
  registerResponse,
  registerResponseSchema,
} from "../responses/register.response";
import { registerAccountSchema } from "../schemas/register-account.schema";
import { AuthService } from "../services/auth.service";

export const authController = new Elysia()
  .decorate("authService", new AuthService())
  .model({
    "body.auth.register": registerAccountSchema,
    "response.auth.register": registerResponseSchema,
  })
  .post(
    "/register",
    async ({ body, authService }) => {
      const result = await authService.registerAccount(body);
      return createCreatedResponse(registerResponse(result));
    },
    {
      body: "body.auth.register",
      response: "response.auth.register",
      detail: {
        summary: "Register a new account",
        description: "Register a new account",
        tags: ["Auth"],
      },
    }
  );
