import { eq, sql } from "drizzle-orm";
import { db } from "../database/connection";
import { Permission, permissions } from "../database/schema/permissions.schema";
import { rolePermissions } from "../database/schema/role-permissions.schema";
import { BaseRepository, DrizzleTransaction } from "./base.repository";

export class PermissionRepository extends BaseRepository<
  typeof permissions,
  any
> {
  private static instance: PermissionRepository;

  constructor() {
    super(permissions);
  }

  public static getInstance(): PermissionRepository {
    if (!PermissionRepository.instance) {
      PermissionRepository.instance = new PermissionRepository();
    }
    return PermissionRepository.instance;
  }

  /**
   * Lấy danh sách quyền của các vai trò
   * @param roleNames Danh sách tên vai trò
   * @param tx Transaction tùy chọn
   * @returns Danh sách quyền
   */
  async findPermissionsByRoles(
    roleNames: string[],
    tx?: DrizzleTransaction
  ): Promise<Permission[]> {
    const queryRunner = tx || db;

    // Nếu không có vai trò nào được cung cấp, trả về mảng rỗng
    if (!roleNames.length) {
      return [];
    }

    // 1. Truy vấn để lấy danh sách roles.id từ roleNames
    const rolesQuery = await queryRunner
      .select({ id: sql<number>`id` })
      .from(sql`roles`)
      .where(sql`name IN (${roleNames.join(",")})`);

    const roleIds = rolesQuery.map((r) => r.id);

    // Nếu không tìm thấy roles nào, trả về mảng rỗng
    if (!roleIds.length) {
      return [];
    }

    // 2. Lấy danh sách permission_id từ bảng role_permissions
    let allPermissionIds: number[] = [];

    for (const roleId of roleIds) {
      const permissionEntries = await queryRunner
        .select({ permissionId: rolePermissions.permissionId })
        .from(rolePermissions)
        .where(eq(rolePermissions.roleId, roleId));

      const permissionIds = permissionEntries.map(
        (entry) => entry.permissionId
      );
      allPermissionIds = [...allPermissionIds, ...permissionIds];
    }

    // Loại bỏ các permissionId trùng lặp
    const uniquePermissionIds = [...new Set(allPermissionIds)];

    if (!uniquePermissionIds.length) {
      return [];
    }

    // 3. Lấy thông tin chi tiết từng quyền
    const permissionRecords: Permission[] = [];

    for (const permissionId of uniquePermissionIds) {
      const permissionData = await queryRunner
        .select()
        .from(permissions)
        .where(eq(permissions.id, permissionId));

      if (permissionData.length > 0) {
        // TypeScript không cho phép push undefined vào mảng Permission[]
        // nên cần kiểm tra permissionData[0] có tồn tại
        const permission = permissionData[0];
        if (permission) {
          permissionRecords.push(permission);
        }
      }
    }

    return permissionRecords;
  }
}
