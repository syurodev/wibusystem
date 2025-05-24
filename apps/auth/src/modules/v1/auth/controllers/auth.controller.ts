import { createSuccessResponse } from "@repo/common";
import { ForgotPasswordDtoType, LogoutDtoType, RefreshTokenDtoType, ResetPasswordDtoType, UserLoginDtoType, UserRegisterDtoType } from "../dtos";
import { AuthService } from "../services/auth.service";

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
  public async register(body: UserRegisterDtoType, ipAddress: string | null, userAgent: string | null) {
    try {
      const user = await this.authService.register(body, ipAddress, userAgent);
      return createSuccessResponse(user, "Đăng ký thành công");
    } catch (error) {
      throw error;
    }
  }

  public async login(body: UserLoginDtoType, ipAddress: string | null, userAgent: string | null) {
    try {
      const user = await this.authService.login(body, ipAddress, userAgent);
      return createSuccessResponse(user, "Đăng nhập thành công");
    } catch (error) {
      throw error;
    }
  }

  /**
   * Làm mới access token
   * @param body Thông tin refresh token
   */
  public async refreshToken(body: RefreshTokenDtoType, ipAddress: string | null, userAgent: string | null) {
    try {
      // Triển khai tạm thời, sẽ cập nhật sau khi hoàn thiện AuthService
      return createSuccessResponse({
        accessToken: "new_access_token",
        refreshToken: "new_refresh_token",
        user: {
          id: 1,
          email: "user@example.com",
          displayName: "Example User"
        }
      }, "Token đã được làm mới");
    } catch (error) {
      throw error;
    }
  }

  /**
   * Đăng xuất người dùng
   * @param userId ID của người dùng đang đăng xuất
   * @param sessionId ID phiên hiện tại
   * @param body Thông tin đăng xuất
   */
  public async logout(userId: number, sessionId: string, body: LogoutDtoType) {
    try {
      // Triển khai tạm thời, sẽ cập nhật sau khi hoàn thiện AuthService
      const message = body.all_devices 
        ? "Đã đăng xuất khỏi tất cả thiết bị" 
        : "Đã đăng xuất";
        
      return createSuccessResponse({
        userId,
        sessionId,
        message
      }, message);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Yêu cầu đặt lại mật khẩu
   * @param body Thông tin yêu cầu
   */
  public async forgotPassword(body: ForgotPasswordDtoType) {
    try {
      // Triển khai tạm thời, sẽ cập nhật sau khi hoàn thiện AuthService
      const message = "Hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn";
      
      return createSuccessResponse({
        email: body.email,
        message
      }, message);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Đặt lại mật khẩu
   * @param body Thông tin đặt lại mật khẩu
   */
  public async resetPassword(body: ResetPasswordDtoType) {
    try {
      // Triển khai tạm thời, sẽ cập nhật sau khi hoàn thiện AuthService
      if (body.password !== body.password_confirmation) {
        throw new Error("Mật khẩu xác nhận không khớp");
      }
      
      const message = "Mật khẩu đã được đặt lại thành công";
      
      return createSuccessResponse({
        token: body.token,
        message
      }, message);
    } catch (error) {
      throw error;
    }
  }
}

// Export instance để sử dụng trực tiếp
export const authController = AuthController.getInstance();
