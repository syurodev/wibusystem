import { createErrorResponse, createSuccessResponse } from "@repo/common";
import { AuthService } from "../services/auth.service";

/**
 * Password Controller xử lý các yêu cầu liên quan đến mật khẩu
 */
export class PasswordController {
  private static instance: PasswordController;
  private authService: AuthService;

  private constructor() {
    this.authService = AuthService.getInstance();
  }

  /**
   * Lấy instance của PasswordController
   */
  public static getInstance(): PasswordController {
    if (!PasswordController.instance) {
      PasswordController.instance = new PasswordController();
    }
    return PasswordController.instance;
  }

  /**
   * Yêu cầu đặt lại mật khẩu
   */
  public async requestResetPassword(email: string) {
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
   */
  public async resetPassword(email: string, otp: string, newPassword: string) {
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
export const passwordController = PasswordController.getInstance();
