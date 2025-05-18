import { and, eq, isNull, sql } from "drizzle-orm";
import {
  PasswordResetOtpsSchema,
  type PasswordResetOtpInsert,
} from "../database/schema";
import { BaseRepository } from "./base.repository";

/**
 * Repository xử lý các thao tác với bảng PasswordResetOtps
 */
export class PasswordResetOtpRepository extends BaseRepository<
  typeof PasswordResetOtpsSchema,
  PasswordResetOtpInsert
> {
  private static instance: PasswordResetOtpRepository;

  private constructor() {
    super(PasswordResetOtpsSchema);
  }

  /**
   * Lấy instance của PasswordResetOtpRepository (Singleton pattern)
   * @returns Instance của PasswordResetOtpRepository
   */
  public static getInstance(): PasswordResetOtpRepository {
    if (!PasswordResetOtpRepository.instance) {
      PasswordResetOtpRepository.instance = new PasswordResetOtpRepository();
    }
    return PasswordResetOtpRepository.instance;
  }

  /**
   * Tìm OTP theo hash và user ID
   * @param otpHash Hash của OTP
   * @param userId ID của người dùng
   * @returns OTP được tìm thấy hoặc undefined nếu không tìm thấy
   */
  public async findByHashAndUser(otpHash: string, userId: bigint) {
    try {
      const db = this.db;
      const currentTimestamp = Math.floor(Date.now() / 1000);

      const result = await db
        .select()
        .from(PasswordResetOtpsSchema)
        .where(
          and(
            eq(PasswordResetOtpsSchema.otp_hash, otpHash),
            eq(PasswordResetOtpsSchema.user_id, userId),
            isNull(PasswordResetOtpsSchema.used_at),
            sql`${PasswordResetOtpsSchema.expires_at} > ${currentTimestamp}`
          )
        );

      return result[0];
    } catch (error) {
      console.error("Error finding OTP by hash and user:", error);
      throw error;
    }
  }

  /**
   * Đánh dấu OTP đã được sử dụng
   * @param otpId ID của OTP
   * @returns OTP đã cập nhật
   */
  public async markAsUsed(otpId: bigint) {
    const currentTimestamp = BigInt(Math.floor(Date.now() / 1000));
    return this.update(otpId, { used_at: currentTimestamp });
  }

  /**
   * Xóa các OTP đã hết hạn
   * @returns Số lượng OTP đã xóa
   */
  public async deleteExpiredOtps() {
    try {
      const db = this.db;
      const currentTimestamp = Math.floor(Date.now() / 1000);

      const result = await db
        .delete(PasswordResetOtpsSchema)
        .where(sql`${PasswordResetOtpsSchema.expires_at} < ${currentTimestamp}`)
        .returning();

      return result.length;
    } catch (error) {
      console.error("Error deleting expired OTPs:", error);
      throw error;
    }
  }
}
