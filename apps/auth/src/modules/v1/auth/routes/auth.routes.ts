import { AuthServiceApi } from "@repo/common";
import { Elysia } from "elysia";
import { jwtPlugin } from "../../../../plugins/jwt.plugin";
import { authController } from "../controllers/auth.controller";
import { Static } from "@sinclair/typebox";
import {
  LoginUserSchema,
  RegisterUserSchema,
} from "../validations/auth.validation";

// Lấy API definitions
const authApi = new AuthServiceApi("v1").getDefinition();

// Tạo một instance mới của Elysia với JWT plugin
const authApp = new Elysia().use(jwtPlugin);

/**
 * Routes xử lý đăng ký và đăng nhập
 */
export const authRoutes = (app: Elysia) =>
  app
    .use(authApp)
    // Đăng ký tài khoản mới
    .post(
      authApi.auth!.endpoints.AUTH_REGISTER!.subPath,
      async ({ body }: { body: Static<typeof RegisterUserSchema> }) => {
        return authController.register(body);
      },
      {
        body: RegisterUserSchema,
        detail: {
          summary: "Đăng ký tài khoản mới",
          tags: ["auth"],
        },
      }
    )
    // Đăng nhập
    .post(
      authApi.auth!.endpoints.AUTH_LOGIN!.subPath,
      async ({
        body,
        accessJwt,
      }: {
        body: Static<typeof LoginUserSchema>;
        accessJwt: {
          sign: (
            payload: Record<string, string | number | string[] | boolean | undefined>
          ) => Promise<string>;
        };
      }) => {
        return authController.login(body, accessJwt.sign);
      },
      {
        body: LoginUserSchema,
        detail: {
          summary: "Đăng nhập vào hệ thống",
          tags: ["auth"],
        },
      }
    );
