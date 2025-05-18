/**
 * @file Service cho Auth module.
 * @author Your Name
 */
import { PasswordResetOtpRepository } from "../../../../repositories/password-reset-otp.repository";
import { RefreshTokenRepository } from "../../../../repositories/refresh-token.repository";
import { UserRepository } from "../../../../repositories/user.repository";
import { TokenService } from "./token.service";
import {
  AccountStatus,
  AuthErrorType,
  TokenStatus,
} from "../../../../types/enums";
import {
  LoginResult,
  RefreshTokenResult,
  RegisterResult,
} from "../../../../types/interfaces";
import {
  comparePassword,
  generateOtp,
  hashOtp,
  hashPassword,
} from "../../../../utils/password.util";
import {
  createAccessTokenPayload,
  createRefreshTokenPayload,
  generateRandomToken,
  generateTokenFamilyId,
  hashToken,
} from "../../../../utils/token.util";
import { toSecondsFromDateTime, now } from "@repo/common";

import { RegisterUserSchema, LoginUserSchema } from '../validations/auth.validation';
import type { Static } from '@sinclair/typebox';

// Định nghĩa các kiểu dữ liệu đầu vào/đầu ra
type RegisterInput = Static<typeof RegisterUserSchema>;
type LoginInput = Static<typeof LoginUserSchema>;

interface AuthResponse {
  success: boolean;
  message: string;
  access_token?: string;
  refresh_token?: string;
  user?: {
    id: bigint;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
}

/**
 * Service xử lý logic liên quan đến xác thực
 */
export class AuthService {
  private static instance: AuthService;
  private readonly userRepo: UserRepository;
  private readonly refreshTokenRepository: RefreshTokenRepository;
  private readonly passwordResetOtpRepository: PasswordResetOtpRepository;

  private constructor() {
    this.userRepo = UserRepository.getInstance();
    this.refreshTokenRepository = RefreshTokenRepository.getInstance();
    this.passwordResetOtpRepository = PasswordResetOtpRepository.getInstance();
  }

  /**
   * Lấy instance của AuthService (Singleton pattern)
   * @returns Instance của AuthService
   */
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async register(data: RegisterInput): Promise<{ id: bigint; email: string; full_name?: string }> {
    try {
      // Kiểm tra email đã tồn tại chưa
      const existingUser = await this.userRepo.findByEmail(data.email);
      if (existingUser) {
        throw new Error('EMAIL_EXISTS');
      }

      // Hash mật khẩu
      const hashedPassword = await hashPassword(data.password);

      // Tạo user mới
      const newUser = await this.userRepo.save({
        email: data.email,
        hashed_password: hashedPassword,
        full_name: data.full_name,
        account_status: AccountStatus.ACTIVE,
      });

      // Trả về kết quả
      return {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name || undefined,
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async login(
    credentials: LoginInput, 
    signJwt: (payload: Record<string, string | number | string[] | boolean | undefined>) => Promise<string>
  ): Promise<{ access_token: string; refresh_token: string; user: { id: bigint; email: string; full_name?: string; avatar_url?: string } }> {
    try {
      // Tìm user theo email
      const user = await this.userRepo.findByEmail(credentials.email);
      if (!user) {
        throw new Error(AuthErrorType.INVALID_CREDENTIALS);
      }

      // Kiểm tra trạng thái tài khoản
      if (user.account_status !== AccountStatus.ACTIVE) {
        throw new Error(AuthErrorType.UNAUTHORIZED);
      }

      // Kiểm tra mật khẩu
      const isPasswordValid = await comparePassword(credentials.password, user.hashed_password);
      if (!isPasswordValid) {
        throw new Error(AuthErrorType.INVALID_CREDENTIALS);
      }

      // Cập nhật thời gian đăng nhập cuối cùng
      await this.userRepo.updateLastLoginTime(user.id);

      // Tạo access token
      const accessToken = await signJwt(createAccessTokenPayload(user.id));
      
      // Tạo refresh token
      const { token: refreshToken, expiresAt: refreshTokenExpiresAt } = 
        await TokenService.generateRefreshToken(user.id);

      // Tạo JWT refresh token
      const timestamp = Math.floor(refreshTokenExpiresAt.getTime() / 1000);
      const refreshTokenPayload = createRefreshTokenPayload(
        user.id,
        refreshToken,
        timestamp.toString()
      );
      const signedRefreshToken = await signJwt(refreshTokenPayload);

      // Trả về kết quả đăng nhập
      return {
        access_token: accessToken,
        refresh_token: signedRefreshToken,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
        },
      };
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  /**
   * Refresh token
   * @param token JWT refresh token
   * @param verifyJwt Hàm verify JWT từ Elysia
   * @param signJwt Hàm ký JWT từ Elysia
   * @returns Kết quả refresh token
   */
  public async refreshToken(
    token: string,
    verifyJwt: (token: string) => Promise<Record<string, unknown> | false>,
    signJwt: (payload: Record<string, string | number | string[] | boolean | undefined>) => Promise<string>
  ): Promise<{ access_token: string; refresh_token: string }> {
    try {
      // Verify JWT refresh token
      const decoded = await verifyJwt(token);
      if (!decoded || typeof decoded !== 'object') {
        throw new Error(AuthErrorType.INVALID_TOKEN);
      }

      // Lấy thông tin từ token
      const payload = decoded as Record<string, unknown>;
      const jti = payload.jti as string | undefined;
      const sub = payload.sub as string | undefined;
      const familyId = payload.familyId as string | undefined;

      if (!jti || !sub || !familyId) {
        throw new Error(AuthErrorType.INVALID_TOKEN);
      }

      // Tìm refresh token trong database
      const tokenId = BigInt(jti);
      const savedToken = await this.refreshTokenRepository.findById(tokenId);

      // Kiểm tra token có tồn tại và còn hoạt động
      if (!savedToken || savedToken.is_active !== TokenStatus.ACTIVE) {
        throw new Error(AuthErrorType.INVALID_TOKEN);
      }

      // Kiểm tra user ID
      const userId = BigInt(sub);
      if (savedToken.user_id !== userId) {
        throw new Error(AuthErrorType.INVALID_TOKEN);
      }

      // Kiểm tra token còn hạn sử dụng
      const currentTime = toSecondsFromDateTime(now());
      if (Number(savedToken.expires_at) < currentTime) {
        throw new Error(AuthErrorType.TOKEN_EXPIRED);
      }

      // Vô hiệu hóa token cũ (Refresh Token Rotation)
      await this.refreshTokenRepository.markAsInactive(savedToken.id);

      // Tạo access token mới
      const accessTokenPayload = createAccessTokenPayload(userId);
      const accessToken = await signJwt(accessTokenPayload);

      // Tạo refresh token mới với cùng family ID
      const newRefreshToken = generateRandomToken();
      const newRefreshTokenHash = hashToken(newRefreshToken);

      // Thời gian hết hạn (30 ngày)
      const expiresAt = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

      // Lưu refresh token mới vào database
      const newSavedToken = await this.refreshTokenRepository.save({
        user_id: Number(userId),
        token_hash: newRefreshTokenHash,
        family_id: familyId,
        is_active: TokenStatus.ACTIVE,
        expires_at: expiresAt,
      });

      // Tạo JWT refresh token mới
      const refreshTokenPayload = createRefreshTokenPayload(
        userId,
        newSavedToken.id.toString(),
        familyId
      );
      const signedRefreshToken = await signJwt(refreshTokenPayload);

      return {
        access_token: accessToken,
        refresh_token: signedRefreshToken,
      };
    } catch (error) {
      console.error("Refresh token error:", error);
      throw error;
    }
  }

  /**
   * Đăng xuất
   * @param token JWT refresh token
   * @param verifyJwt Hàm verify JWT từ Elysia
   * @returns Kết quả đăng xuất
   */
  public async logout(
    token: string,
    verifyJwt: (token: string) => Promise<Record<string, unknown> | false>
  ): Promise<void> {
    try {
      // Verify JWT refresh token
      const decoded = await verifyJwt(token);
      if (!decoded || typeof decoded !== 'object') {
        throw new Error('INVALID_REFRESH_TOKEN');
      }

      // Lấy thông tin từ token
      const payload = decoded as Record<string, unknown>;
      const jti = payload.jti as string | undefined;

      if (!jti) {
        throw new Error('INVALID_REFRESH_TOKEN');
      }

      // Tìm và vô hiệu hóa token
      const tokenId = BigInt(jti);
      await this.refreshTokenRepository.markAsInactive(tokenId);

      return;
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  }

  /**
   * Yêu cầu đặt lại mật khẩu
   * @param email Email của tài khoản cần đặt lại mật khẩu
   * @returns Kết quả yêu cầu
   */
  public async requestPasswordReset(
    email: string
  ): Promise<{ otp?: string }> {
    try {
      // Tìm user theo email
      const user = await this.userRepo.findByEmail(email);
      if (!user) {
        // Không thông báo lỗi chi tiết để đảm bảo bảo mật
        return {};
      }

      // Kiểm tra trạng thái tài khoản
      if (user.account_status !== AccountStatus.ACTIVE) {
        return {};
      }

      // Tạo OTP
      const otp = generateOtp();
      const otpHash = await hashOtp(otp, user.id.toString());

      // Thời gian hết hạn (15 phút)
      const expiresAt = Math.floor(Date.now() / 1000) + 15 * 60;

      // Lưu OTP vào database
      await this.passwordResetOtpRepository.save({
        user_id: Number(user.id),
        otp_hash: otpHash,
        expires_at: expiresAt,
      });

      // Trong MVP, trả về OTP trực tiếp
      // Trong production, gửi email với OTP
      return { otp };
    } catch (error) {
      console.error("Request password reset error:", error);
      throw error;
    }
  }

  /**
   * Đặt lại mật khẩu
   * @param email Email của tài khoản
   * @param otp OTP nhận được
   * @param newPassword Mật khẩu mới
   * @returns Kết quả đặt lại mật khẩu
   */
  public async resetPassword(
    email: string,
    otp: string,
    newPassword: string
  ): Promise<void> {
    try {
      // Tìm user theo email
      const user = await this.userRepo.findByEmail(email);
      if (!user) {
        throw new Error(AuthErrorType.USER_NOT_FOUND);
      }

      // Kiểm tra trạng thái tài khoản
      if (user.account_status !== AccountStatus.ACTIVE) {
        throw new Error(AuthErrorType.UNAUTHORIZED);
      }

      // Hash OTP để so sánh
      const otpHash = await hashOtp(otp, user.id.toString());

      // Tìm OTP theo hash và user ID
      const savedOtp = await this.passwordResetOtpRepository.findByHashAndUser(
        otpHash,
        user.id
      );

      if (!savedOtp) {
        throw new Error(AuthErrorType.INVALID_OTP);
      }

      // Hash mật khẩu mới
      const hashedPassword = await hashPassword(newPassword);

      // Cập nhật mật khẩu
      await this.userRepo.update(user.id, {
        hashed_password: hashedPassword,
      });

      // Đánh dấu OTP đã sử dụng
      await this.passwordResetOtpRepository.markAsUsed(savedOtp.id);

      // Vô hiệu hóa tất cả refresh token của user
      // Để người dùng phải đăng nhập lại sau khi đổi mật khẩu
      const tokens = await this.refreshTokenRepository.findByUserId(
        user.id,
        false
      );
      for (const token of tokens) {
        await this.refreshTokenRepository.markAsInactive(token.id);
      }

      return;
    } catch (error) {
      console.error("Reset password error:", error);
      throw error;
    }
  }
}
