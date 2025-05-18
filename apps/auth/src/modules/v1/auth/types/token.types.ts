/**
 * Interface cho Token Service
 */
export interface TokenService {
  /**
   * Tạo mới refresh token
   * @param userId ID của user
   * @param tokenFamilyId ID của token family (nếu có)
   */
  generateRefreshToken(
    userId: bigint,
    tokenFamilyId?: string
  ): Promise<{ token: string; expiresAt: Date }>;

  /**
   * Xác thực refresh token
   * @param token Refresh token cần xác thực
   * @returns Thông tin token nếu hợp lệ, null nếu không hợp lệ
   */
  verifyRefreshToken(
    token: string
  ): Promise<{
    userId: bigint;
    tokenId: bigint;
    familyId: string;
  } | null>;

  /**
   * Thu hồi refresh token
   * @param tokenId ID của token cần thu hồi
   */
  revokeToken(tokenId: bigint): Promise<void>;

  /**
   * Thu hồi tất cả refresh tokens của user
   * @param userId ID của user
   */
  revokeAllUserTokens(userId: bigint): Promise<void>;

  /**
   * Thu hồi tất cả refresh tokens trong cùng một family
   * @param familyId ID của token family
   */
  revokeTokenFamily(familyId: string): Promise<void>;
}

/**
 * Interface cho refresh token
 */
export interface RefreshTokenPayload {
  /** ID của token trong database */
  id: number;
  /** ID của user sở hữu token */
  userId: bigint;
  /** ID của token family (để thu hồi toàn bộ family) */
  familyId: string;
  /** Thời gian hết hạn */
  exp: number;
  /** Thời gian tạo token */
  iat: number;
}
