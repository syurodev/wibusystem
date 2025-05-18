import { sql } from "drizzle-orm";
import { PermissionsSchema, type PermissionInsert } from "../database/schema";
import { BaseRepository } from "./base.repository";

/**
 * Repository xử lý các thao tác với bảng Permissions
 */
export class PermissionRepository extends BaseRepository<
  typeof PermissionsSchema,
  PermissionInsert
> {
  private static instance: PermissionRepository;

  private constructor() {
    super(PermissionsSchema);
  }

  /**
   * Lấy instance của PermissionRepository (Singleton pattern)
   * @returns Instance của PermissionRepository
   */
  public static getInstance(): PermissionRepository {
    if (!PermissionRepository.instance) {
      PermissionRepository.instance = new PermissionRepository();
    }
    return PermissionRepository.instance;
  }

  /**
   * Tìm permission theo tên
   * @param name Tên permission cần tìm
   * @returns Permission được tìm thấy hoặc undefined nếu không tìm thấy
   */
  public async findByName(name: string) {
    return this.findOne({ name: name as any });
  }

  /**
   * Tìm permissions theo danh sách ID
   * @param ids Danh sách ID permission cần tìm
   * @returns Danh sách permissions được tìm thấy
   */
  public async findByIds(ids: bigint[]) {
    try {
      const db = this.db;
      const permissions = await db
        .select()
        .from(PermissionsSchema)
        .where(sql`${PermissionsSchema.id} IN (${ids.join(",")})`);

      return permissions;
    } catch (error) {
      console.error("Error finding permissions by IDs:", error);
      throw error;
    }
  }

  /**
   * Tìm permissions theo resource prefix trong tên
   * Ví dụ: resource "users" sẽ tìm các permission "users:read", "users:write" etc.
   * @param resource Tên resource (ví dụ: "users", "posts", v.v.)
   * @returns Danh sách permissions thuộc resource đó
   */
  public async findByResource(resource: string) {
    try {
      const db = this.db;
      const permissions = await db
        .select()
        .from(PermissionsSchema)
        .where(sql`${PermissionsSchema.name} LIKE ${`${resource}:%`}`);

      return permissions;
    } catch (error) {
      console.error("Error finding permissions by resource:", error);
      throw error;
    }
  }
}
