import { createErrorResponse, createSuccessResponse } from "@repo/common";
import { AuthService } from "../services/auth.service";

type JwtVerifyFunction = (
  token: string
) => Promise<Record<string, unknown> | false>;
type JwtSignFunction = (
  payload: Record<string, string | number | boolean | string[] | undefined>
) => Promise<string>;

/**
 * Token Controller xử lý các yêu cầu liên quan đến token
 */
export class TokenController {
  private static instance: TokenController;
  private authService: AuthService;

  private constructor() {
    this.authService = AuthService.getInstance();
  }

  /**
   * Lấy instance của TokenController
   */
  public static getInstance(): TokenController {
    if (!TokenController.instance) {
      TokenController.instance = new TokenController();
    }
    return TokenController.instance;
  }

  /**
   * Làm mới token
   * @param refreshToken Refresh token
   * @param verify Hàm xác thực token
   * @param sign Hàm tạo token mới
   */
  public async refreshToken(
    refreshToken: string,
    verify: JwtVerifyFunction,
    sign: JwtSignFunction
  ) {
    try {
      const result = await this.authService.refreshToken(
        refreshToken,
        verify,
        sign
      );
      return createSuccessResponse(result, "Làm mới token thành công");
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
   * @param refreshToken Refresh token cần thu hồi
   * @param verify Hàm xác thực token
   */
  public async logout(refreshToken: string, verify: JwtVerifyFunction) {
    try {
      await this.authService.logout(refreshToken, verify);
      return createSuccessResponse(null, "Đăng xuất thành công");
    } catch (error) {
      return createErrorResponse("Đăng xuất thất bại");
    }
  }
}

// Export instance để sử dụng trực tiếp
export const tokenController = TokenController.getInstance();
