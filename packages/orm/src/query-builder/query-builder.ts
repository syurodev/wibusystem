import { QueryResult } from "pg";
import { ConnectionManager } from "../connection/connection-manager";
import { ModelManager } from "../model/model-manager";
import type { Constructor } from "../model/types"; // Import Constructor type
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
export class QueryBuilder<Entity = any> {
  private readonly connectionManager: ConnectionManager;
  private readonly entityConstructor?: Constructor<Entity>; // Thêm readonly
  private readonly alias: string; // Thêm readonly
  private readonly fromTable: string; // Thêm readonly

  private readonly selectClauses: InternalSelectClause[] = []; // Thêm readonly
  private readonly whereConditions: WhereClauseCondition[] = []; // Thêm readonly
  private readonly orderByClauses: OrderByClause[] = []; // Thêm readonly
  private limitCount?: number;
  private offsetCount?: number;
  private returningClause?: ReturningOption;

  constructor(
    connectionManager: ConnectionManager,
    target: Constructor<Entity> | string // Chấp nhận Constructor hoặc string
  ) {
    this.connectionManager = connectionManager;

    let explicitTableName: string | undefined;

    if (typeof target === "function") {
      this.entityConstructor = target as Constructor<Entity>; // Gán constructor trực tiếp
      const metadata = ModelManager.getModelMetadata(this.entityConstructor); // Gọi static method
      this.fromTable =
        metadata.tableName ?? ModelManager.getTableName(this.entityConstructor); // Sử dụng static getTableName
      this.alias = this.entityConstructor.name.charAt(0).toLowerCase();
    } else {
      // target is a string
      // Nếu target là string, giả định nó là tên bảng tường minh
      // Hoặc có thể là tên class (string) mà ta cần lấy Constructor (khó hơn nếu không có registry Map<string, Constructor>)
      // Hiện tại, logic cũ của bạn khi target là string:
      //   1. Thử getModelMetadata(target as string) -> lỗi vì getModelMetadata cần Constructor
      //   2. Nếu không được thì coi target là explicitTableName
      // Đơn giản hóa: Nếu là string, coi là explicitTableName trước
      explicitTableName = target;
      this.fromTable = explicitTableName;
      this.alias = explicitTableName
        .split("_")
        .map((part) => part.charAt(0))
        .join("")
        .toLowerCase();
      // Không có entityConstructor trong trường hợp này, các hàm dựa vào metadata model sẽ không hoạt động đầy đủ
      // hoặc cần một cách khác để lấy thông tin cột (ví dụ: dựa vào tên trực tiếp)
      ModelManager.loggerService?.warn(
        `QueryBuilder initialized with table name '${target}'. Metadata-dependent features might be limited.`
      );
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
      // ModelManager.getColumnName(propertyName: string, modelClass?: Constructor<unknown>)
      const metaColumnName = ModelManager.getColumnName(
        field,
        this.entityConstructor
      );
      // getColumnName trả về tên cột đã snake_case hoặc tên trong metadata.
      // Nó không tự thêm alias của bảng.
      return `${this.alias}.${metaColumnName}`;
    }
    // Nếu không có entityConstructor, sử dụng field trực tiếp (có thể đã snake_case nếu là property)
    return `${this.alias}.${toSnakeCase(field)}`; // Fallback to snake_case if no constructor
  }

  private getMutationColumnName(field: string): string {
    if (this.entityConstructor) {
      const metaColumnName = ModelManager.getColumnName(
        field,
        this.entityConstructor
      );
      return metaColumnName; // getColumnName đã trả về tên cột đúng
    }
    return toSnakeCase(field); // Fallback nếu không có entityConstructor
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
        case "simple":
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
        case "in":
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
        default:
          const _exhaustiveCheck: never = condition;
          throw new Error(
            `Loại điều kiện WHERE không được hỗ trợ: ${(_exhaustiveCheck as any).type}`
          );
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
    const result = await this.connectionManager.query(sql, parameters);
    if (
      this.entityConstructor && // Check entityConstructor
      result.rows &&
      !this.selectClauses.some((c) => c.rawExpression)
    ) {
      return result.rows.map(
        (row) => ModelManager.fromDatabase(row, this.entityConstructor) // Gọi static method
      ) as ResultType[];
    }
    return (result.rows || []) as ResultType[];
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
        ModelManager.loggerService?.warn(
          `QueryBuilder.getOne: Limit hiện tại là ${this.limitCount}. Sẽ ghi đè thành LIMIT 1 vì không phải là query aggregate.`
        );
      }
      this.limit(1);
    }

    const { sql, parameters } = this.buildSelectSql();
    const result = await this.connectionManager.query(sql, parameters);

    if (originalLimit !== this.limitCount) {
      this.limitCount = originalLimit;
    }

    if (!result.rows || result.rows.length === 0) {
      return undefined;
    }

    const singleRow = result.rows[0];

    if (
      this.entityConstructor && // Check entityConstructor
      !this.selectClauses.some((c) => c.rawExpression)
    ) {
      return ModelManager.fromDatabase(
        singleRow,
        this.entityConstructor // Gọi static method
      ) as ResultType;
    }
    return singleRow as ResultType;
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
        if (!Object.prototype.hasOwnProperty.call(item, propName)) {
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
    const result = await this.connectionManager.query(sql, parameters);
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
      if (Object.prototype.hasOwnProperty.call(data, propName)) {
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
    const result = await this.connectionManager.query(sql, parameters);
    return result;
  }
}
