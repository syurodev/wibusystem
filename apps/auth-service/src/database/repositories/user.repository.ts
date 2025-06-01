import { convertToMillis, now } from "@repo/common";
import { eq, or } from "drizzle-orm";
import connection, { Database } from "../database.provider";
import { User, type UserInsert, type UserSelect } from "../schemas";

export class UserRepository {
  private db: Database;
  constructor() {
    this.db = connection;
  }

  /**
   * Tìm user theo email
   * @param email - Email người dùng
   * @returns Promise<UserSelect | null>
   */
  async findByEmail(email: string): Promise<UserSelect | null> {
    const [result] = await this.db
      .select()
      .from(User)
      .where(eq(User.email, email));

    return result || null;
  }

  /**
   * Tìm user theo username
   * @param username - Username người dùng
   * @returns Promise<UserSelect | null>
   */
  async findByUsername(username: string): Promise<UserSelect | null> {
    const [result] = await this.db
      .select()
      .from(User)
      .where(eq(User.user_name, username));

    return result || null;
  }

  /**
   * Tìm user theo email hoặc username
   * @param email - Email người dùng
   * @param username - Username người dùng
   * @returns Promise<UserSelect | null>
   */
  async findByEmailOrUsername(
    email: string,
    username: string
  ): Promise<UserSelect | null> {
    const [result] = await this.db
      .select()
      .from(User)
      .where(or(eq(User.email, email), eq(User.user_name, username)));

    return result || null;
  }

  /**
   * Tìm user theo ID
   * @param id - ID người dùng
   * @returns Promise<UserSelect | null>
   */
  async findById(id: number): Promise<UserSelect | null> {
    const [result] = await this.db
      .select()
      .from(User)
      .where(eq(User.id, id))
      .limit(1);

    return result || null;
  }

  /**
   * Tạo user mới
   * @param userData - Dữ liệu user mới
   * @returns Promise<UserSelect>
   */
  async create(userData: UserInsert): Promise<UserSelect> {
    userData.created_at = convertToMillis(now());
    userData.updated_at = convertToMillis(now());
    const [result] = await this.db.insert(User).values(userData).returning();

    return result;
  }

  /**
   * Cập nhật thông tin user
   * @param id - ID người dùng
   * @param updateData - Dữ liệu cần cập nhật
   * @returns Promise<UserSelect | null>
   */
  async update(
    id: number,
    updateData: Partial<UserInsert>
  ): Promise<UserSelect | null> {
    updateData.updated_at = convertToMillis(now());

    const [result] = await this.db
      .update(User)
      .set({
        ...updateData,
        updated_at: Date.now(),
      })
      .where(eq(User.id, id))
      .returning();

    return result || null;
  }

  /**
   * Cập nhật mật khẩu user
   * @param id - ID người dùng
   * @param hashedPassword - Mật khẩu đã hash
   * @returns Promise<boolean>
   */
  async updatePassword(id: number, hashedPassword: string): Promise<boolean> {
    const result = await this.db
      .update(User)
      .set({
        password: hashedPassword,
        updated_at: convertToMillis(now()),
      })
      .where(eq(User.id, id))
      .returning();

    return result.length > 0;
  }
}
