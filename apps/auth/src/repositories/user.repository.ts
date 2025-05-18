import {
  UsersSchema,
  type UserInsert,
  type UserProfileUpdate,
} from "../database/schema";
import { BaseRepository } from "./base.repository";

export class UserRepository extends BaseRepository<
  typeof UsersSchema,
  UserInsert
> {
  private static instance: UserRepository;

  private constructor() {
    super(UsersSchema);
  }

  public static getInstance(): UserRepository {
    if (!UserRepository.instance) {
      UserRepository.instance = new UserRepository();
    }
    return UserRepository.instance;
  }

  /**
   * Cập nhật mật khẩu của người dùng
   * @param userId ID của người dùng cần cập nhật mật khẩu
   * @param newPasswordHash Mật khẩu đã hash mới
   * @returns Người dùng đã được cập nhật
   */
  public async updateUserPassword(userId: bigint, newPasswordHash: string) {
    return this.update(userId, { hashed_password: newPasswordHash as any });
  }

  /**
   * Cập nhật thông tin hồ sơ của người dùng
   * @param userId ID của người dùng cần cập nhật
   * @param data Dữ liệu cần cập nhật (full_name, avatar_url)
   * @returns Người dùng đã được cập nhật
   */
  public async updateUserProfile(userId: bigint, data: UserProfileUpdate) {
    return this.update(userId, data);
  }

  /**
   * Tìm người dùng theo email (phương thức tiện lợi)
   * @param email Email của người dùng cần tìm
   * @returns Người dùng được tìm thấy hoặc undefined nếu không tìm thấy
   */
  public async findByEmail(email: string) {
    return this.findOne({ email: email as any });
  }

  /**
   * Cập nhật thời gian đăng nhập cuối cùng của người dùng
   * @param userId ID của người dùng
   * @returns Người dùng đã được cập nhật
   */
  public async updateLastLoginTime(userId: bigint) {
    try {
      const lastLoginAt = BigInt(Math.floor(Date.now() / 1000)); // Unix timestamp in seconds
      return this.update(userId, { last_login_at: lastLoginAt as any });
    } catch (error) {
      console.error("Error updating last login time:", error);
      throw error;
    }
  }
}
