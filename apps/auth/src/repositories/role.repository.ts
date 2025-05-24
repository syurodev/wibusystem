import { eq } from "drizzle-orm";
import { db } from "../database/connection";
import { NewRole, Role, roles } from "../database/schema/roles.schema";
import { BaseRepository, DrizzleTransaction } from "./base.repository";

export class RoleRepository extends BaseRepository<typeof roles, NewRole> {
  private static instance: RoleRepository;

  constructor() {
    super(roles);
  }

  public static getInstance(): RoleRepository {
    if (!RoleRepository.instance) {
      RoleRepository.instance = new RoleRepository();
    }
    return RoleRepository.instance;
  }

  /**
   * Tìm vai trò theo tên
   * @param name Tên vai trò cần tìm
   * @param tx Transaction tùy chọn
   * @returns Vai trò tìm thấy hoặc undefined nếu không tìm thấy
   */
  async findByName(
    name: string,
    tx?: DrizzleTransaction
  ): Promise<Role | undefined> {
    const queryRunner = tx || db;

    const result = await queryRunner
      .select()
      .from(roles)
      .where(eq(roles.name, name));

    return result[0];
  }
}
