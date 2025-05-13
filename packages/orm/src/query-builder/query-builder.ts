import { PoolClient, QueryResult } from "pg";
import { ConnectionManager } from "../connection/connection-manager";
import { ModelManager } from "../model/model-manager";
import type { Constructor, ModelName } from "../model/types"; // Import Constructor type
import { toSnakeCase } from "../utils/naming-strategy"; // Import toSnakeCase
import {
  type InsertInput,
  type InternalSelectClause,
  type OrderByClause,
  type ReturningOption,
  type SelectInputItem,
  type UpdateInput,
  type WhereClauseCondition,
} from "./types";

/**
 * Lớp chính để xây dựng và thực thi các câu lệnh SQL.
 */
export class QueryBuilder<Entity extends object = any> {
  private readonly connectionManager: ConnectionManager;
  private readonly modelManager: ModelManager;
  private readonly entityConstructor?: Constructor<Entity>;
  private readonly alias: string;
  private readonly fromTable: string;
  private readonly client?: PoolClient;

  private readonly selectClauses: InternalSelectClause[] = [];
  private readonly whereConditions: WhereClauseCondition[] = [];
  private readonly orderByClauses: OrderByClause[] = [];
  private limitCount?: number;
  private offsetCount?: number;
  private returningClause?: ReturningOption;

  constructor(
    connectionManager: ConnectionManager,
    target: Constructor<Entity> | string,
    client?: PoolClient
  ) {
    this.connectionManager = connectionManager;
    this.modelManager = ModelManager.getInstance();
    this.client = client;

    let explicitTableName: string | undefined;

    if (typeof target === "function") {
      this.entityConstructor = target as Constructor<Entity>;
      const modelName = this.entityConstructor.name as ModelName;
      const definition =
        this.modelManager.getModelDefinition<Entity>(modelName);
      if (!definition) {
        throw new Error(
          `Không tìm thấy model definition cho \${modelName} khi khởi tạo QueryBuilder.`
        );
      }
      this.fromTable = definition.tableName;
      this.alias = modelName.charAt(0).toLowerCase();
    } else {
      explicitTableName = target;
      this.fromTable = explicitTableName;
      this.alias = explicitTableName
        .split("_")
        .map((part) => part.charAt(0))
        .join("")
        .toLowerCase();
    }

    if (!this.fromTable) {
      throw new Error(
        "Không thể khởi tạo QueryBuilder: không xác định được fromTable."
      );
    }
  }

  private getSelectColumnName(field: string): string {
    if (field === "*") {
      return "*";
    }
    if (this.entityConstructor) {
      const modelName = this.entityConstructor.name as ModelName;
      const metaColumnName = this.modelManager.getColumnName<Entity>(
        modelName,
        field as keyof Entity & string
      );
      return `${this.alias}.${metaColumnName}`;
    }
    return `${this.alias}.${toSnakeCase(field)}`;
  }

  private getMutationColumnName(field: string): string {
    if (this.entityConstructor) {
      const modelName = this.entityConstructor.name as ModelName;
      const metaColumnName = this.modelManager.getColumnName<Entity>(
        modelName,
        field as keyof Entity & string
      );
      return metaColumnName;
    }
    return toSnakeCase(field);
  }

  select(...items: SelectInputItem[]): this {
    const newSelectClauses = items.map((item) => {
      if (typeof item === "string") {
        const normalizedField = item.trim();
        const aliasRegex = /^(.*?)\s+AS\s+(\S+)$/i;
        const aliasMatch = aliasRegex.exec(normalizedField);
        if (aliasMatch && aliasMatch[1] && aliasMatch[2]) {
          return {
            rawExpression: aliasMatch[1].trim(),
            outputAlias: aliasMatch[2].trim(),
          };
        } else {
          return { propertyToMap: normalizedField };
        }
      } else if ("property" in item) {
        return { propertyToMap: item.property, outputAlias: item.alias };
      } else {
        return { rawExpression: item.expression, outputAlias: item.alias };
      }
    });
    this.selectClauses.push(...newSelectClauses);
    return this;
  }

  // --- Aggregate Functions ---
  private addAggregateSelect(
    funcName: string,
    field: string,
    alias?: string
  ): this {
    const processedField =
      field === "*" ? "*" : this.getSelectColumnName(field);
    const expression = `${funcName.toUpperCase()}(${processedField})`;
    const defaultAliasBase = field === "*" ? "all" : field.replace(/\W/g, "");
    const finalAlias = alias ?? toSnakeCase(`${funcName}_${defaultAliasBase}`);
    const selectItem: SelectInputItem = {
      expression,
      alias: finalAlias,
    };
    return this.select(selectItem);
  }

  count(field: string = "*", alias?: string): this {
    return this.addAggregateSelect("count", field, alias);
  }

  sum(field: string, alias?: string): this {
    if (field === "*") throw new Error("SUM(*) is not a valid SQL aggregate.");
    return this.addAggregateSelect("sum", field, alias);
  }

  avg(field: string, alias?: string): this {
    if (field === "*") throw new Error("AVG(*) is not a valid SQL aggregate.");
    return this.addAggregateSelect("avg", field, alias);
  }

  min(field: string, alias?: string): this {
    if (field === "*") throw new Error("MIN(*) is not a valid SQL aggregate.");
    return this.addAggregateSelect("min", field, alias);
  }

  max(field: string, alias?: string): this {
    if (field === "*") throw new Error("MAX(*) is not a valid SQL aggregate.");
    return this.addAggregateSelect("max", field, alias);
  }

  public where(condition: string, parameters: unknown[] = []): this {
    const operator = "AND";
    this.whereConditions.push({
      type: "simple",
      condition,
      parameters,
      operator,
    });
    return this;
  }

  public orWhere(condition: string, parameters: unknown[] = []): this {
    if (this.whereConditions.length === 0) {
      console.warn(
        "QueryBuilder: orWhere() called with no preceding where clause. Use where() for the first condition."
      );
      throw new Error("orWhere() cannot be the first condition.");
    }
    this.whereConditions.push({
      type: "simple",
      condition,
      parameters,
      operator: "OR",
    });
    return this;
  }

  public whereIn(field: string, values: unknown[]): this {
    if (!values || values.length === 0) {
      console.warn(
        `QueryBuilder: whereIn được gọi cho trường '${field}' với mảng giá trị rỗng. Điều kiện này sẽ được bỏ qua.`
      );
      return this;
    }
    const operator = "AND";
    this.whereConditions.push({
      type: "in",
      field,
      values,
      operator,
    });
    return this;
  }

  public orWhereIn(field: string, values: unknown[]): this {
    if (this.whereConditions.length === 0) {
      throw new Error(
        "orWhereIn() cannot be the first condition. Use whereIn() instead."
      );
    }
    if (!values || values.length === 0) {
      console.warn(
        `QueryBuilder: orWhereIn được gọi cho trường '${field}' với mảng giá trị rỗng. Điều kiện này sẽ được bỏ qua.`
      );
      return this;
    }
    this.whereConditions.push({
      type: "in",
      field,
      values,
      operator: "OR",
    });
    return this;
  }

  public whereNull(field: string): this {
    const operator = "AND";
    this.whereConditions.push({
      type: "null",
      field,
      operator,
    });
    return this;
  }

  public orWhereNull(field: string): this {
    if (this.whereConditions.length === 0) {
      throw new Error(
        "orWhereNull() cannot be the first condition. Use whereNull() instead."
      );
    }
    this.whereConditions.push({
      type: "null",
      field,
      operator: "OR",
    });
    return this;
  }

  public whereNotNull(field: string): this {
    const operator = "AND";
    this.whereConditions.push({
      type: "notNull",
      field,
      operator,
    });
    return this;
  }

  public orWhereNotNull(field: string): this {
    if (this.whereConditions.length === 0) {
      throw new Error(
        "orWhereNotNull() cannot be the first condition. Use whereNotNull() instead."
      );
    }
    this.whereConditions.push({
      type: "notNull",
      field,
      operator: "OR",
    });
    return this;
  }

  public whereBetween(
    field: string,
    startValue: unknown,
    endValue: unknown
  ): this {
    const operator = "AND";
    this.whereConditions.push({
      type: "between",
      field,
      startValue,
      endValue,
      operator,
    });
    return this;
  }

  public orWhereBetween(
    field: string,
    startValue: unknown,
    endValue: unknown
  ): this {
    if (this.whereConditions.length === 0) {
      throw new Error(
        "orWhereBetween() cannot be the first condition. Use whereBetween() instead."
      );
    }
    this.whereConditions.push({
      type: "between",
      field,
      startValue,
      endValue,
      operator: "OR",
    });
    return this;
  }

  public whereLike(field: string, pattern: string): this {
    const operator = "AND";
    this.whereConditions.push({
      type: "like",
      field,
      pattern,
      operator,
    });
    return this;
  }

  public orWhereLike(field: string, pattern: string): this {
    if (this.whereConditions.length === 0) {
      throw new Error(
        "orWhereLike() cannot be the first condition. Use whereLike() instead."
      );
    }
    this.whereConditions.push({
      type: "like",
      field,
      pattern,
      operator: "OR",
    });
    return this;
  }

  public whereILike(field: string, pattern: string): this {
    const operator = "AND";
    this.whereConditions.push({
      type: "ilike",
      field,
      pattern,
      operator,
    });
    return this;
  }

  public orWhereILike(field: string, pattern: string): this {
    if (this.whereConditions.length === 0) {
      throw new Error(
        "orWhereILike() cannot be the first condition. Use whereILike() instead."
      );
    }
    this.whereConditions.push({
      type: "ilike",
      field,
      pattern,
      operator: "OR",
    });
    return this;
  }

  public orderBy(field: string, direction: "ASC" | "DESC" = "ASC"): this {
    this.orderByClauses.push({ field, direction });
    return this;
  }

  public limit(count: number): this {
    if (count < 0) {
      throw new Error("LIMIT count must be non-negative.");
    }
    this.limitCount = count;
    return this;
  }

  public offset(count: number): this {
    if (count < 0) {
      throw new Error("OFFSET count must be non-negative.");
    }
    this.offsetCount = count;
    return this;
  }

  public returning(columns: ReturningOption = "*"): this {
    this.returningClause = columns;
    return this;
  }

  private buildReturningSql(): string {
    if (!this.returningClause) {
      return "";
    }
    let columnsToReturn: string;
    if (this.returningClause === "*") {
      columnsToReturn = "*";
    } else if (Array.isArray(this.returningClause)) {
      columnsToReturn = this.returningClause
        .map((col) => `"${this.getMutationColumnName(col)}"`)
        .join(", ");
    } else {
      columnsToReturn = `"${this.getMutationColumnName(this.returningClause)}"`;
    }
    return `RETURNING ${columnsToReturn}`;
  }

  private buildWhereClause(parameterIndexOffset: number): {
    whereSql: string;
    parameters: unknown[];
  } {
    if (this.whereConditions.length === 0) {
      return { whereSql: "", parameters: [] };
    }

    let whereSqlText = "";
    const parameters: unknown[] = [];
    let currentParameterIndex = parameterIndexOffset;

    this.whereConditions.forEach((condition, index) => {
      let conditionSql = "";
      let conditionParams: unknown[] = [];
      let columnNameForCondition: string;

      switch (condition.type) {
        case "simple": {
          let simpleConditionSql = condition.condition;
          condition.parameters.forEach((_, i) => {
            simpleConditionSql = simpleConditionSql.replace(
              `$${i + 1}`,
              `$${currentParameterIndex + i + 1}`
            );
          });
          conditionSql = `(${simpleConditionSql})`;
          conditionParams = condition.parameters;
          break;
        }
        case "in": {
          columnNameForCondition = this.getSelectColumnName(condition.field);
          if (condition.values.length > 0) {
            const placeholders = condition.values
              .map((_, i) => `$${currentParameterIndex + i + 1}`)
              .join(", ");
            conditionSql = `${columnNameForCondition} IN (${placeholders})`;
            conditionParams = condition.values;
          } else {
            conditionSql = "1 = 0";
          }
          break;
        }
        case "null":
          columnNameForCondition = this.getSelectColumnName(condition.field);
          conditionSql = `${columnNameForCondition} IS NULL`;
          break;
        case "notNull":
          columnNameForCondition = this.getSelectColumnName(condition.field);
          conditionSql = `${columnNameForCondition} IS NOT NULL`;
          break;
        case "between":
          columnNameForCondition = this.getSelectColumnName(condition.field);
          conditionSql = `${columnNameForCondition} BETWEEN $${currentParameterIndex + 1} AND $${currentParameterIndex + 2}`;
          conditionParams = [condition.startValue, condition.endValue];
          break;
        case "like":
          columnNameForCondition = this.getSelectColumnName(condition.field);
          conditionSql = `${columnNameForCondition} LIKE $${currentParameterIndex + 1}`;
          conditionParams = [condition.pattern];
          break;
        case "ilike":
          columnNameForCondition = this.getSelectColumnName(condition.field);
          conditionSql = `${columnNameForCondition} ILIKE $${currentParameterIndex + 1}`;
          conditionParams = [condition.pattern];
          break;
        default: {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const _exhaustiveCheck: never = condition;
          throw new Error(
            `Loại điều kiện WHERE không được hỗ trợ: ${(_exhaustiveCheck as any).type}`
          );
        }
      }

      if (index === 0) {
        whereSqlText += conditionSql;
      } else {
        whereSqlText += ` ${condition.operator} ${conditionSql}`;
      }

      parameters.push(...conditionParams);
      currentParameterIndex += conditionParams.length;
    });

    return { whereSql: `WHERE ${whereSqlText}`, parameters };
  }

  private buildSelectSql(): { sql: string; parameters: unknown[] } {
    let selectSqlString: string;
    if (this.selectClauses.length === 0) {
      selectSqlString = `${this.alias}.*`;
    } else {
      selectSqlString = this.selectClauses
        .map((clause) => {
          let fieldSql: string;
          if (clause.propertyToMap) {
            fieldSql = this.getSelectColumnName(clause.propertyToMap);
          } else if (clause.rawExpression) {
            fieldSql = clause.rawExpression;
          } else {
            console.error("Invalid select clause:", clause);
            return "";
          }
          if (clause.outputAlias) {
            return `${fieldSql} AS "${clause.outputAlias}"`;
          }
          return fieldSql;
        })
        .filter(Boolean)
        .join(", ");
    }

    if (!selectSqlString) {
      throw new Error(
        "Không thể xây dựng mệnh đề SELECT: không có cột hoặc biểu thức nào được chọn hợp lệ."
      );
    }

    const fromSql = `"${this.fromTable}" AS ${this.alias}`;
    const { whereSql, parameters: whereParams } = this.buildWhereClause(0);

    let orderBySql = "";
    if (this.orderByClauses.length > 0) {
      orderBySql =
        "ORDER BY " +
        this.orderByClauses
          .map((clause) => {
            const column = this.getSelectColumnName(clause.field);
            return `${column} ${clause.direction}`;
          })
          .join(", ");
    }

    let limitSql = "";
    let offsetSql = "";
    const limitOffsetParams: number[] = [];

    if (this.limitCount !== undefined) {
      const limitParamIndex = whereParams.length + 1;
      limitSql = `LIMIT $${limitParamIndex}`;
      limitOffsetParams.push(this.limitCount);
    }

    if (this.offsetCount !== undefined) {
      const offsetParamIndex =
        whereParams.length + limitOffsetParams.length + 1;
      offsetSql = `OFFSET $${offsetParamIndex}`;
      limitOffsetParams.push(this.offsetCount);
    }

    const sql =
      `SELECT ${selectSqlString} FROM ${fromSql} ${whereSql} ${orderBySql} ${limitSql} ${offsetSql}`.trim();
    const allParameters = [...whereParams, ...limitOffsetParams];

    return { sql, parameters: allParameters };
  }

  /**
   * @deprecated Use getSqlAndParameters() or direct execution methods (getOne, getMany, insert, update) instead.
   */
  build(): { sql: string; parameters: unknown[] } {
    console.warn(
      "QueryBuilder.build() is deprecated. Use getSqlAndParameters() or direct execution methods instead."
    );
    return this.buildSelectSql();
  }

  async getMany<ResultType = Partial<Entity>>(): Promise<ResultType[]> {
    const { sql, parameters } = this.buildSelectSql();
    const result = await this.connectionManager.query(
      sql,
      parameters,
      this.client
    );
    if (
      this.entityConstructor &&
      result.rows &&
      !this.selectClauses.some((c) => c.rawExpression)
    ) {
      const modelName = this.entityConstructor.name as ModelName;
      return result.rows.map((row) =>
        this.modelManager.convertFromDatabaseFormat<Entity>(row, modelName)
      ) as unknown as ResultType[];
    }
    return (result.rows || []) as unknown as ResultType[];
  }

  async getOne<ResultType = Partial<Entity>>(): Promise<
    ResultType | undefined
  > {
    const originalLimit = this.limitCount;
    if (
      this.limitCount === undefined ||
      (this.limitCount !== 1 &&
        !this.selectClauses.some((c) =>
          /^(COUNT|SUM|AVG|MIN|MAX)\(.*\)$/i.exec(c.rawExpression ?? "")
        ))
    ) {
      if (this.limitCount !== undefined && this.limitCount !== 1) {
        // Loại bỏ loggerService không còn tồn tại
        // ModelManager.loggerService?.warn(
        //   `QueryBuilder.getOne: Limit hiện tại là ${this.limitCount}. Sẽ ghi đè thành LIMIT 1 vì không phải là query aggregate.`
        // );
        // Nếu cần log, QueryBuilder có thể có logger riêng hoặc dựa vào ModelManager tự log.
        // Hiện tại, chúng ta chỉ thay đổi limit.
      }
      this.limit(1);
    }

    const { sql, parameters } = this.buildSelectSql();
    const result = await this.connectionManager.query(
      sql,
      parameters,
      this.client
    );

    if (originalLimit !== this.limitCount) {
      this.limitCount = originalLimit;
    }

    if (!result.rows || result.rows.length === 0) {
      return undefined;
    }

    const singleRow = result.rows[0];

    if (
      this.entityConstructor &&
      !this.selectClauses.some((c) => c.rawExpression)
    ) {
      const modelName = this.entityConstructor.name as ModelName;
      return this.modelManager.convertFromDatabaseFormat<Entity>(
        singleRow,
        modelName
      ) as unknown as ResultType;
    }
    return singleRow as unknown as ResultType;
  }

  getSqlAndParameters(): { sql: string; parameters: unknown[] } {
    console.warn(
      "QueryBuilder.getSqlAndParameters() currently defaults to building a SELECT query."
    );
    return this.buildSelectSql();
  }

  private buildInsertSql(data: InsertInput): {
    sql: string;
    parameters: unknown[];
  } {
    const itemsToInsert = Array.isArray(data) ? data : [data];
    if (itemsToInsert.length === 0) {
      throw new Error("INSERT data cannot be empty.");
    }

    const firstItem = itemsToInsert[0];
    if (!firstItem) {
      throw new Error(
        "Internal error: firstItem is unexpectedly undefined in buildInsertSql."
      );
    }

    const columns = Object.keys(firstItem).map(
      (propName) => `"${this.getMutationColumnName(propName)}"`
    );
    const columnNamesString = columns.join(", ");

    const valuePlaceholders: string[] = [];
    const allParameters: unknown[] = [];
    let currentParamIndex = 1;

    itemsToInsert.forEach((item) => {
      const paramsForItem: unknown[] = [];
      const itemPlaceholders = Object.keys(firstItem).map((propName) => {
        if (!Object.hasOwn(item, propName)) {
          throw new Error(
            `Missing property '${propName}' in one of the items for batch insert.`
          );
        }
        paramsForItem.push(item[propName]);
        return `$${currentParamIndex++}`;
      });
      valuePlaceholders.push(`(${itemPlaceholders.join(", ")})`);
      allParameters.push(...paramsForItem);
    });

    const valuesString = valuePlaceholders.join(", ");
    const returningSql = this.buildReturningSql();
    const sql =
      `INSERT INTO "${this.fromTable}" (${columnNamesString}) VALUES ${valuesString} ${returningSql}`.trim();

    return { sql, parameters: allParameters };
  }

  public async insert(data: InsertInput): Promise<QueryResult<any>> {
    const { sql, parameters } = this.buildInsertSql(data);
    const result = await this.connectionManager.query(
      sql,
      parameters,
      this.client
    );
    return result;
  }

  private buildUpdateSql(data: UpdateInput): {
    sql: string;
    parameters: unknown[];
  } {
    const setClauses: string[] = [];
    const parameters: unknown[] = [];
    let currentParamIndex = 1;

    for (const propName in data) {
      if (Object.hasOwn(data, propName)) {
        const columnName = this.getMutationColumnName(propName);
        setClauses.push(`"${columnName}" = $${currentParamIndex++}`);
        parameters.push(data[propName]);
      }
    }

    if (setClauses.length === 0) {
      throw new Error("UPDATE data cannot be empty.");
    }

    const setString = setClauses.join(", ");
    const { whereSql, parameters: whereParams } = this.buildWhereClause(
      currentParamIndex - 1
    );
    parameters.push(...whereParams);

    const returningSql = this.buildReturningSql();
    const finalWhereSql = whereSql.startsWith("WHERE ")
      ? whereSql.substring(6)
      : whereSql;
    const sql =
      `UPDATE "${this.fromTable}" SET ${setString} ${finalWhereSql ? "WHERE " + finalWhereSql : ""} ${returningSql}`.trim();

    return { sql, parameters };
  }

  public async update(data: UpdateInput): Promise<QueryResult<any>> {
    if (this.whereConditions.length === 0) {
      console.warn(
        "QueryBuilder.update() called without a WHERE clause. This will update all rows in the table. If this is intentional, consider adding a comment or an explicit bypass."
      );
    }
    const { sql, parameters } = this.buildUpdateSql(data);
    const result = await this.connectionManager.query(
      sql,
      parameters,
      this.client
    );
    return result;
  }

  private buildDeleteSql(): { sql: string; parameters: unknown[] } {
    const fromSql = `"${this.fromTable}"`;
    // buildWhereClause nhận tham số là vị trí bắt đầu của placeholder cho parameter.
    // Vì DELETE chỉ có WHERE clause (và RETURNING không dùng parameter), nên bắt đầu từ 0.
    const { whereSql, parameters: whereParams } = this.buildWhereClause(0);
    const returningSql = this.buildReturningSql();

    // whereSql đã chứa từ khóa "WHERE" nếu có điều kiện.
    const sql = `DELETE FROM ${fromSql} ${whereSql} ${returningSql}`.trim();

    return { sql, parameters: whereParams };
  }

  public async delete(): Promise<QueryResult<any>> {
    if (this.whereConditions.length === 0) {
      console.warn(
        `QueryBuilder.delete() được gọi mà không có mệnh đề WHERE. Thao tác này sẽ XÓA TẤT CẢ các hàng trong bảng '${this.fromTable}'. Nếu đây là ý định, hãy xem xét việc thêm một comment hoặc một cơ chế xác nhận rõ ràng.`
      );
      // Để an toàn hơn, có thể throw lỗi ở đây nếu không có mệnh đề WHERE,
      // hoặc yêu cầu một flag đặc biệt để cho phép xóa toàn bộ bảng.
      // throw new Error(`DELETE operation on table '${this.fromTable}' requires a WHERE clause.`);
    }

    const { sql, parameters } = this.buildDeleteSql();
    const result = await this.connectionManager.query(
      sql,
      parameters,
      this.client
    );
    return result;
  }
}
