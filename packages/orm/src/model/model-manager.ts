import {
  convertFromMillis as commonConvertFromMillis,
  convertToMillis,
} from "@repo/common"; // Simpler import
import { ModelNotRegisteredError } from "../errors";
import { LoggerService } from "../logger/logger.interface";
import { toCamelCase, toSnakeCase } from "../utils/naming-strategy"; // Đã có toCamelCase
import type { ColumnDefinition, Constructor, ModelMetadata } from "./types";
import { MODEL_REGISTRY, PostgresDataType } from "./types";

/**
 * Class quản lý các model trong ORM
 */
export class ModelManager {
  public static loggerService?: LoggerService;

  public static setLogger(logger: LoggerService): void {
    ModelManager.loggerService = logger;
  }

  /**
   * Lấy metadata của một model theo tên class
   * @param className Tên class của model
   */
  public static getModelMetadata<T>(modelClass: Constructor<T>): ModelMetadata {
    const metadata = MODEL_REGISTRY.get(modelClass.name); // Use modelClass.name as key
    if (!metadata) {
      throw new ModelNotRegisteredError(modelClass.name);
    }
    return metadata;
  }

  /**
   * Lấy tên bảng của một model
   * @param className Tên class của model
   */
  public static getTableName(modelClass: Constructor<unknown>): string {
    const metadata = ModelManager.getModelMetadata(modelClass);
    return metadata.tableName ?? toSnakeCase(modelClass.name) + "s"; // Add fallback for tableName
  }

  /**
   * Lấy tên cột trong database từ tên thuộc tính trong model
   * @param className Tên class của model
   * @param propertyName Tên thuộc tính trong model
   */
  public static getColumnName(
    propertyName: string,
    modelClass?: Constructor<unknown>
  ): string {
    if (modelClass) {
      try {
        const modelMeta = ModelManager.getModelMetadata(modelClass);
        const columnDef = modelMeta.columns[propertyName]; // Direct access using propertyName

        if (columnDef?.columnName) {
          return columnDef.columnName;
        }
        // If columnDef exists (i.e., propertyName is a decorated field)
        // but columnName is not explicitly set, decorator convention applies (snake_case of propertyName).
        // The decorators should ensure columnDef.name is set if @Column is used.
        // Here, we prefer explicit columnName from metadata if present, else convention.
        if (columnDef) {
          // The decorator should have already set a default snake_case name if not provided.
          // This path means property is in metadata. Use its name or fall back.
          // However, ColumnDefinition interface does not have 'name', it has 'columnName'.
          // The decorator sets 'columnName' to snake_case(propertyName) if not specified.
          // So, if columnDef exists, columnDef.columnName should be the one to use if not undefined.
          // If columnDef.columnName is somehow undefined here but columnDef exists,
          // it means decorator didn't set it, which is unlikely for @Column.
          // For safety, or if a property could be in `columns` without a `columnName` (not typical for this setup):
          return columnDef.columnName ?? toSnakeCase(propertyName);
        }
      } catch (error) {
        if (!(error instanceof ModelNotRegisteredError)) {
          ModelManager.loggerService?.warn(
            `Error retrieving column metadata for ${modelClass.name}.${propertyName}: ${error instanceof Error ? error.message : String(error)}`
          );
        }
        // Fall through to snake_case if model not registered or other metadata error for that property
      }
    }
    return toSnakeCase(propertyName); // Fallback for no modelClass or if propertyName not in metadata
  }

  /**
   * Chuyển đổi một đối tượng model thành dữ liệu để lưu vào database
   * @param className Tên class của model
   * @param modelInstance Instance của model
   */
  public static toDatabase(
    data: Record<string, unknown>,
    modelClass?: Constructor<unknown>
  ): Record<string, unknown> {
    if (!modelClass) {
      const dbData: Record<string, unknown> = {};
      for (const key of Object.keys(data)) {
        dbData[toSnakeCase(key)] = data[key];
      }
      return dbData;
    }

    const modelMeta = ModelManager.getModelMetadata(modelClass);
    const dbData: Record<string, unknown> = {};

    for (const propertyName in modelMeta.columns) {
      if (
        Object.prototype.hasOwnProperty.call(modelMeta.columns, propertyName)
      ) {
        if (Object.prototype.hasOwnProperty.call(data, propertyName)) {
          const columnDef = modelMeta.columns[propertyName];
          if (columnDef) {
            const valueToConvert = data[propertyName];
            const dbColumnKey =
              columnDef.columnName ?? toSnakeCase(propertyName);
            dbData[dbColumnKey] = ModelManager.convertValueToDatabase(
              valueToConvert,
              columnDef,
              propertyName
            );
          } else {
            ModelManager.loggerService?.warn(
              `Skipping property ${propertyName} in toDatabase: ColumnDefinition not found unexpectedly.`
            );
          }
        }
      }
    }
    return dbData;
  }

  /**
   * Chuyển đổi dữ liệu từ database thành một đối tượng model
   * @param className Tên class của model
   * @param dbData Dữ liệu từ database
   */
  public static fromDatabase(
    data: Record<string, unknown>,
    modelClass?: Constructor<unknown>
  ): Record<string, unknown> {
    if (!modelClass) {
      const result: Record<string, unknown> = {};
      for (const key of Object.keys(data)) {
        result[toCamelCase(key)] = data[key];
      }
      return result;
    }

    const modelMeta = ModelManager.getModelMetadata(modelClass);
    const result: Record<string, unknown> = {};

    for (const propertyName in modelMeta.columns) {
      if (
        Object.prototype.hasOwnProperty.call(modelMeta.columns, propertyName)
      ) {
        const columnDef = modelMeta.columns[propertyName];
        if (columnDef) {
          const dbColumnKey = columnDef.columnName ?? toSnakeCase(propertyName);
          if (Object.prototype.hasOwnProperty.call(data, dbColumnKey)) {
            result[propertyName] = ModelManager.convertValueFromDatabase(
              data[dbColumnKey],
              columnDef,
              propertyName
            );
          }
        } else {
          ModelManager.loggerService?.warn(
            `Skipping property ${propertyName} in fromDatabase: ColumnDefinition not found unexpectedly.`
          );
        }
      }
    }
    return result;
  }

  /**
   * Helper function to convert various date/time representations to a Unix timestamp (milliseconds).
   * @param value The value to convert (Date instance, number, or string).
   * @param dbType The target database type (for logging purposes).
   */
  private static convertToTimestamp(
    value: unknown,
    columnType: PostgresDataType
  ): number | unknown {
    if (value instanceof Date) {
      ModelManager.loggerService?.debug(
        `Converting Date to timestamp for type ${columnType}: ${value.toISOString()}`
      );
      return convertToMillis(value);
    }
    // If it's already a number, assume it's a pre-converted timestamp.
    // This ORM's convention is to store dates as numeric timestamps.
    if (typeof value === "number") {
      ModelManager.loggerService?.debug(
        `Value is already a number (timestamp) for type ${columnType}: ${value}`
      );
      return value;
    }
    ModelManager.loggerService?.warn(
      `Value for date/timestamp column type ${columnType} is not a Date or number, returning as is: ${String(value)}`
    );
    return value; // Return as is if not a Date or number
  }

  /**
   * Helper function to convert a database value (number or string) to a Date object.
   * @param value The database value to convert.
   * @param dbType The source database type (for logging purposes).
   */
  private static convertToDateObject(
    value: unknown,
    columnType: PostgresDataType
  ): Date | unknown {
    if (typeof value === "number") {
      ModelManager.loggerService?.debug(
        `Converting numeric timestamp to Date for type ${columnType}: ${value}`
      );
      return commonConvertFromMillis(value);
    }
    if (value instanceof Date) {
      ModelManager.loggerService?.debug(
        `Value is already a Date object for type ${columnType}: ${value.toISOString()}`
      );
      return value; // Already a Date object
    }
    // PostgreSQL date/timestamp types might return strings from the driver if not automatically parsed.
    // Attempt to parse if it's a string that looks like a date or timestamp.
    if (typeof value === "string") {
      const parsedDate = new Date(value);
      if (!isNaN(parsedDate.getTime())) {
        ModelManager.loggerService?.debug(
          `Parsed string to Date for type ${columnType}: ${value} -> ${parsedDate.toISOString()}`
        );
        return parsedDate;
      }
    }
    ModelManager.loggerService?.warn(
      `Value for DB date/timestamp column type ${columnType} is not a number (timestamp) or Date object, returning as is: ${String(value)}`
    );
    return value; // Return as is if not a number or Date
  }

  /**
   * Chuyển đổi giá trị từ JavaScript sang định dạng phù hợp cho PostgreSQL
   * @param value Giá trị cần chuyển đổi
   * @param type Kiểu dữ liệu PostgreSQL
   */
  private static convertValueToDatabase(
    value: unknown,
    columnDef: ColumnDefinition,
    propertyName?: string // Added for logging
  ): unknown {
    if (value === undefined || value === null) {
      return null; // Represent undefined or null as SQL NULL
    }

    switch (columnDef.type) {
      case PostgresDataType.DATE:
      case PostgresDataType.TIMESTAMP:
      case PostgresDataType.TIMESTAMPTZ:
        return ModelManager.convertToTimestamp(value, columnDef.type);
      case PostgresDataType.JSON:
      case PostgresDataType.JSONB:
        if (typeof value === "object" || Array.isArray(value)) {
          try {
            return JSON.stringify(value);
          } catch (error) {
            ModelManager.loggerService?.error(
              `Failed to stringify JSON/JSONB for property '${propertyName ?? "(unknown)"}' (column: ${columnDef.columnName ?? "auto"}): ${error instanceof Error ? error.message : String(error)}`
            );
            return String(value); // Fallback to string representation
          }
        }
        // If it's already a string, assume it's pre-stringified or a primitive that can be stored directly.
        return value;
      // Potentially add more type-specific conversions here (e.g., boolean, numeric types if needed)
      // For now, other types are returned as-is, relying on driver compatibility.
      default:
        return value;
    }
  }

  /**
   * Chuyển đổi giá trị từ PostgreSQL sang định dạng phù hợp cho JavaScript
   * @param value Giá trị cần chuyển đổi
   * @param type Kiểu dữ liệu PostgreSQL
   */
  private static convertValueFromDatabase(
    value: unknown,
    columnDef: ColumnDefinition,
    propertyName?: string // Added for logging
  ): unknown {
    if (value === null || value === undefined) {
      return undefined; // Represent SQL NULL as undefined on the entity
    }

    switch (columnDef.type) {
      case PostgresDataType.DATE:
      case PostgresDataType.TIMESTAMP:
      case PostgresDataType.TIMESTAMPTZ:
        return ModelManager.convertToDateObject(value, columnDef.type);
      case PostgresDataType.JSON:
      case PostgresDataType.JSONB:
        if (typeof value === "string") {
          try {
            return JSON.parse(value);
          } catch (error) {
            ModelManager.loggerService?.error(
              `Failed to parse JSON/JSONB for property '${propertyName ?? "(unknown)"}' (column: ${columnDef.columnName ?? "auto"}): ${error instanceof Error ? error.message : String(error)}`
            );
            return value; // Return original string if parsing fails
          }
        }
        // If it's not a string (e.g., already an object if driver auto-parses), return as is.
        return value;
      case PostgresDataType.INTEGER:
      case PostgresDataType.BIGINT:
      case PostgresDataType.SMALLINT:
        if (typeof value === "string") {
          const num = Number(value);
          return isNaN(num) ? value : num; // Return original string if not a valid number
        }
        return value; // If already a number or other type, return as is.
      case PostgresDataType.NUMERIC:
      case PostgresDataType.REAL:
      case PostgresDataType.DOUBLE_PRECISION:
        if (typeof value === "string") {
          const num = parseFloat(value);
          return isNaN(num) ? value : num; // Return original string if not a valid number
        }
        return value;
      case PostgresDataType.BOOLEAN:
        if (typeof value === "string") {
          if (value.toLowerCase() === "true") return true;
          if (value.toLowerCase() === "false") return false;
        }
        // Rely on driver to return boolean, or handle common string representations.
        // For 't'/'f' from some DBs or other specific string bools, more checks can be added.
        return Boolean(value); // General conversion attempt
      default:
        return value;
    }
  }
}
