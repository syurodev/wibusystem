import { AuthServiceApi } from "@repo/common";
import { Elysia } from "elysia";
import { jwtPlugin } from "../../../../plugins/jwt.plugin";
import { authController } from "../controllers/auth.controller";
import {
  UserLoginDto,
  UserLoginDtoType,
  UserRegisterDto,
  UserRegisterDtoType,
} from "../dtos";

// Lấy API definitions
const authApi = new AuthServiceApi("v1").getDefinition();

// Tạo một instance mới của Elysia với JWT plugin
const authApp = new Elysia().use(jwtPlugin);

/**
 * Routes xử lý đăng ký và đăng nhập
 */
export const authRoutes = (app: Elysia) =>
  app
    .model({
      "auth.register": UserRegisterDto,
      "auth.login": UserLoginDto,
    })
    .use(authApp)
    .post(
      authApi.auth!.endpoints.AUTH_REGISTER!.subPath,
      async ({ body, request, ip }: { body: UserRegisterDtoType; request: Request; ip?: { toString(): string } | string }) => {
        const ipAddress = ip?.toString() || null;
        const userAgent = request.headers.get('user-agent') || null;
        return authController.register(body, ipAddress, userAgent);
      },
      {
        body: "auth.register",
        detail: {
          summary: "Đăng ký tài khoản mới",
          tags: ["auth"],
        },
      }
    )
    .post(
      authApi.auth!.endpoints.AUTH_LOGIN!.subPath,
      async ({ body, request, ip }: { body: UserLoginDtoType; request: Request; ip?: { toString(): string } | string }) => {
        const ipAddress = ip?.toString() || null;
        const userAgent = request.headers.get('user-agent') || null;
        return authController.login(body, ipAddress, userAgent);
      },
      {
        body: "auth.login",
        detail: {
          summary: "Đăng nhập tài khoản",
          tags: ["auth"],
        },
      }
    );
