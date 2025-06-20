import { Elysia } from "elysia";
import { registerDataSchema } from "../responses/register.response";
import { registerAccountSchema } from "../schemas/register-account.schema";
import { AuthService } from "../services/auth.service";

export const authController = new Elysia({
  prefix: "/auth",
})
  .decorate("authService", new AuthService())
  .model({
    "body.auth.register": registerAccountSchema,
    "response.auth.register": registerDataSchema,
  })
  .post(
    "/register",
    ({ body, authService }) => {
      return {
        id: 10,
        email: "test@test.com",
      };
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
