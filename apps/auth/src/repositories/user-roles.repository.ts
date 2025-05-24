import { eq } from "drizzle-orm";
import { db } from "../database/connection";
import { Role, roles } from "../database/schema/roles.schema";
import { userRoles } from "../database/schema/user-roles.schema";
import { BaseRepository, DrizzleTransaction } from "./base.repository";

export class UserRolesRepository extends BaseRepository<typeof userRoles, any> {
  private static instance: UserRolesRepository;

  constructor() {
    super(userRoles);
  }

  public static getInstance(): UserRolesRepository {
    if (!UserRolesRepository.instance) {
      UserRolesRepository.instance = new UserRolesRepository();
    }
    return UserRolesRepository.instance;
  }

  /**
   * Lấy danh sách vai trò của người dùng
   * @param userId ID của người dùng
   * @param tx Transaction tùy chọn
   * @returns Danh sách vai trò của người dùng
   */
  async findRolesByUserId(
    userId: number,
    tx?: DrizzleTransaction
  ): Promise<Role[]> {
    const queryRunner = tx || db;

    // 1. Lấy danh sách role_id từ bảng user_roles
    const userRoleRecords = await queryRunner
      .select({
        roleId: userRoles.roleId,
      })
      .from(userRoles)
      .where(eq(userRoles.userId, userId));

    if (!userRoleRecords.length) {
      return [];
    }

    // 2. Lấy thông tin chi tiết của các vai trò từ bảng roles
    const roleIds = userRoleRecords.map((record) => record.roleId);
    const roleRecords: Role[] = [];

    // Truy vấn lần lượt từng role_id để lấy thông tin role
    for (const roleId of roleIds) {
      const roleData = await queryRunner
        .select()
        .from(roles)
        .where(eq(roles.id, roleId));

      if (roleData.length > 0) {
        // TypeScript không cho phép push undefined vào mảng Role[]
        // nên cần kiểm tra roleData[0] có tồn tại
        const role = roleData[0];
        if (role) {
          roleRecords.push(role);
        }
      }
    }

    return roleRecords;
  }
}
