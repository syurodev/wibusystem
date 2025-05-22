import { createSuccessResponse } from "@repo/common";
import { UserLoginDtoType, UserRegisterDtoType } from "../dtos";
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
}

// Export instance để sử dụng trực tiếp
export const authController = AuthController.getInstance();
