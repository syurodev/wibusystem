import { ERROR_CODES } from "@repo/common";
import { UserRepository } from "../../../../database/repositories/user.repository";
import type { UserInsert, UserSelect } from "../../../../database/schemas";
import { hashPassword } from "../../../../utils/crypto.utils";
import { RegisterAccountSchema } from "../schemas/register-account.schema";

/**
 * Service xử lý xác thực người dùng
 * Sử dụng Repository Pattern để tách biệt business logic và data access
 */
export class AuthService {
  private readonly userRepository: UserRepository;
  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Đăng ký tài khoản mới
   * @param body - Thông tin đăng ký từ schema
   * @returns Promise<{ user: Omit<UserSelect, 'password'>; message: string }>
   * @throws Error nếu email đã tồn tại hoặc có lỗi khác
   */
  async registerAccount(body: RegisterAccountSchema): Promise<UserSelect> {
    try {
      // 1. Validate input (đã được validate bởi schema)
      const { email, password } = body;

      // 2. Kiểm tra email đã tồn tại chưa
      const emailExists = await this.userRepository.findByEmail(email);
      if (emailExists) {
        throw new Error(ERROR_CODES.RESOURCE.ALREADY_EXISTS);
      }

      // 3. Hash password an toàn
      const hashedPassword = await hashPassword(password);

      // 4. Tạo dữ liệu user mới
      const newUserData: UserInsert = {
        email,
        password: hashedPassword,
        user_name: email.split("@")[0].toLowerCase().trim(), // Tạm thời dùng email prefix làm username
        display_name: email.split("@")[0],
        is_active: true,
        is_email_verified: false,
        is_phone_verified: false,
        is_deleted: false,
      };

      // 5. Tạo user thông qua repository
      const createdUser = await this.userRepository.create(newUserData);

      return createdUser;
    } catch (error) {
      // Log error để debug
      console.error("Error in registerAccount:", error);

      // Ném lại error với message phù hợp
      if (error instanceof Error) {
        if (error.message === ERROR_CODES.RESOURCE.ALREADY_EXISTS) {
          throw new Error("Email đã được sử dụng");
        }
      }

      throw new Error("Có lỗi xảy ra khi đăng ký tài khoản");
    }
  }
}
