import { and, eq, SQL } from "drizzle-orm";
import { db } from "../database/connection"; // Sử dụng instance db duy nhất

// Định nghĩa kiểu Transaction phù hợp với Drizzle ORM (PostgreSQL)
// Có thể mở rộng nếu cần transaction nâng cao
export type DrizzleTransaction = typeof db;

/**
 * BaseRepository - Lớp cơ sở cho tất cả các repositories
 * @template TTable - Kiểu dữ liệu của bảng trong database
 * @template InsertType - Kiểu dữ liệu khi thêm mới vào database
 */
export abstract class BaseRepository<TTable extends object, InsertType> {
  protected readonly table: TTable;

  constructor(table: TTable) {
    this.table = table;
  }

  /**
   * Tìm theo các điều kiện (tương tự findBy của TypeORM)
   * @param conditions Đối tượng chứa các điều kiện tìm kiếm
   * @param tx Transaction tùy chọn
   * @returns Danh sách bản ghi thỏa mãn điều kiện
   */
  public async find<K extends keyof TTable>(
    conditions: Partial<Record<K, unknown>>,
    tx?: DrizzleTransaction
  ) {
    try {
      // Lựa chọn DB hoặc transaction
      const queryRunner = tx || db;

      // Tạo mảng các điều kiện WHERE
      const whereConditions: SQL<unknown>[] = [];

      // Đối với mỗi key trong đối tượng conditions, tạo điều kiện tương ứng
      for (const [key, value] of Object.entries(conditions)) {
        if (key in this.table) {
          const column = this.table[key as K];
          if (column) {
            whereConditions.push(eq(column as any, value));
          }
        }
      }

      // Nếu không có điều kiện, trả về tất cả bản ghi
      if (whereConditions.length === 0) {
        return queryRunner.select().from(this.table as any);
      }

      // Kết hợp tất cả điều kiện với AND
      const result = await queryRunner
        .select()
        .from(this.table as any)
        .where(
          whereConditions.length === 1
            ? whereConditions[0]
            : and(...whereConditions)
        );

      return result;
    } catch (error) {
      console.error(`Error finding records:`, error);
      throw error;
    }
  }

  /**
   * Tìm một bản ghi theo các điều kiện (tương tự findOneBy của TypeORM)
   * @param conditions Đối tượng chứa các điều kiện tìm kiếm
   * @param tx Transaction tùy chọn
   * @returns Bản ghi đầu tiên thỏa mãn điều kiện hoặc undefined nếu không tìm thấy
   */
  public async findOne<K extends keyof TTable>(
    conditions: Partial<Record<K, unknown>>,
    tx?: DrizzleTransaction
  ) {
    try {
      const results = await this.find(conditions, tx);
      return results[0];
    } catch (error) {
      console.error(`Error finding one record:`, error);
      throw error;
    }
  }

  /**
   * Tìm bản ghi theo ID
   * @param id ID của bản ghi cần tìm
   * @param tx Transaction tùy chọn
   * @returns Bản ghi được tìm thấy hoặc undefined nếu không tìm thấy
   */
  public async findById(id: number, tx?: DrizzleTransaction) {
    try {
      // Lựa chọn DB hoặc transaction
      const queryRunner = tx || db;

      // Giả định rằng mọi bảng đều có cột 'id'
      const result = await queryRunner
        .select()
        .from(this.table as any)
        .where(eq((this.table as any).id, id));
      return result[0];
    } catch (error) {
      console.error(`Error finding record by ID:`, error);
      throw error;
    }
  }

  /**
   * Lưu bản ghi mới vào cơ sở dữ liệu
   * @param data Dữ liệu bản ghi mới
   * @param tx Transaction tùy chọn
   * @returns Bản ghi đã được tạo với ID
   */
  public async save(data: InsertType, tx?: DrizzleTransaction) {
    try {
      // Lựa chọn DB hoặc transaction
      const queryRunner = tx || db;

      const result = await queryRunner
        .insert(this.table as any)
        .values(data as any)
        .returning();
      return Array.isArray(result) ? result[0] : result;
    } catch (error) {
      console.error(`Error saving record:`, error);
      throw error;
    }
  }

  /**
   * Cập nhật bản ghi
   * @param id ID của bản ghi cần cập nhật
   * @param data Dữ liệu cần cập nhật
   * @param tx Transaction tùy chọn
   * @returns Bản ghi đã được cập nhật
   */
  public async update<UpdateType>(
    id: number,
    data: UpdateType,
    tx?: DrizzleTransaction
  ) {
    try {
      // Lựa chọn DB hoặc transaction
      const queryRunner = tx || db;

      const result = await queryRunner
        .update(this.table as any)
        .set(data as any)
        .where(eq((this.table as any).id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error(`Error updating record:`, error);
      throw error;
    }
  }

  /**
   * Xóa bản ghi
   * @param id ID của bản ghi cần xóa
   * @param tx Transaction tùy chọn
   * @returns Bản ghi đã bị xóa
   */
  public async delete(id: number, tx?: DrizzleTransaction) {
    try {
      // Lựa chọn DB hoặc transaction
      const queryRunner = tx || db;

      const result = await queryRunner
        .delete(this.table as any)
        .where(eq((this.table as any).id, id))
        .returning();
      return Array.isArray(result) ? result[0] : result;
    } catch (error) {
      console.error(`Error deleting record:`, error);
      throw error;
    }
  }
}
