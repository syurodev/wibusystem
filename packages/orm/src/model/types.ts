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

/**
 * Represents a constructor of a class.
 */
export type Constructor<T = object> = new (...args: any[]) => T;

// Thêm các định nghĩa mới ở đây

// Tên của một model (thường là tên class)
export type ModelName = string;

// Tên của một cột trong model (thường là tên thuộc tính)
export type ColumnName<T> = keyof T & string;

// Lớp tĩnh của một model (constructor)
export type ModelStatic<T extends object> = new (...args: any[]) => T;

// Định nghĩa schema cho một model
export interface ModelSchema<T extends object> {
  tableName: string;
  columns: {
    // eslint-disable-next-line no-unused-vars
    [P in ColumnName<T>]: ColumnDefinition;
  };
  relations?: Record<string, RelationDefinition<any, any>>;
  description?: string;
  schema?: string; // Thường là 'public'
  indexes?: IndexDefinition[];
}

// Định nghĩa đầy đủ của một model, kết hợp schema và class
export interface ModelDefinition<T extends object> {
  name: ModelName;
  tableName: string;
  columns: {
    // eslint-disable-next-line no-unused-vars
    [P in ColumnName<T>]: ColumnDefinition;
  };
  relations: Record<string, RelationDefinition<any, any>>;
  modelClass: ModelStatic<T>;
}

// Định nghĩa một mối quan hệ
export interface RelationDefinition<
  TOrigin extends object,
  TTarget extends object,
> {
  type: "one-to-one" | "one-to-many" | "many-to-one" | "many-to-many";
  target: ModelStatic<TTarget> | (() => ModelStatic<TTarget>); // Target model class (có thể là lazy loaded)
  targetModelName?: ModelName; // Tên của target model, sẽ được resolve sau
  joinColumn?: string | { name: string; referencedColumnName: string }; // For one-to-one, many-to-one
  inverseSide?: keyof TTarget & string; // Tên thuộc tính ở phía đối diện của mối quan hệ
  // For one-to-many, inverseSide is the property on TTarget that maps back to TOrigin
  // For many-to-many
  joinTable?: {
    name: string;
    joinColumns?: { name: string; referencedColumnName: string }[];
    inverseJoinColumns?: { name: string; referencedColumnName: string }[];
  };
  cascade?: boolean | ("insert" | "update" | "remove")[];
  eager?: boolean; // Tải mối quan hệ này ngay khi query model gốc
  nullable?: boolean;
  description?: string;
}
