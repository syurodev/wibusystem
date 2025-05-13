/**
 * Các kiểu dữ liệu PostgreSQL được hỗ trợ
 */
export enum PostgresDataType {
  TEXT = "TEXT",
  VARCHAR = "VARCHAR",
  CHAR = "CHAR",
  INTEGER = "INTEGER",
  BIGINT = "BIGINT",
  SMALLINT = "SMALLINT",
  NUMERIC = "NUMERIC",
  REAL = "REAL",
  DOUBLE_PRECISION = "DOUBLE PRECISION",
  BOOLEAN = "BOOLEAN",
  TIMESTAMP = "TIMESTAMP",
  TIMESTAMPTZ = "TIMESTAMPTZ",
  DATE = "DATE",
  TIME = "TIME",
  TIMETZ = "TIMETZ",
  JSON = "JSON",
  JSONB = "JSONB",
  UUID = "UUID",
  ARRAY = "ARRAY",
  TSVECTOR = "TSVECTOR",
  TSQUERY = "TSQUERY",
}

/**
 * Định nghĩa một cột trong bảng
 */
export interface ColumnDefinition {
  /**
   * Kiểu dữ liệu PostgreSQL
   */
  type: PostgresDataType | string;

  /**
   * Độ dài cho các kiểu dữ liệu có độ dài (VARCHAR, CHAR, ...)
   */
  length?: number;

  /**
   * Cột có phải là primary key không
   * @default false
   */
  primaryKey?: boolean;

  /**
   * Cột có được phép NULL không
   * @default true
   */
  nullable?: boolean;

  /**
   * Giá trị mặc định cho cột
   */
  default?: any;

  /**
   * Cột có tự động tăng không (chỉ áp dụng cho số nguyên)
   * @default false
   */
  autoIncrement?: boolean;

  /**
   * Cột có phải là unique không
   * @default false
   */
  unique?: boolean;

  /**
   * Tên cột trong database (nếu khác với tên thuộc tính)
   * Nếu không được cung cấp, tên cột sẽ được tự động chuyển đổi từ camelCase sang snake_case
   */
  columnName?: string;

  /**
   * Mô tả về cột (sẽ được sử dụng trong migrations và documentation)
   */
  description?: string;

  /**
   * Các ràng buộc bổ sung cho cột
   */
  constraints?: string[];

  /**
   * Kiểu dữ liệu của các phần tử trong mảng (chỉ áp dụng khi type là ARRAY)
   */
  arrayType?: PostgresDataType | string;
}

/**
 * Định nghĩa một chỉ mục
 */
export interface IndexDefinition {
  /**
   * Tên chỉ mục
   */
  name: string;

  /**
   * Danh sách các cột trong chỉ mục
   */
  columns: string[];

  /**
   * Chỉ mục có phải là unique không
   * @default false
   */
  unique?: boolean;

  /**
   * Loại chỉ mục
   * @default 'BTREE'
   */
  type?: "BTREE" | "HASH" | "GIST" | "GIN" | "SPGIST" | "BRIN";
}

/**
 * Metadata cho một model
 */
export interface ModelMetadata {
  /**
   * Tên bảng trong database
   * Nếu không được cung cấp, tên bảng sẽ được tự động chuyển đổi từ tên class sang snake_case và số nhiều
   */
  tableName?: string;

  /**
   * Định nghĩa các cột
   */
  columns: Record<string, ColumnDefinition>;

  /**
   * Định nghĩa các chỉ mục
   */
  indexes?: IndexDefinition[];

  /**
   * Schema của bảng
   * @default 'public'
   */
  schema?: string;

  /**
   * Mô tả về bảng (sẽ được sử dụng trong migrations và documentation)
   */
  description?: string;
}

/**
 * Lưu trữ metadata của các model
 */
export const MODEL_REGISTRY = new Map<string, ModelMetadata>();
