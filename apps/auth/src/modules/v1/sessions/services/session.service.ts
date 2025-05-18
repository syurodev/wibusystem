/**
 * @file Service cho Session module.
 * @author Your Name
 */

import { RefreshTokenSelect } from "../../../../database/schema";
import { RefreshTokenRepository } from "../../../../repositories/refresh-token.repository";

/**
 * Service quản lý phiên đăng nhập của người dùng
 */
export class SessionService {
  private static instance: SessionService;
  private readonly refreshTokenRepository: RefreshTokenRepository;

  private constructor() {
    this.refreshTokenRepository = RefreshTokenRepository.getInstance();
  }

  /**
   * Lấy instance của SessionService (Singleton)
   */
  public static getInstance(): SessionService {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService();
    }
    return SessionService.instance;
  }

  /**
   * Lấy danh sách phiên đang hoạt động của người dùng
   * @param userId ID của người dùng
   * @returns Danh sách các phiên đang hoạt động
   */
  public async getActiveSessions(
    userId: bigint
  ): Promise<RefreshTokenSelect[]> {
    try {
      const tokens = await this.refreshTokenRepository.findByUserId(
        userId,
        true
      );
      return tokens.map((token) => ({
        ...token,
        token_hash: undefined, // Không trả về hash token cho client
      }));
    } catch (error) {
      console.error("Error getting active sessions:", error);
      throw error;
    }
  }

  /**
   * Thu hồi một phiên cụ thể
   * @param userId ID của người dùng
   * @param refreshTokenId ID của refresh token cần thu hồi
   * @returns true nếu thu hồi thành công, false nếu không tìm thấy token
   */
  public async revokeSession(
    userId: bigint,
    refreshTokenId: bigint
  ): Promise<boolean> {
    try {
      // Kiểm tra xem token có tồn tại và thuộc về người dùng không
      const token = await this.refreshTokenRepository.findById(refreshTokenId);
      if (!token || token.user_id !== userId) {
        return false;
      }

      // Thu hồi token
      await this.refreshTokenRepository.markAsInactive(refreshTokenId);
      return true;
    } catch (error) {
      console.error("Error revoking session:", error);
      throw error;
    }
  }

  /**
   * Thu hồi tất cả các phiên khác của người dùng, ngoại trừ phiên hiện tại
   * @param userId ID của người dùng
   * @param currentRefreshTokenFamilyId Family ID của refresh token hiện tại (để không thu hồi phiên hiện tại)
   * @returns Số lượng phiên đã bị thu hồi
   */
  public async revokeAllOtherSessions(
    userId: bigint,
    currentRefreshTokenFamilyId: string
  ): Promise<number> {
    try {
      // Lấy tất cả token của người dùng
      const allTokens = await this.refreshTokenRepository.findByUserId(
        userId,
        true
      );

      // Thu hồi tất cả token không thuộc family hiện tại
      const tokensToRevoke = allTokens.filter(
        (token) => token.family_id !== currentRefreshTokenFamilyId
      );

      // Thu hồi từng token
      for (const token of tokensToRevoke) {
        await this.refreshTokenRepository.markAsInactive(token.id);
      }

      return tokensToRevoke.length;
    } catch (error) {
      console.error("Error revoking other sessions:", error);
      throw error;
    }
  }
}
