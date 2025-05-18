import { UserRepository } from "../repositories/user.repository";
import { withTransaction } from "../utils/transaction.util";

/**
 * Ví dụ về cách tạo người dùng mới với vai trò trong cùng một transaction
 */
async function createUserWithRole(
  email: string,
  password: string,
  roleName: string
) {
  // Thực hiện các thao tác trong một transaction duy nhất
  return await withTransaction(async (tx) => {
    try {
      // Khởi tạo các repository cần thiết
      const userRepo = UserRepository.getInstance();

      // Tạo người dùng mới
      const user = await userRepo.save(
        {
          email,
          hashed_password: password, // Trong thực tế, password nên được hash
          account_status: 1, // Giả sử 1 là active
        },
        tx
      );

      // Mọi thao tác đều thành công, transaction sẽ được commit tự động
      return {
        user,
        message: "User created with role successfully",
      };
    } catch (error) {
      // Nếu có lỗi, transaction sẽ được rollback tự động
      console.error("Error in createUserWithRole:", error);
      throw error;
    }
  });
}
export { createUserWithRole };
