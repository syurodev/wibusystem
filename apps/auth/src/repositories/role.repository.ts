import { sql } from "drizzle-orm";
import { RolesSchema, type RoleInsert } from "../database/schema";
import { BaseRepository } from "./base.repository";

/**
 * Repository xử lý các thao tác với bảng Roles
 */
export class RoleRepository extends BaseRepository<
  typeof RolesSchema,
  RoleInsert
> {
  private static instance: RoleRepository;

  private constructor() {
    super(RolesSchema);
  }

  /**
   * Lấy instance của RoleRepository (Singleton pattern)
   * @returns Instance của RoleRepository
   */
  public static getInstance(): RoleRepository {
    if (!RoleRepository.instance) {
      RoleRepository.instance = new RoleRepository();
    }
    return RoleRepository.instance;
  }

  /**
   * Tìm role theo tên
   * @param name Tên role cần tìm
   * @returns Role được tìm thấy hoặc undefined nếu không tìm thấy
   */
  public async findByName(name: string) {
    return this.findOne({ name: name as any });
  }

  /**
   * Tìm roles theo danh sách ID
   * @param ids Danh sách ID role cần tìm
   * @returns Danh sách roles được tìm thấy
   */
  public async findByIds(ids: bigint[]) {
    try {
      const db = this.db;
      const roles = await db
        .select()
        .from(RolesSchema)
        .where(sql`${RolesSchema.id} IN (${ids.join(",")})`);

      return roles;
    } catch (error) {
      console.error("Error finding roles by IDs:", error);
      throw error;
    }
  }
}
