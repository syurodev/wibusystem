import { toPluralSnakeCase, toSnakeCase } from "../utils";
import {
  ColumnDefinition,
  ForeignKeyDefinition,
  IndexDefinition,
  MODEL_REGISTRY,
  ModelMetadata,
  PostgresDataType,
} from "./types";

/**
 * Decorator để đánh dấu một class là một Entity (Model)
 * @param options Tùy chọn cho entity
 */
export function Entity(
  options: Partial<Omit<ModelMetadata, "columns">> = {}
): any {
  return function (target: Function | any): any {
    const className = target.name;

    // Tạo tên bảng mặc định nếu không được cung cấp
    const tableName = options.tableName ?? toPluralSnakeCase(className);

    // Khởi tạo metadata cho model nếu chưa tồn tại
    if (!MODEL_REGISTRY.has(className)) {
      MODEL_REGISTRY.set(className, {
        tableName,
        columns: {},
        foreignKeys: [],
        indexes: [],
        schema: options.schema ?? "public",
        description: options.description,
      });
    } else {
      // Cập nhật metadata nếu đã tồn tại
      const metadata = MODEL_REGISTRY.get(className)!;
      metadata.tableName = tableName;
      metadata.schema = options.schema ?? metadata.schema ?? "public";
      metadata.description = options.description ?? metadata.description;

      if (options.foreignKeys) {
        metadata.foreignKeys = options.foreignKeys;
      }

      if (options.indexes) {
        metadata.indexes = options.indexes;
      }
    }

    // Trả về target để tương thích với cả decorator cũ và mới
    return target;
  };
}

/**
 * Decorator để đánh dấu một thuộc tính là một cột trong bảng
 * @param options Tùy chọn cho cột
 */
export function Column(options: Partial<ColumnDefinition> = {}): any {
  return function (target: any, propertyKey: string | symbol): any {
    // Hỗ trợ cả decorator cũ và mới
    const className =
      typeof target === "function" ? target.name : target.constructor.name;

    // Chuyển đổi propertyKey thành string nếu nó là symbol
    const propKey = propertyKey.toString();

    // Khởi tạo metadata cho model nếu chưa tồn tại
    if (!MODEL_REGISTRY.has(className)) {
      MODEL_REGISTRY.set(className, {
        columns: {},
        foreignKeys: [],
        indexes: [],
        schema: "public",
      });
    }

    const metadata = MODEL_REGISTRY.get(className)!;

    // Xác định kiểu dữ liệu từ reflection nếu không được cung cấp
    // Lưu ý: Reflection API không hoạt động tốt với TypeScript, nên chúng ta cần cung cấp type
    const type = options.type ?? PostgresDataType.TEXT;

    // Tạo tên cột mặc định nếu không được cung cấp
    const columnName = options.columnName ?? toSnakeCase(propKey);

    // Thêm định nghĩa cột vào metadata
    metadata.columns[propKey] = {
      type,
      primaryKey: options.primaryKey ?? false,
      nullable: options.nullable ?? true,
      default: options.default,
      autoIncrement: options.autoIncrement ?? false,
      unique: options.unique ?? false,
      columnName,
      description: options.description,
      constraints: options.constraints,
      length: options.length,
      arrayType: options.arrayType,
    };
  };
}

/**
 * Decorator để đánh dấu một thuộc tính là primary key
 * @param options Tùy chọn cho primary key
 */
export function PrimaryColumn(
  options: Partial<Omit<ColumnDefinition, "primaryKey">> = {}
): any {
  return Column({
    ...options,
    primaryKey: true,
    nullable: false,
  });
}

/**
 * Decorator để đánh dấu một thuộc tính là primary key tự động tăng
 * @param options Tùy chọn cho primary key
 */
export function PrimaryGeneratedColumn(
  options: Partial<Omit<ColumnDefinition, "primaryKey" | "autoIncrement">> = {}
): any {
  return Column({
    ...options,
    type: options.type ?? PostgresDataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    nullable: false,
  });
}

/**
 * Decorator để đánh dấu một thuộc tính là foreign key
 * @param options Tùy chọn cho foreign key
 */
export function ForeignKey(
  options: Omit<ForeignKeyDefinition, "columnName">
): any {
  return function (target: any, propertyKey: string | symbol): any {
    // Hỗ trợ cả decorator cũ và mới
    const className =
      typeof target === "function" ? target.name : target.constructor.name;

    // Chuyển đổi propertyKey thành string nếu nó là symbol
    const propKey = propertyKey.toString();

    // Khởi tạo metadata cho model nếu chưa tồn tại
    if (!MODEL_REGISTRY.has(className)) {
      MODEL_REGISTRY.set(className, {
        columns: {},
        foreignKeys: [],
        indexes: [],
        schema: "public",
      });
    }

    const metadata = MODEL_REGISTRY.get(className)!;

    // Tạo tên cột mặc định nếu không được cung cấp
    const columnName = toSnakeCase(propKey);

    // Thêm định nghĩa foreign key vào metadata
    metadata.foreignKeys ??= [];

    metadata.foreignKeys.push({
      columnName,
      referencedTable: options.referencedTable,
      referencedColumn: options.referencedColumn ?? "id",
      onDelete: options.onDelete ?? "NO ACTION",
      onUpdate: options.onUpdate ?? "NO ACTION",
    });
  };
}

/**
 * Decorator để đánh dấu một thuộc tính là một phần của chỉ mục
 * @param options Tùy chọn cho chỉ mục
 */
export function Index(
  options: Partial<Omit<IndexDefinition, "columns">> = {}
): any {
  return function (target: any, propertyKey: string | symbol): any {
    // Hỗ trợ cả decorator cũ và mới
    const className =
      typeof target === "function" ? target.name : target.constructor.name;

    // Chuyển đổi propertyKey thành string nếu nó là symbol
    const propKey = propertyKey.toString();

    // Khởi tạo metadata cho model nếu chưa tồn tại
    if (!MODEL_REGISTRY.has(className)) {
      MODEL_REGISTRY.set(className, {
        columns: {},
        foreignKeys: [],
        indexes: [],
        schema: "public",
      });
    }

    const metadata = MODEL_REGISTRY.get(className)!;

    // Tạo tên cột mặc định
    const columnName = toSnakeCase(propKey);

    // Tạo tên chỉ mục mặc định nếu không được cung cấp
    const indexName =
      options.name ??
      `idx_${metadata.tableName ?? toPluralSnakeCase(className)}_${columnName}`;

    // Thêm định nghĩa chỉ mục vào metadata
    metadata.indexes ??= [];

    // Kiểm tra xem chỉ mục đã tồn tại chưa
    const existingIndex = metadata.indexes.find(
      (idx) => idx.name === indexName
    );

    if (existingIndex) {
      // Nếu chỉ mục đã tồn tại, thêm cột vào chỉ mục
      if (!existingIndex.columns.includes(columnName)) {
        existingIndex.columns.push(columnName);
      }
    } else {
      // Nếu chỉ mục chưa tồn tại, tạo mới
      metadata.indexes.push({
        name: indexName,
        columns: [columnName],
        unique: options.unique ?? false,
        type: options.type ?? "BTREE",
      });
    }
  };
}

/**
 * Decorator để đánh dấu một thuộc tính là một phần của chỉ mục unique
 * @param options Tùy chọn cho chỉ mục unique
 */
export function UniqueIndex(
  options: Partial<Omit<IndexDefinition, "columns" | "unique">> = {}
): any {
  return Index({
    ...options,
    unique: true,
  });
}
