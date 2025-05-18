import { Elysia } from 'elysia';
import { PasswordResetOtpRepository } from '@repositories/password-reset-otp.repository';
import { UserRepository } from '@repositories/user.repository';
import { AuthErrorType } from '../../../../types/enums';
import { generateOtp, hashOtp, hashPassword } from '../../../../utils/password.util';
import { PasswordService } from '../types/password.types';

class PasswordServiceImpl implements PasswordService {
  private userRepo: UserRepository;
  private otpRepo: PasswordResetOtpRepository;

  constructor() {
    this.userRepo = UserRepository.getInstance();
    this.otpRepo = PasswordResetOtpRepository.getInstance();
  }

  async requestReset(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await this.userRepo.findByEmail(email);
      if (!user) {
        // Trả về thành công ngay cả khi không tìm thấy email để tránh lộ thông tin
        return {
          success: true,
          message: 'Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu',
        };
      }

      // Tạo và lưu OTP
      const otp = generateOtp();
      // Sử dụng user.id làm salt để hash OTP
      const hashedOtp = await hashOtp(otp, user.id.toString());
      // Sử dụng timestamp (giây) cho expires_at
      const expiresAt = Math.floor(Date.now() / 1000) + (15 * 60); // 15 phút sau

      await this.otpRepo.save({
        user_id: Number(user.id),
        otp_hash: hashedOtp,
        expires_at: expiresAt,
      });

      // TODO: Gửi email chứa OTP
      console.log(`OTP for ${email}: ${otp}`);

      return {
        success: true,
        message: 'Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu',
      };
    } catch (error) {
      console.error('Error requesting password reset:', error);
      return {
        success: false,
        message: 'Đã xảy ra lỗi khi yêu cầu đặt lại mật khẩu',
      };
    }
  }

  async resetPassword(
    email: string,
    otp: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Tìm user theo email
      const user = await this.userRepo.findByEmail(email);
      if (!user) {
        return {
          success: false,
          message: 'Không tìm thấy tài khoản với email này',
        };
      }

      // Tìm OTP chưa sử dụng
      const otpRecord = await this.otpRepo.findByHashAndUser(otp, user.id);
      if (!otpRecord) {
        return {
          success: false,
          message: 'Mã OTP không hợp lệ hoặc đã hết hạn',
        };
      }

      // Xác thực OTP
      const hashedOtp = await hashOtp(otp, user.id.toString());
      if (hashedOtp !== otpRecord.otp_hash) {
        return {
          success: false,
          message: 'Mã OTP không chính xác',
        };
      }

      // Cập nhật mật khẩu mới
      const hashedPassword = await hashPassword(newPassword);
      await this.userRepo.update(user.id, { password: hashedPassword });

      // Đánh dấu OTP đã sử dụng
      await this.otpRepo.markAsUsed(otpRecord.id);

      // Hủy tất cả các token hiện có của người dùng
      // await this.tokenService.revokeAllUserTokens(user.id);

      return {
        success: true,
        message: 'Đặt lại mật khẩu thành công',
      };
    } catch (error) {
      console.error('Error resetting password:', error);
      return {
        success: false,
        message: 'Đã xảy ra lỗi khi đặt lại mật khẩu',
      };
    }
  }
}

// Export class để có thể import trực tiếp
export { PasswordServiceImpl as PasswordService };

// Export Elysia plugin
export const passwordService = new Elysia({ name: 'password-service' })
  .decorate('passwordService', new PasswordServiceImpl());
