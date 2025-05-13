import { ModelManager } from "../model/model-manager";
import {
  OrderByClause,
  // SelectClause đã được thay thế bằng InternalSelectClause (không export)
  // SqlGenerator sẽ nhận một cấu trúc tương tự thông qua SqlGeneratorArgs
  WhereCondition,
} from "./query-builder";

// Định nghĩa lại cấu trúc cho select ở đây nếu InternalSelectClause không được export
// Hoặc tốt hơn là QueryBuilder sẽ chuẩn bị một cấu trúc mà SqlGenerator có thể dùng
interface ProcessableSelectClause {
  propertyToMap?: string;
  rawExpression?: string;
  outputAlias?: string;
}

// Các tham số cần thiết cho việc tạo SQL, lấy từ QueryBuilder
export interface SqlGeneratorArgs {
  selectClauses: ProcessableSelectClause[]; // Sử dụng cấu trúc mới
  whereConditions: WhereCondition[];
  orderByClauses: OrderByClause[];
  limitCount?: number;
  offsetCount?: number;
  fromTable: string;
  alias: string;
  entityClassName?: string;
  modelManager: ModelManager;
}

/**
 * Escapes a PostgreSQL identifier (table name, column name, alias).
 * It quotes the identifier with double quotes and escapes any internal double quotes by doubling them.
 * @param identifier The identifier to escape.
 * @returns The escaped identifier.
 */
function escapeIdentifier(identifier: string): string {
  if (identifier.includes('"')) {
    // eslint-disable-next-line no-param-reassign
    identifier = identifier.replace(/"/g, '""');
  }
  return `"${identifier}"`;
}

export class SqlGenerator {
  public static build(args: SqlGeneratorArgs): {
    sql: string;
    parameters: unknown[];
  } {
    // Logic tạo SQL sẽ được chuyển vào đây từ QueryBuilder.build()
    // Tạm thời trả về giá trị rỗng để file hợp lệ
    let sql = "SELECT ";
    const allParameters: unknown[] = [];

    // Đây là nơi toàn bộ logic từ QueryBuilder.build() sẽ được chuyển sang
    // Xử lý SELECT clauses
    if (args.selectClauses.length > 0) {
      const selectParts = args.selectClauses.map((clause) => {
        let selectPart: string;

        if (clause.propertyToMap && args.entityClassName) {
          const columnName = args.modelManager.getColumnName(
            args.entityClassName,
            clause.propertyToMap
          );
          if (columnName) {
            selectPart = `${escapeIdentifier(args.alias)}.${escapeIdentifier(columnName)}`;
          } else {
            // Không tìm thấy cột cho property, log warning và dùng property name trực tiếp (đã escape)
            // Điều này có thể không mong muốn, nhưng là một fallback
            console.warn(
              `SqlGenerator.build (SELECT): Không tìm thấy tên cột cho thuộc tính '${clause.propertyToMap}' trong entity '${args.entityClassName}'. Sử dụng tên thuộc tính (đã escape) với alias bảng.`
            );
            selectPart = `${escapeIdentifier(args.alias)}.${escapeIdentifier(clause.propertyToMap)}`;
          }
        } else if (clause.rawExpression) {
          selectPart = clause.rawExpression; // Sử dụng biểu thức thô trực tiếp
        } else if (clause.propertyToMap) {
          // Trường hợp có propertyToMap nhưng không có entityClassName (QueryBuilder từ string table name)
          // Coi propertyToMap là tên cột và escape nó cùng với alias bảng
          selectPart = `${escapeIdentifier(args.alias)}.${escapeIdentifier(clause.propertyToMap)}`;
        } else {
          // Trường hợp không hợp lệ, không có propertyToMap hay rawExpression
          // (logic trong QueryBuilder.select nên ngăn chặn điều này)
          console.error(
            "SqlGenerator.build (SELECT): Invalid select clause",
            clause
          );
          selectPart = "NULL"; // Fallback an toàn
        }

        // Thêm alias nếu có
        if (clause.outputAlias) {
          selectPart += ` AS ${escapeIdentifier(clause.outputAlias)}`;
        }

        return selectPart;
      });
      sql += selectParts.join(", ");
    } else {
      // TODO: Escape identifier: args.alias (cho args.alias.*)
      sql += `${escapeIdentifier(args.alias)}.*`;
    }

    // TODO: Escape identifier: args.fromTable
    // TODO: Escape identifier: args.alias (cho AS args.alias)
    sql += ` FROM ${escapeIdentifier(args.fromTable)} AS ${escapeIdentifier(args.alias)}`;

    let parameterIndex = 1; // Bắt đầu từ 1 cho placeholder

    // Xử lý WHERE
    if (args.whereConditions.length > 0) {
      sql += " WHERE ";
      const firstCondition = args.whereConditions[0]!;
      let firstProcessedCondition = firstCondition.condition;
      for (let i = 0; i < firstCondition.parameters.length; i++) {
        const placeholderRegex = new RegExp(`\\$${i + 1}(\\b|$)`);
        firstProcessedCondition = firstProcessedCondition.replace(
          placeholderRegex,
          `$${parameterIndex++}`
        );
        allParameters.push(firstCondition.parameters[i]!);
      }
      sql += `(${firstProcessedCondition})`;

      for (let j = 1; j < args.whereConditions.length; j++) {
        const wc = args.whereConditions[j]!;
        let processedCondition = wc.condition;
        for (let i = 0; i < wc.parameters.length; i++) {
          const placeholderRegex = new RegExp(`\\$${i + 1}(\\b|$)`);
          processedCondition = processedCondition.replace(
            placeholderRegex,
            `$${parameterIndex++}`
          );
          allParameters.push(wc.parameters[i]!);
        }
        sql += ` ${wc.operator} (${processedCondition})`;
      }
    }

    // Xử lý ORDER BY
    if (args.orderByClauses.length > 0) {
      sql += " ORDER BY ";
      const orderParts = args.orderByClauses.map((clause) => {
        let columnName = clause.field;
        if (args.entityClassName) {
          const metaColumnName = args.modelManager.getColumnName(
            args.entityClassName,
            clause.field
          );
          if (metaColumnName) {
            columnName = metaColumnName;
          } else {
            console.warn(
              `SqlGenerator.build (ORDER BY): Không tìm thấy tên cột cho thuộc tính '${clause.field}' trong entity '${args.entityClassName}'. Sử dụng tên thuộc tính trực tiếp.`
            );
          }
        }
        // TODO: Escape identifier: args.alias, columnName
        return `${escapeIdentifier(args.alias)}.${escapeIdentifier(columnName)} ${clause.direction}`;
      });
      sql += orderParts.join(", ");
    }

    // Xử lý LIMIT
    if (args.limitCount !== undefined) {
      sql += ` LIMIT $${parameterIndex++}`;
      allParameters.push(args.limitCount);
    }

    // Xử lý OFFSET
    if (args.offsetCount !== undefined) {
      sql += ` OFFSET $${parameterIndex++}`;
      allParameters.push(args.offsetCount);
    }

    return { sql, parameters: allParameters };
  }
}
