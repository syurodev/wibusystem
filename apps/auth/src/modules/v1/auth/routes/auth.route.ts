import { AuthServiceApi } from "@repo/common";
import { Elysia } from "elysia";
import { jwtPlugin, verifyAccessToken } from "../../../../plugins/jwt.plugin";
import { authController } from "../controllers/auth.controller";
import {
  UserLoginDto,
  UserLoginDtoType,
  UserRegisterDto,
  UserRegisterDtoType,
  RefreshTokenDto,
  RefreshTokenDtoType,
  LogoutDto,
  LogoutDtoType,
  ForgotPasswordDto,
  ForgotPasswordDtoType,
  ResetPasswordDto,
  ResetPasswordDtoType,
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
      "auth.refresh-token": RefreshTokenDto,
      "auth.logout": LogoutDto,
      "auth.forgot-password": ForgotPasswordDto,
      "auth.reset-password": ResetPasswordDto,
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
          summary: "Đăng nhập",
          tags: ["auth"],
        },
      }
    )
    .post(
      authApi.auth!.endpoints.AUTH_REFRESH_TOKEN!.subPath,
      async ({ body, request, ip }: { body: RefreshTokenDtoType; request: Request; ip?: { toString(): string } | string }) => {
        const ipAddress = ip?.toString() || null;
        const userAgent = request.headers.get('user-agent') || null;
        return authController.refreshToken(body, ipAddress, userAgent);
      },
      {
        body: "auth.refresh-token",
        detail: {
          summary: "Làm mới access token",
          tags: ["auth"],
        },
      }
    )
    .post(
      authApi.auth!.endpoints.AUTH_LOGOUT!.subPath,
      async ({ body, jwt }: { body: LogoutDtoType; jwt: any }) => {
        // API_GATEWAY đã xác thực token vì endpoint này đã được cấu hình là PROTECTED
        // Lấy thông tin user từ jwt object được truyền từ API Gateway
        const userId = Number(jwt.sub);
        const sessionId = jwt.session_id;
        
        return authController.logout(userId, sessionId, body);
      },
      {
        body: "auth.logout",
        detail: {
          summary: "Đăng xuất",
          tags: ["auth"],
        },
      }
    )
    .post(
      authApi.auth!.endpoints.AUTH_FORGOT_PASSWORD!.subPath,
      async ({ body }: { body: ForgotPasswordDtoType }) => {
        return authController.forgotPassword(body);
      },
      {
        body: "auth.forgot-password",
        detail: {
          summary: "Yêu cầu đặt lại mật khẩu",
          tags: ["auth"],
        },
      }
    )
    .post(
      authApi.auth!.endpoints.AUTH_RESET_PASSWORD!.subPath,
      async ({ body }: { body: ResetPasswordDtoType }) => {
        return authController.resetPassword(body);
      },
      {
        body: "auth.reset-password",
        detail: {
          summary: "Đặt lại mật khẩu mới",
          tags: ["auth"],
        },
      }
    );
