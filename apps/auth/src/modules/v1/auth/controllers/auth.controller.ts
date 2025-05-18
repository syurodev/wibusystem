import { createErrorResponse, createSuccessResponse } from "@repo/common";
import type { Static } from "@sinclair/typebox";
import type {
  LoginResult,
  RefreshTokenResult,
  RegisterResult,
} from "../../../../types/interfaces";
import { AuthService } from "../services/auth.service";
import {
  LoginUserSchema,
  RegisterUserSchema,
} from "../validations/auth.validation";

type JwtSignFunction = (
  payload: Record<string, string | number | string[] | boolean | undefined>
) => Promise<string>;

type JwtVerifyFunction = (
  token: string
) => Promise<Record<string, unknown> | false>;

// Tạo type từ schema validation
type RegisterUserType = Static<typeof RegisterUserSchema>;
type LoginUserType = Static<typeof LoginUserSchema>;

/**
 * Auth Controller xử lý các yêu cầu liên quan đến xác thực người dùng
 */
export class AuthController {
  private static instance: AuthController;
  private authService: AuthService;

  private constructor() {
    this.authService = AuthService.getInstance();
  }

  /**
   * Lấy instance của AuthController
   */
  public static getInstance(): AuthController {
    if (!AuthController.instance) {
      AuthController.instance = new AuthController();
    }
    return AuthController.instance;
  }

  /**
   * Đăng ký tài khoản mới
   * @param body Thông tin đăng ký
   */
  public async register(body: RegisterUserType): Promise<RegisterResult> {
    try {
      const user = await this.authService.register(body);
      return createSuccessResponse(user, "Đăng ký thành công");
    } catch (error) {
      if (error instanceof Error && error.message === "EMAIL_EXISTS") {
        return createErrorResponse("Email đã tồn tại trong hệ thống");
      }
      return createErrorResponse("Đăng ký thất bại");
    }
  }

  /**
   * Đăng nhập
   * @param body Thông tin đăng nhập
   * @param sign Hàm sign từ JWT plugin
   */
  public async login(
    body: LoginUserType,
    sign: JwtSignFunction
  ): Promise<LoginResult> {
    try {
      const result = await this.authService.login(body, sign);
      return createSuccessResponse(result, "Đăng nhập thành công");
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "INVALID_CREDENTIALS") {
          return createErrorResponse("Email hoặc mật khẩu không chính xác");
        }
        if (error.message === "UNAUTHORIZED") {
          return createErrorResponse(
            "Tài khoản đã bị khóa hoặc chưa kích hoạt"
          );
        }
      }
      return createErrorResponse("Đăng nhập thất bại");
    }
  }

  /**
   * Refresh token
   * @param token JWT refresh token
   * @param verify Hàm verify từ JWT plugin
   * @param sign Hàm sign từ JWT plugin
   */
  public async refreshToken(
    token: string,
    verify: JwtVerifyFunction,
    sign: JwtSignFunction
  ): Promise<RefreshTokenResult> {
    try {
      const result = await this.authService.refreshToken(token, verify, sign);
      return createSuccessResponse(result, "Refresh token thành công");
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message === "INVALID_TOKEN" ||
          error.message === "TOKEN_EXPIRED"
        ) {
          return createErrorResponse("Token không hợp lệ hoặc đã hết hạn");
        }
      }
      return createErrorResponse("Làm mới token thất bại");
    }
  }

  /**
   * Đăng xuất
   * @param token JWT refresh token
   * @param verify Hàm verify từ JWT plugin
   */
  public async logout(
    token: string,
    verify: JwtVerifyFunction
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.authService.logout(token, verify);
      return createSuccessResponse(null, "Đăng xuất thành công");
    } catch (error) {
      return createErrorResponse("Đăng xuất thất bại");
    }
  }

  /**
   * Yêu cầu đặt lại mật khẩu
   * @param email Email của tài khoản
   */
  public async requestPasswordReset(
    email: string
  ): Promise<{ success: boolean; message: string; otp?: string }> {
    try {
      const result = await this.authService.requestPasswordReset(email);
      return createSuccessResponse(
        result,
        "Nếu email tồn tại, một OTP sẽ được gửi đến email của bạn"
      );
    } catch (error) {
      return createErrorResponse("Yêu cầu đặt lại mật khẩu thất bại");
    }
  }

  /**
   * Đặt lại mật khẩu
   * @param email Email của tài khoản
   * @param otp OTP nhận được
   * @param newPassword Mật khẩu mới
   */
  public async resetPassword(
    email: string,
    otp: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.authService.resetPassword(email, otp, newPassword);
      return createSuccessResponse(null, "Đặt lại mật khẩu thành công");
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "USER_NOT_FOUND") {
          return createErrorResponse("Không tìm thấy tài khoản với email này");
        }
        if (error.message === "UNAUTHORIZED") {
          return createErrorResponse(
            "Tài khoản đã bị khóa hoặc chưa kích hoạt"
          );
        }
        if (error.message === "INVALID_OTP") {
          return createErrorResponse("OTP không hợp lệ hoặc đã hết hạn");
        }
      }
      return createErrorResponse("Đặt lại mật khẩu thất bại");
    }
  }
}

// Export instance để sử dụng trực tiếp
export const authController = AuthController.getInstance();
