import { type UserProfileUpdate } from "../../../../database/schema";
import { UserRepository } from "../../../../repositories/user.repository";

export class UserService {
  private static instance: UserService;
  private readonly userRepository: UserRepository;

  private constructor() {
    this.userRepository = UserRepository.getInstance();
  }

  /**
   * Lấy instance của UserService (Singleton)
   */
  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  /**
   * Lấy thông tin profile của người dùng theo ID
   * @param userId ID của người dùng
   * @returns Thông tin profile người dùng
   */
  public async getUserProfile(userId: bigint) {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error("Không tìm thấy người dùng");
      }

      // Trả về thông tin người dùng, loại bỏ thông tin nhạy cảm
      return {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        account_status: user.account_status,
        last_login_at: user.last_login_at,
        created_at: user.created_at,
        updated_at: user.updated_at,
      };
    } catch (error) {
      console.error("Error getting user profile:", error);
      throw error;
    }
  }

  /**
   * Cập nhật thông tin profile của người dùng
   * @param userId ID của người dùng cần cập nhật
   * @param data Dữ liệu cần cập nhật
   * @returns Thông tin người dùng sau khi cập nhật
   */
  public async updateUserProfile(userId: bigint, data: UserProfileUpdate) {
    try {
      // Kiểm tra xem người dùng có tồn tại không
      const existingUser = await this.userRepository.findById(userId);
      if (!existingUser) {
        throw new Error("Không tìm thấy người dùng");
      }

      // Cập nhật thông tin người dùng
      const updatedUser = await this.userRepository.updateUserProfile(
        userId,
        data
      );

      if (!updatedUser) {
        throw new Error("Không thể cập nhật thông tin người dùng");
      }

      // Trả về thông tin người dùng đã cập nhật
      return {
        id: updatedUser.id,
        email: updatedUser.email,
        full_name: updatedUser.full_name,
        avatar_url: updatedUser.avatar_url,
        account_status: updatedUser.account_status,
        last_login_at: updatedUser.last_login_at,
        created_at: updatedUser.created_at,
        updated_at: updatedUser.updated_at,
      };

    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  }
}
