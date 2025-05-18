import { and, eq, sql } from "drizzle-orm";
import {
  RefreshTokensSchema,
  type RefreshTokenInsert,
} from "../database/schema";
import { BaseRepository } from "./base.repository";

/**
 * Repository xử lý các thao tác với bảng RefreshTokens
 */
export class RefreshTokenRepository extends BaseRepository<
  typeof RefreshTokensSchema,
  RefreshTokenInsert
> {
  private static instance: RefreshTokenRepository;

  private constructor() {
    super(RefreshTokensSchema);
  }

  /**
   * Lấy instance của RefreshTokenRepository (Singleton pattern)
   * @returns Instance của RefreshTokenRepository
   */
  public static getInstance(): RefreshTokenRepository {
    if (!RefreshTokenRepository.instance) {
      RefreshTokenRepository.instance = new RefreshTokenRepository();
    }
    return RefreshTokenRepository.instance;
  }

  /**
   * Tìm token theo hash
   * @param hash Hash của token
   * @returns Token được tìm thấy hoặc undefined nếu không tìm thấy
   */
  public async findByHash(hash: string) {
    return this.findOne({ token_hash: hash as any });
  }

  /**
   * Lấy tất cả token thuộc về một người dùng
   * @param userId ID của người dùng
   * @param onlyActive Chỉ lấy các token còn hoạt động
   * @returns Danh sách các token
   */
  public async findByUserId(userId: bigint, onlyActive: boolean = true) {
    try {
      const db = this.db;

      // Nếu chỉ lấy token hoạt động
      if (onlyActive) {
        return db
          .select()
          .from(RefreshTokensSchema)
          .where(
            and(
              eq(RefreshTokensSchema.user_id, userId),
              eq(RefreshTokensSchema.is_active, 1)
            )
          );
      }

      // Lấy tất cả token của user
      return db
        .select()
        .from(RefreshTokensSchema)
        .where(eq(RefreshTokensSchema.user_id, userId));
    } catch (error) {
      console.error("Error finding refresh tokens by user ID:", error);
      throw error;
    }
  }

  /**
   * Đánh dấu token không còn hoạt động
   * @param tokenId ID của token
   * @returns Token đã cập nhật
   */
  public async markAsInactive(tokenId: bigint) {
    return this.update(tokenId, { is_active: 0 as any });
  }

  /**
   * Đánh dấu tất cả token trong cùng family không còn hoạt động
   * @param familyId ID của family
   * @returns Số lượng token đã cập nhật
   */
  public async markFamilyAsInactive(familyId: string) {
    try {
      const db = this.db;
      const result = await db
        .update(RefreshTokensSchema)
        .set({ is_active: 0 })
        .where(eq(RefreshTokensSchema.family_id, familyId))
        .returning();

      return result.length;
    } catch (error) {
      console.error("Error marking token family as inactive:", error);
      throw error;
    }
  }

  /**
   * Xóa các token đã hết hạn
   * @returns Số lượng token đã xóa
   */
  public async deleteExpiredTokens() {
    try {
      const db = this.db;
      const currentTimestamp = Math.floor(Date.now() / 1000);

      const result = await db
        .delete(RefreshTokensSchema)
        .where(sql`${RefreshTokensSchema.expires_at} < ${currentTimestamp}`)
        .returning();

      return result.length;
    } catch (error) {
      console.error("Error deleting expired tokens:", error);
      throw error;
    }
  }
}
