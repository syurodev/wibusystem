import { convertToMillis, now } from "@repo/common";
import { eq, or } from "drizzle-orm";
import { db } from "src/database/connection";
import { User, users, type NewUser } from "../database/schema";
import { BaseRepository, DrizzleTransaction } from "./base.repository";

export class UserRepository extends BaseRepository<typeof users, NewUser> {
  private static instance: UserRepository;

  private constructor() {
    super(users);
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
   * @param tx Transaction tùy chọn
   * @returns Người dùng đã được cập nhật
   */
  public async updateUserPassword(
    userId: number,
    newPasswordHash: string,
    tx?: DrizzleTransaction
  ) {
    return this.update(userId, { hashed_password: newPasswordHash as any }, tx);
  }

  /**
   * Tìm người dùng theo email (phương thức tiện lợi)
   * @param email Email của người dùng cần tìm
   * @param tx Transaction tùy chọn
   * @returns Người dùng được tìm thấy hoặc undefined nếu không tìm thấy
   */
  public async findByEmail(email: string, tx?: DrizzleTransaction) {
    return this.findOne({ email: email }, tx);
  }

  public async findByEmailOrUsername(
    identifier: string,
    tx?: DrizzleTransaction
  ): Promise<User | undefined> {
    const queryRunner = tx || db;
    const results = await queryRunner
      .select()
      .from(users)
      .where(or(eq(users.email, identifier), eq(users.username, identifier)))
      .limit(1);
    return results[0];
  }

  /**
   * Cập nhật thời gian đăng nhập cuối cùng của người dùng
   * @param userId ID của người dùng
   * @param tx Transaction tùy chọn
   * @returns Người dùng đã được cập nhật
   */
  public async updateLastLoginTime(userId: number, tx?: DrizzleTransaction) {
    try {
      const lastLoginAt = convertToMillis(now());
      return this.update(userId, { last_login_at: lastLoginAt }, tx);
    } catch (error) {
      console.error("Error updating last login time:", error);
      throw error;
    }
  }
}
