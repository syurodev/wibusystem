import { getDb } from "../database/connection";

/**
 * Type cho transaction. Đây là kiểu trả về từ db.transaction() của Drizzle.
 */
type DrizzleTransaction = Parameters<
  Parameters<ReturnType<typeof getDb>["transaction"]>[0]
>[0];

/**
 * Hàm utility để thực hiện một chuỗi các thao tác trong một transaction duy nhất.
 * Nếu có bất kỳ lỗi nào xảy ra, transaction sẽ được rollback.
 * Nếu tất cả đều thành công, transaction sẽ được commit.
 *
 * @param callback Hàm callback chứa các thao tác cần thực hiện trong transaction
 * @returns Kết quả của hàm callback
 * @throws Ném lại lỗi nếu có bất kỳ lỗi nào xảy ra
 *
 * @example
 * // Sử dụng transaction với nhiều repository
 * await withTransaction(async (tx) => {
 *   const userRepo = UserRepository.getInstance();
 *   const roleRepo = RoleRepository.getInstance();
 *
 *   // Lưu user
 *   const user = await userRepo.save(userData, tx);
 *
 *   // Lưu role và gán cho user
 *   const role = await roleRepo.save(roleData, tx);
 *   await userRoleRepo.save({ user_id: user.id, role_id: role.id }, tx);
 *
 *   return user;
 * });
 */
export async function withTransaction<T>(
  callback: (tx: DrizzleTransaction) => Promise<T>
): Promise<T> {
  const db = getDb();

  // Bắt đầu transaction
  return await db.transaction(async (tx) => {
    try {
      // Thực hiện các thao tác trong callback
      const result = await callback(tx);

      // Kết quả sẽ được tự động commit nếu không có lỗi
      return result;
    } catch (error) {
      // Transaction sẽ được tự động rollback nếu có lỗi
      console.error("Transaction failed:", error);
      throw error;
    }
  });
}
