import { getCurrentUnixTimestamp } from "@repo/utils";
import {
  type BaseModel,
  type CreateModel,
  type UpdateModel,
  withBaseFields,
  withUpdateFields,
} from "./base-model";

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: "ASC" | "DESC";
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface WhereCondition {
  [key: string]: any;
}

export abstract class BaseRepository<T extends BaseModel> {
  protected abstract tableName: string;
  protected sql: any;

  constructor(sql: any) {
    this.sql = sql;
  }

  /**
   * Tìm tất cả records với pagination
   */
  async findAll(options: QueryOptions = {}): Promise<PaginationResult<T>> {
    const {
      limit = 10,
      offset = 0,
      orderBy = "created_at",
      orderDirection = "DESC",
    } = options;

    const [data, countResult] = await Promise.all([
      this.sql`
        SELECT * FROM ${this.sql(this.tableName)}
        ORDER BY ${this.sql(orderBy)} ${this.sql(orderDirection)}
        LIMIT ${limit}
        OFFSET ${offset}
      ` as Promise<T[]>,
      this
        .sql`SELECT COUNT(*) as count FROM ${this.sql(this.tableName)}` as Promise<
        [{ count: bigint }]
      >,
    ]);

    const total = Number(countResult[0].count);
    const totalPages = Math.ceil(total / limit);
    const page = Math.floor(offset / limit) + 1;

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Tìm record theo ID
   */
  async findById(id: bigint): Promise<T | null> {
    const result = (await this.sql`
      SELECT * FROM ${this.sql(this.tableName)}
      WHERE id = ${id}
    `) as T[];

    return result[0] ?? null;
  }

  /**
   * Tìm một record đầu tiên theo điều kiện
   */
  async findOne(conditions: WhereCondition): Promise<T | null> {
    const whereClause = this.buildWhereClause(conditions);

    const result = (await this.sql`
      SELECT * FROM ${this.sql(this.tableName)}
      WHERE ${whereClause}
      LIMIT 1
    `) as T[];

    return result[0] ?? null;
  }

  /**
   * Tìm records theo điều kiện
   */
  async findWhere(
    conditions: WhereCondition,
    options: QueryOptions = {}
  ): Promise<T[]> {
    const {
      limit = 10,
      offset = 0,
      orderBy = "created_at",
      orderDirection = "DESC",
    } = options;
    const whereClause = this.buildWhereClause(conditions);

    return (await this.sql`
      SELECT * FROM ${this.sql(this.tableName)}
      WHERE ${whereClause}
      ORDER BY ${this.sql(orderBy)} ${this.sql(orderDirection)}
      LIMIT ${limit}
      OFFSET ${offset}
    `) as T[];
  }

  /**
   * Tìm records với raw SQL where clause
   */
  async findByRawWhere(
    whereClause: string,
    params: any[] = [],
    options: QueryOptions = {}
  ): Promise<T[]> {
    const {
      limit = 10,
      offset = 0,
      orderBy = "created_at",
      orderDirection = "DESC",
    } = options;

    return (await this.sql.unsafe(
      `
      SELECT * FROM ${this.tableName}
      WHERE ${whereClause}
      ORDER BY ${orderBy} ${orderDirection}
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
    `,
      [...params, limit, offset]
    )) as T[];
  }

  /**
   * Tạo record mới
   */
  async create(data: CreateModel<T>, userId: bigint, tx?: any): Promise<T> {
    const insertData = withBaseFields(data, userId);
    const sqlInstance = tx ?? this.sql;

    const result = (await sqlInstance`
      INSERT INTO ${sqlInstance(this.tableName)} ${sqlInstance(insertData)}
      RETURNING *
    `) as T[];

    return result[0]!;
  }

  /**
   * Tạo nhiều records cùng lúc
   */
  async createMany(
    dataArray: CreateModel<T>[],
    userId: bigint,
    tx?: any
  ): Promise<T[]> {
    const insertDataArray = dataArray.map((data) =>
      withBaseFields(data, userId)
    );
    const sqlInstance = tx ?? this.sql;

    return (await sqlInstance`
      INSERT INTO ${sqlInstance(this.tableName)} ${sqlInstance(insertDataArray)}
      RETURNING *
    `) as T[];
  }

  /**
   * Update record theo ID
   */
  async update(
    id: bigint,
    data: UpdateModel<T>,
    userId: bigint,
    tx?: any
  ): Promise<T | null> {
    const updateData = withUpdateFields(data, userId);
    const sqlInstance = tx ?? this.sql;

    const result = (await sqlInstance`
      UPDATE ${sqlInstance(this.tableName)}
      SET ${sqlInstance(updateData)}
      WHERE id = ${id}
      RETURNING *
    `) as T[];

    return result[0] ?? null;
  }

  /**
   * Update records theo điều kiện
   */
  async updateWhere(
    conditions: WhereCondition,
    data: UpdateModel<T>,
    userId: bigint,
    tx?: any
  ): Promise<T[]> {
    const updateData = withUpdateFields(data, userId);
    const sqlInstance = tx ?? this.sql;
    const whereClause = this.buildWhereClause(conditions);

    return (await sqlInstance`
      UPDATE ${sqlInstance(this.tableName)}
      SET ${sqlInstance(updateData)}
      WHERE ${whereClause}
      RETURNING *
    `) as T[];
  }

  /**
   * Upsert (insert hoặc update nếu đã tồn tại)
   */
  async upsert(
    data: CreateModel<T>,
    conflictColumns: string[],
    userId: bigint,
    tx?: any
  ): Promise<T> {
    const insertData = withBaseFields(data, userId);
    const updateData = withUpdateFields(data as any, userId);
    const sqlInstance = tx ?? this.sql;

    const conflictClause = conflictColumns.join(", ");
    const updateClause = Object.keys(updateData)
      .map((key) => `${key} = EXCLUDED.${key}`)
      .join(", ");

    const result = (await sqlInstance.unsafe(
      `
      INSERT INTO ${this.tableName} (${Object.keys(insertData).join(", ")})
      VALUES (${Object.keys(insertData)
        .map((_, i) => `$${i + 1}`)
        .join(", ")})
      ON CONFLICT (${conflictClause})
      DO UPDATE SET ${updateClause}
      RETURNING *
    `,
      Object.values(insertData)
    )) as T[];

    return result[0]!;
  }

  /**
   * Xóa record theo ID
   */
  async delete(id: bigint, tx?: any): Promise<boolean> {
    const sqlInstance = tx ?? this.sql;
    const result = await sqlInstance`
      DELETE FROM ${sqlInstance(this.tableName)}
      WHERE id = ${id}
    `;

    return result.count > 0;
  }

  /**
   * Xóa records theo điều kiện
   */
  async deleteWhere(conditions: WhereCondition, tx?: any): Promise<number> {
    const sqlInstance = tx ?? this.sql;
    const whereClause = this.buildWhereClause(conditions);

    const result = await sqlInstance`
      DELETE FROM ${sqlInstance(this.tableName)}
      WHERE ${whereClause}
    `;

    return result.count;
  }

  /**
   * Đếm số lượng records
   */
  async count(conditions?: WhereCondition): Promise<number> {
    let query = this
      .sql`SELECT COUNT(*) as count FROM ${this.sql(this.tableName)}`;

    if (conditions && Object.keys(conditions).length > 0) {
      const whereClause = this.buildWhereClause(conditions);
      query = this
        .sql`SELECT COUNT(*) as count FROM ${this.sql(this.tableName)} WHERE ${whereClause}`;
    }

    const result = (await query) as [{ count: bigint }];
    return Number(result[0].count);
  }

  /**
   * Check if record exists
   */
  async exists(id: bigint): Promise<boolean> {
    const result = await this.sql`
      SELECT 1 FROM ${this.sql(this.tableName)}
      WHERE id = ${id}
      LIMIT 1
    `;

    return result.length > 0;
  }

  /**
   * Check if records exist theo điều kiện
   */
  async existsWhere(conditions: WhereCondition): Promise<boolean> {
    const whereClause = this.buildWhereClause(conditions);

    const result = await this.sql`
      SELECT 1 FROM ${this.sql(this.tableName)}
      WHERE ${whereClause}
      LIMIT 1
    `;

    return result.length > 0;
  }

  /**
   * Truncate table (xóa tất cả data)
   */
  async truncate(): Promise<void> {
    await this
      .sql`TRUNCATE TABLE ${this.sql(this.tableName)} RESTART IDENTITY CASCADE`;
  }

  /**
   * Execute raw SQL query
   */
  protected async raw<R = any>(query: string, params: any[] = []): Promise<R> {
    return (await this.sql.unsafe(query, params)) as R;
  }

  /**
   * Execute query trong transaction
   */
  async transaction<R>(
    callback: (tx: any, repo: this) => Promise<R>
  ): Promise<R> {
    return await this.sql.begin(async (tx: any) => {
      // Tạo temporary repo instance với transaction
      const tempRepo = Object.create(this);
      tempRepo.sql = tx;
      return await callback(tx, tempRepo);
    });
  }

  /**
   * Execute query trong transaction với isolation level
   */
  async transactionWithIsolation<R>(
    isolationLevel:
      | "READ UNCOMMITTED"
      | "READ COMMITTED"
      | "REPEATABLE READ"
      | "SERIALIZABLE",
    callback: (tx: any, repo: this) => Promise<R>
  ): Promise<R> {
    return await this.sql.begin(async (tx: any) => {
      // Set isolation level
      await tx.unsafe(`SET TRANSACTION ISOLATION LEVEL ${isolationLevel}`);

      // Tạo temporary repo instance với transaction
      const tempRepo = Object.create(this);
      tempRepo.sql = tx;
      return await callback(tx, tempRepo);
    });
  }

  /**
   * Tạo savepoint trong transaction
   */
  async createSavepoint(tx: any, savepointName: string): Promise<void> {
    await tx.unsafe(`SAVEPOINT ${savepointName}`);
  }

  /**
   * Rollback đến savepoint
   */
  async rollbackToSavepoint(tx: any, savepointName: string): Promise<void> {
    await tx.unsafe(`ROLLBACK TO SAVEPOINT ${savepointName}`);
  }

  /**
   * Release savepoint (xóa savepoint)
   */
  async releaseSavepoint(tx: any, savepointName: string): Promise<void> {
    await tx.unsafe(`RELEASE SAVEPOINT ${savepointName}`);
  }

  /**
   * Execute callback với savepoint - tự động rollback nếu có lỗi
   */
  async withSavepoint<R>(
    tx: any,
    savepointName: string,
    callback: (tx: any, repo: this) => Promise<R>
  ): Promise<R> {
    await this.createSavepoint(tx, savepointName);

    try {
      // Tạo temporary repo instance với transaction
      const tempRepo = Object.create(this);
      tempRepo.sql = tx;
      const result = await callback(tx, tempRepo);

      // Success - release savepoint
      await this.releaseSavepoint(tx, savepointName);
      return result;
    } catch (error) {
      // Error - rollback to savepoint
      await this.rollbackToSavepoint(tx, savepointName);
      throw error;
    }
  }

  /**
   * Nested transaction sử dụng savepoints
   */
  async nestedTransaction<R>(
    parentTx: any,
    callback: (tx: any, repo: this) => Promise<R>
  ): Promise<R> {
    const savepointName = `sp_${getCurrentUnixTimestamp()}_${Math.random().toString(36).slice(2, 11)}`;
    return await this.withSavepoint(parentTx, savepointName, callback);
  }

  /**
   * Execute multiple operations trong một transaction với partial rollback support
   */
  async batchWithSavepoints<R>(
    operations: Array<{
      name: string;
      operation: (tx: any, repo: BaseRepository<T>) => Promise<R>;
      onError?: "rollback" | "continue"; // Default: rollback
    }>
  ): Promise<
    Array<{ name: string; result?: R; error?: Error; rollbacked?: boolean }>
  > {
    return await this.transaction(async (tx, repo) => {
      const results: Array<{
        name: string;
        result?: R;
        error?: Error;
        rollbacked?: boolean;
      }> = [];

      for (const { name, operation, onError = "rollback" } of operations) {
        try {
          const result = await repo.withSavepoint(
            tx,
            `batch_${name}`,
            operation
          );
          results.push({ name, result });
        } catch (error) {
          if (onError === "rollback") {
            results.push({ name, error: error as Error, rollbacked: true });
          } else {
            // Continue without rollback (error was already handled by withSavepoint)
            results.push({ name, error: error as Error, rollbacked: false });
          }
        }
      }

      return results;
    });
  }

  /**
   * Transaction với retry logic
   */
  async transactionWithRetry<R>(
    callback: (tx: any, repo: this) => Promise<R>,
    maxRetries: number = 3,
    retryDelay: number = 100
  ): Promise<R> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.transaction(callback);
      } catch (error) {
        lastError = error as Error;

        // Check if error is retryable (serialization failure, deadlock, etc.)
        if (this.isRetryableError(error as Error) && attempt < maxRetries) {
          // Wait before retry with exponential backoff
          await this.delay(retryDelay * Math.pow(2, attempt - 1));
          continue;
        }

        // Non-retryable error or max retries reached
        throw error;
      }
    }

    throw lastError || new Error("Transaction failed after all retries");
  }

  /**
   * Helper để check nếu error có thể retry
   */
  private isRetryableError(error: Error): boolean {
    const retryableErrors = [
      "ERR_POSTGRES_SERIALIZATION_FAILURE",
      "ERR_POSTGRES_DEADLOCK_DETECTED",
      "ERR_POSTGRES_CONNECTION_TIMEOUT",
      "serialization_failure",
      "deadlock_detected",
    ];

    return retryableErrors.some(
      (errCode) =>
        error.message.includes(errCode) || (error as any).code === errCode
    );
  }

  /**
   * Helper để delay/sleep
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Batch operations
   */
  async batch(operations: Array<() => Promise<any>>): Promise<any[]> {
    return await Promise.all(operations.map((op) => op()));
  }

  /**
   * Build WHERE clause từ conditions object
   */
  private buildWhereClause(conditions: WhereCondition): any {
    const entries = Object.entries(conditions);

    if (entries.length === 0) {
      return this.sql`1 = 1`; // Always true
    }

    return entries
      .map(([key, value]) => this.sql`${this.sql(key)} = ${value}`)
      .reduce((acc, curr, index) => {
        if (index === 0) return curr;
        return this.sql`${acc} AND ${curr}`;
      }, null);
  }

  /**
   * Get table statistics
   */
  async getTableStats(): Promise<{ count: number; size: string }> {
    const result = (await this.sql.unsafe(`
      SELECT 
        COUNT(*) as count,
        pg_size_pretty(pg_total_relation_size('${this.tableName}')) as size
      FROM ${this.tableName}
    `)) as [{ count: bigint; size: string }];

    return {
      count: Number(result[0].count),
      size: result[0].size,
    };
  }
}
