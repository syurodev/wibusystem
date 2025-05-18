import { DateTime } from "luxon";
import { isAfter, now } from "@repo/common";
import { Elysia } from "elysia";
import { RefreshTokenRepository } from "../../../../repositories/refresh-token.repository";
import { TokenStatus } from "../../../../types/enums";
import {
  generateRandomToken,
  generateTokenFamilyId,
  hashToken,
} from "../../../../utils/token.util";
import {
  TokenService as ITokenService,
  RefreshTokenPayload,
} from "../types/token.types";

class TokenServiceImpl implements ITokenService {
  private refreshTokenRepo: RefreshTokenRepository;

  constructor() {
    this.refreshTokenRepo = RefreshTokenRepository.getInstance();
  }

  /**
   * Tạo mới refresh token
   */
  async generateRefreshToken(
    userId: bigint,
    tokenFamilyId?: string
  ): Promise<{ token: string; expiresAt: Date }> {
    const refreshToken = generateRandomToken();
    const refreshTokenHash = hashToken(refreshToken);

    // Nếu không có tokenFamilyId, tạo mới
    if (!tokenFamilyId) {
      tokenFamilyId = generateTokenFamilyId();
    }

    // Thời gian hết hạn (30 ngày)
    const currentTime = now();
    const expiresAt = currentTime.plus({ days: 30 });
    const expiresAtTimestamp = BigInt(expiresAt.toSeconds());

    // Lưu refresh token vào database
    const savedToken = await this.refreshTokenRepo.save({
      user_id: userId as unknown as number, // Ép kiểu tạm thời vì schema đang dùng number
      token_hash: refreshTokenHash,
      family_id: tokenFamilyId,
      is_active: TokenStatus.ACTIVE as unknown as number, // Ép kiểu tạm thời
      expires_at: expiresAtTimestamp as unknown as number, // Ép kiểu tạm thời
    });

    return {
      token: refreshToken,
      expiresAt: expiresAt.toJSDate(),
    } as { token: string; expiresAt: Date };
  }

  /**
   * Xác thực refresh token
   */
  async verifyRefreshToken(token: string): Promise<{
    userId: bigint;
    tokenId: bigint;
    familyId: string;
  } | null> {
    try {
      const tokenHash = hashToken(token);
      const tokenRecord = await this.refreshTokenRepo.findByHash(tokenHash);

      // Kiểm tra token có tồn tại và còn hiệu lực không
      if (!tokenRecord || tokenRecord.is_active !== TokenStatus.ACTIVE) {
        return null;
      }

      // Kiểm tra hạn sử dụng
      const expiresAt = now().plus({ seconds: Number(tokenRecord.expires_at) });
      if (isAfter(now(), expiresAt)) {
        return null;
      }

      return {
        userId: BigInt(tokenRecord.user_id),
        tokenId: BigInt(tokenRecord.id),
        familyId: tokenRecord.family_id,
      };
    } catch (error) {
      console.error("Error verifying refresh token:", error);
      return null;
    }
  }

  /**
   * Thu hồi refresh token
   */
  async revokeToken(tokenId: bigint): Promise<void> {
    await this.refreshTokenRepo.update(tokenId, {
      is_active: TokenStatus.REVOKED,
      revoked_at: BigInt(now().toSeconds()),
    });
  }

  /**
   * Thu hồi tất cả refresh tokens của user
   */
  async revokeAllUserTokens(userId: bigint): Promise<void> {
    const tokens = await this.refreshTokenRepo.findByUserId(userId);
    const currentTime = now();
    const timestamp = BigInt(currentTime.toSeconds());
    await Promise.all(
      tokens
        .filter((token) => token.is_active === TokenStatus.ACTIVE)
        .map((token) =>
          this.refreshTokenRepo.update(BigInt(token.id), {
            is_active: TokenStatus.REVOKED as unknown as number,
            revoked_at: timestamp,
          })
        )
    );
  }

  /**
   * Thu hồi tất cả refresh tokens trong cùng một family
   */
  async revokeTokenFamily(familyId: string): Promise<void> {
    // Lấy tất cả tokens trong family
    const allTokens = await this.refreshTokenRepo.find({});
    const currentTime = now();
    const timestamp = BigInt(currentTime.toSeconds());
    await Promise.all(
      allTokens
        .filter(
          (token) =>
            token.family_id === familyId &&
            token.is_active === TokenStatus.ACTIVE
        )
        .map((token) =>
          this.refreshTokenRepo.update(BigInt(token.id), {
            is_active: TokenStatus.REVOKED,
            revoked_at: timestamp,
          })
        )
    );
  }

  /**
   * Tạo payload cho refresh token JWT
   */
  createRefreshTokenPayload(
    userId: bigint,
    tokenId: bigint,
    familyId: string
  ): RefreshTokenPayload {
    const currentTime = now();

    return {
      id: Number(tokenId), // JWT chỉ hỗ trợ number, không hỗ trợ bigint
      userId,
      familyId,
      iat: currentTime.toSeconds(),
      exp: currentTime.plus({ days: 30 }).toSeconds(),
    };
  }
}

// Export TokenService để có thể import trực tiếp
export const TokenService = new TokenServiceImpl();

// Tạo và export Elysia plugin
export const tokenService = new Elysia({ name: "token-service" }).decorate(
  "tokenService",
  TokenService
);
