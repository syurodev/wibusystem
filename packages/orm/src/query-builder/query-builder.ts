import { ConnectionManager } from "../connection/connection-manager";
import { ModelManager } from "../model/model-manager";
import { SqlGenerator } from "./sql-generator";
// Import các types cần thiết từ ./types khi chúng được định nghĩa

/**
 * Interface định nghĩa cấu trúc cho một điều kiện WHERE
 */
export interface WhereCondition {
  condition: string; // Ví dụ: "user.status = $1" hoặc "posts.createdAt > $2"
  parameters: unknown[]; // Tham số tương ứng với condition
  operator: "AND" | "OR"; // Toán tử để nối với điều kiện trước đó
}

/**
 * Interface định nghĩa cấu trúc cho một mệnh đề ORDER BY
 */
export interface OrderByClause {
  field: string; // Tên thuộc tính hoặc tên cột
  direction: "ASC" | "DESC";
}

// Xóa SelectClause cũ nếu không cần nữa hoặc định nghĩa InternalSelectClause riêng

/**
 * Cấu trúc nội bộ để lưu trữ một mệnh đề SELECT đã được phân tích.
 */
interface InternalSelectClause {
  // Giữ là internal, không cần export trừ khi SqlGenerator cần
  propertyToMap?: string; // Tên thuộc tính của entity cần map sang tên cột
  rawExpression?: string; // Biểu thức SQL thô
  outputAlias?: string; // Alias cho cột trong kết quả (ví dụ: 'userName')
  // Một trong propertyToMap hoặc rawExpression phải được định nghĩa
}

type SelectInputItem =
  | string
  | { property: string; alias?: string }
  | { expression: string; alias: string }; // Alias bắt buộc cho expression

/**
 * Lớp chính để xây dựng và thực thi các câu lệnh SQL.
 * Sẽ hỗ trợ các phương thức như select, where, orderBy, limit, offset, join, etc.
 * và cuối cùng là các phương thức để lấy dữ liệu (getOne, getMany, execute).
 */
export class QueryBuilder<Entity = any> {
  // Sử dụng generic Entity để có thể type-safe hơn sau này
  private readonly connectionManager: ConnectionManager;
  private readonly modelManager: ModelManager;
  private readonly entityClassName?: string; // Lưu tên class nếu target là class
  private alias: string; // Alias cho bảng chính (ví dụ: "u" cho "users")
  private fromTable: string; // Tên bảng thực tế từ metadata

  // Các thuộc tính để lưu trữ trạng thái của query đang được xây dựng
  private selectClauses: InternalSelectClause[] = []; // Sử dụng cấu trúc InternalSelectClause
  private whereConditions: WhereCondition[] = []; // Mảng lưu các điều kiện WHERE
  private orderByClauses: OrderByClause[] = []; // Mảng lưu các mệnh đề ORDER BY
  private limitCount?: number; // Sẽ thêm sau
  private offsetCount?: number; // Sẽ thêm sau

  constructor(
    connectionManager: ConnectionManager,
    modelManager: ModelManager,
    // eslint-disable-next-line @typescript-eslint/ban-types
    target: Function | string
  ) {
    this.connectionManager = connectionManager;
    this.modelManager = modelManager;

    let className: string | undefined;
    let explicitTableName: string | undefined;

    if (typeof target === "function") {
      className = target.name;
    } else {
      // Nếu target là string, giả định đó có thể là tên class hoặc tên bảng
      // Ưu tiên kiểm tra xem có metadata cho class name đó không
      const metadataByClassName = this.modelManager.getModelMetadata(target);
      if (metadataByClassName) {
        className = target;
      } else {
        // Nếu không có metadata, coi string đó là tên bảng tường minh
        explicitTableName = target;
      }
    }

    if (className) {
      const metadata = this.modelManager.getModelMetadata(className);
      this.entityClassName = className; // Lưu tên class
      if (!metadata || !metadata.tableName) {
        // Ném lỗi hoặc xử lý trường hợp metadata/tên bảng không tồn tại
        // Tạm thời vẫn dùng tên class nếu không có metadata, nhưng cảnh báo
        console.warn(
          `QueryBuilder: Không tìm thấy metadata hoặc tableName cho class "${className}". Sử dụng tên class làm tên bảng tạm thời.`
        );
        this.fromTable = this.modelManager.getTableName(className) || className; // Lấy tên bảng nếu có
      } else {
        this.fromTable = metadata.tableName;
      }
      // Tạo alias: chữ cái đầu tiên của tên class viết thường
      this.alias = className.charAt(0).toLowerCase();
    } else if (explicitTableName) {
      this.fromTable = explicitTableName;
      // Tạo alias từ tên bảng (ví dụ: "user_profiles" -> "up")
      this.alias = explicitTableName
        .split("_")
        .map((part) => part.charAt(0))
        .join("")
        .toLowerCase();
      // Cần đảm bảo alias không bị trùng nếu có join sau này
    } else {
      // Trường hợp không xác định được target
      throw new Error("Không thể khởi tạo QueryBuilder: Target không hợp lệ.");
    }
  }

  /**
   * Chỉ định các cột cần chọn.
   * Nếu không gọi, mặc định là chọn tất cả các cột của bảng chính (`alias.*`).
   * @param items Danh sách các mục cần chọn. Mỗi mục có thể là:
   *              - Tên thuộc tính (string): ví dụ `'userName'`
   *              - Chuỗi `"expression AS alias"`: ví dụ `'COUNT(*) AS total'`
   *              - Object `{ property: string; alias?: string }`: ví dụ `{ property: 'registrationDate', alias: 'regDate' }`
   *              - Object `{ expression: string; alias: string }`: ví dụ `{ expression: 'LOWER(email)', alias: 'lowerEmail' }`
   */
  select(...items: SelectInputItem[]): this {
    this.selectClauses = items.map((item) => {
      if (typeof item === "string") {
        const normalizedField = item.trim();
        const aliasRegex = /^(.*?)\s+AS\s+(\S+)$/i;
        const aliasMatch = normalizedField.match(aliasRegex);
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
        // 'expression' in item
        return { rawExpression: item.expression, outputAlias: item.alias };
      }
    });
    return this;
  }

  /**
   * Thêm một điều kiện WHERE vào câu lệnh.
   * Các điều kiện sẽ được nối với nhau bằng AND.
   * Sử dụng placeholder $1, $2,... cho tham số.
   * @param condition Chuỗi điều kiện (ví dụ: `"age > $1"` hoặc `"status = $1 AND name LIKE $2"`).
   * @param parameters Mảng các tham số tương ứng với placeholder trong condition.
   */
  public where(condition: string, parameters: unknown[] = []): this {
    // Nếu là điều kiện đầu tiên, operator là AND (mặc định)
    // Nếu không phải đầu tiên, cũng là AND (vì đây là hàm `where`)
    const operator = this.whereConditions.length === 0 ? "AND" : "AND";

    this.whereConditions.push({ condition, parameters, operator });

    return this;
  }

  /**
   * Thêm một điều kiện OR WHERE vào câu lệnh.
   * @param condition Chuỗi điều kiện.
   * @param parameters Mảng các tham số.
   */
  public orWhere(condition: string, parameters: unknown[] = []): this {
    if (this.whereConditions.length === 0) {
      // orWhere không có ý nghĩa nếu là điều kiện đầu tiên. Ném lỗi để rõ ràng.
      console.warn(
        "QueryBuilder: orWhere() called with no preceding where clause. Use where() for the first condition."
      );
      // Ném lỗi hoặc coi nó như where()
      throw new Error("orWhere() cannot be the first condition.");
      // Hoặc: return this.where(condition, parameters); // Coi như where nếu không muốn ném lỗi
    }

    // Chỉ thêm nếu đã có điều kiện trước đó
    this.whereConditions.push({ condition, parameters, operator: "OR" });

    return this;
  }

  /**
   * Thêm điều kiện `WHERE field IN (...)`.
   * @param field Tên thuộc tính hoặc tên cột.
   * @param values Mảng các giá trị.
   */
  public whereIn(field: string, values: unknown[]): this {
    if (!values || values.length === 0) {
      // Nếu mảng giá trị rỗng, có thể coi là điều kiện không bao giờ đúng (WHERE 1=0)
      // Hoặc bỏ qua điều kiện này. Tạm thời sẽ bỏ qua.
      console.warn(
        `QueryBuilder: whereIn được gọi cho trường '${field}' với mảng giá trị rỗng. Điều kiện này sẽ được bỏ qua.`
      );
      return this;
    }

    // Cố gắng lấy tên cột từ metadata
    let columnName = field;
    if (this.entityClassName) {
      const metaColumnName = this.modelManager.getColumnName(
        this.entityClassName,
        field
      );
      if (metaColumnName) {
        columnName = metaColumnName;
      } else {
        console.warn(
          `QueryBuilder.whereIn: Không tìm thấy tên cột cho thuộc tính '${field}' trong entity '${this.entityClassName}'. Sử dụng tên thuộc tính trực tiếp.`
        );
      }
    }

    // Tạo placeholders: ($1, $2, ...)
    const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");
    const condition = `${this.alias}.${columnName} IN (${placeholders})`;

    // Sử dụng toán tử AND cho điều kiện này
    const operator = this.whereConditions.length === 0 ? "AND" : "AND";
    this.whereConditions.push({ condition, parameters: values, operator });

    return this;
  }

  /**
   * Thêm điều kiện `OR WHERE field IN (...)`.
   * @param field Tên thuộc tính hoặc tên cột.
   * @param values Mảng các giá trị.
   */
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

    let columnName = field;
    if (this.entityClassName) {
      const metaColumnName = this.modelManager.getColumnName(
        this.entityClassName,
        field
      );
      if (metaColumnName) {
        columnName = metaColumnName;
      } else {
        console.warn(
          `QueryBuilder.orWhereIn: Không tìm thấy tên cột cho thuộc tính '${field}' trong entity '${this.entityClassName}'. Sử dụng tên thuộc tính trực tiếp.`
        );
      }
    }

    const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");
    const condition = `${this.alias}.${columnName} IN (${placeholders})`;

    this.whereConditions.push({
      condition,
      parameters: values,
      operator: "OR",
    });

    return this;
  }

  /**
   * Thêm điều kiện `WHERE field IS NULL`.
   * @param field Tên thuộc tính hoặc tên cột.
   */
  public whereNull(field: string): this {
    let columnName = field;
    if (this.entityClassName) {
      const metaColumnName = this.modelManager.getColumnName(
        this.entityClassName,
        field
      );
      if (metaColumnName) {
        columnName = metaColumnName;
      } else {
        console.warn(
          `QueryBuilder.whereNull: Không tìm thấy tên cột cho thuộc tính '${field}' trong entity '${this.entityClassName}'. Sử dụng tên thuộc tính trực tiếp.`
        );
      }
    }

    const condition = `${this.alias}.${columnName} IS NULL`;
    const operator = this.whereConditions.length === 0 ? "AND" : "AND";
    this.whereConditions.push({ condition, parameters: [], operator });

    return this;
  }

  /**
   * Thêm điều kiện `OR WHERE field IS NULL`.
   * @param field Tên thuộc tính hoặc tên cột.
   */
  public orWhereNull(field: string): this {
    if (this.whereConditions.length === 0) {
      throw new Error(
        "orWhereNull() cannot be the first condition. Use whereNull() instead."
      );
    }

    let columnName = field;
    if (this.entityClassName) {
      const metaColumnName = this.modelManager.getColumnName(
        this.entityClassName,
        field
      );
      if (metaColumnName) {
        columnName = metaColumnName;
      } else {
        console.warn(
          `QueryBuilder.orWhereNull: Không tìm thấy tên cột cho thuộc tính '${field}' trong entity '${this.entityClassName}'. Sử dụng tên thuộc tính trực tiếp.`
        );
      }
    }

    const condition = `${this.alias}.${columnName} IS NULL`;
    this.whereConditions.push({ condition, parameters: [], operator: "OR" });

    return this;
  }

  /**
   * Thêm điều kiện `WHERE field IS NOT NULL`.
   * @param field Tên thuộc tính hoặc tên cột.
   */
  public whereNotNull(field: string): this {
    let columnName = field;
    if (this.entityClassName) {
      const metaColumnName = this.modelManager.getColumnName(
        this.entityClassName,
        field
      );
      if (metaColumnName) {
        columnName = metaColumnName;
      } else {
        console.warn(
          `QueryBuilder.whereNotNull: Không tìm thấy tên cột cho thuộc tính '${field}' trong entity '${this.entityClassName}'. Sử dụng tên thuộc tính trực tiếp.`
        );
      }
    }

    const condition = `${this.alias}.${columnName} IS NOT NULL`;
    const operator = this.whereConditions.length === 0 ? "AND" : "AND";
    this.whereConditions.push({ condition, parameters: [], operator });

    return this;
  }

  /**
   * Thêm điều kiện `OR WHERE field IS NOT NULL`.
   * @param field Tên thuộc tính hoặc tên cột.
   */
  public orWhereNotNull(field: string): this {
    if (this.whereConditions.length === 0) {
      throw new Error(
        "orWhereNotNull() cannot be the first condition. Use whereNotNull() instead."
      );
    }

    let columnName = field;
    if (this.entityClassName) {
      const metaColumnName = this.modelManager.getColumnName(
        this.entityClassName,
        field
      );
      if (metaColumnName) {
        columnName = metaColumnName;
      } else {
        console.warn(
          `QueryBuilder.orWhereNotNull: Không tìm thấy tên cột cho thuộc tính '${field}' trong entity '${this.entityClassName}'. Sử dụng tên thuộc tính trực tiếp.`
        );
      }
    }

    const condition = `${this.alias}.${columnName} IS NOT NULL`;
    this.whereConditions.push({ condition, parameters: [], operator: "OR" });

    return this;
  }

  /**
   * Thêm mệnh đề ORDER BY vào câu lệnh.
   * Có thể gọi nhiều lần để sắp xếp theo nhiều cột.
   * @param field Tên thuộc tính của entity hoặc tên cột để sắp xếp.
   * @param direction Hướng sắp xếp ("ASC" hoặc "DESC"). Mặc định là "ASC".
   */
  public orderBy(field: string, direction: "ASC" | "DESC" = "ASC"): this {
    this.orderByClauses.push({ field, direction });
    return this;
  }

  /**
   * Đặt giới hạn số lượng bản ghi trả về (LIMIT).
   * @param count Số lượng bản ghi tối đa.
   */
  public limit(count: number): this {
    if (count < 0) {
      throw new Error("LIMIT count không thể là số âm.");
    }
    this.limitCount = count;
    return this;
  }

  /**
   * Đặt số lượng bản ghi bỏ qua từ đầu kết quả (OFFSET).
   * @param count Số lượng bản ghi bỏ qua.
   */
  public offset(count: number): this {
    if (count < 0) {
      throw new Error("OFFSET count không thể là số âm.");
    }
    this.offsetCount = count;
    return this;
  }

  /**
   * Xây dựng câu lệnh SQL và các tham số dựa trên trạng thái hiện tại của QueryBuilder.
   * @returns Một object chứa chuỗi SQL và mảng các tham số.
   */
  build(): { sql: string; parameters: unknown[] } {
    return SqlGenerator.build({
      selectClauses: this.selectClauses,
      whereConditions: this.whereConditions,
      orderByClauses: this.orderByClauses,
      limitCount: this.limitCount,
      offsetCount: this.offsetCount,
      fromTable: this.fromTable,
      alias: this.alias,
      entityClassName: this.entityClassName,
      modelManager: this.modelManager, // Truyền modelManager vào SqlGenerator
    });
  }

  /**
   * Thực thi câu lệnh SELECT và trả về nhiều bản ghi.
   * @returns Promise chứa một mảng các đối tượng kết quả.
   */
  async getMany(): Promise<Partial<Entity>[]> {
    const { sql, parameters } = this.build();
    const result = await this.connectionManager.query<any>(sql, parameters); // Sử dụng <any> cho QueryResultRow

    if (this.entityClassName) {
      return result.rows.map((row) =>
        this.modelManager.fromDatabase<Entity>(this.entityClassName!, row)
      );
    } else {
      console.warn(
        "QueryBuilder.getMany: Không có entityClassName, không thể map kết quả. Trả về dữ liệu thô."
      );
      return result.rows as Partial<Entity>[]; // Trả về dữ liệu thô, ép kiểu thành Partial<Entity>[]
    }
  }

  /**
   * Thực thi câu lệnh SELECT và trả về một bản ghi duy nhất.
   * Sẽ tự động thêm LIMIT 1.
   * @returns Promise chứa một đối tượng kết quả hoặc undefined nếu không tìm thấy.
   */
  async getOne(): Promise<Partial<Entity> | undefined> {
    const originalLimit = this.limitCount;
    try {
      this.limitCount = 1; // Thêm LIMIT 1
      const { sql, parameters } = this.build();
      const result = await this.connectionManager.query<any>(sql, parameters);

      const row = result.rows[0];
      if (!row) {
        return undefined;
      }

      if (this.entityClassName) {
        return this.modelManager.fromDatabase<Entity>(
          this.entityClassName!,
          row
        );
      } else {
        console.warn(
          "QueryBuilder.getOne: Không có entityClassName, không thể map kết quả. Trả về dữ liệu thô."
        );
        return row as Partial<Entity>; // Trả về dữ liệu thô
      }
    } finally {
      this.limitCount = originalLimit; // Đảm bảo khôi phục limitCount ngay cả khi có lỗi
    }
  }

  /**
   * (Optional) Cung cấp cách lấy câu lệnh SQL và tham số mà không thực thi.
   * @returns Object chứa SQL và parameters.
   */
  getSqlAndParameters(): { sql: string; parameters: unknown[] } {
    return this.build();
  }
}
