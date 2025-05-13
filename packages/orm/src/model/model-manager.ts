import { convertFromMillis, convertToMillis } from "@repo/common";
import { ModelNotRegisteredError } from "../errors/model-errors";
import { toSnakeCase } from "../utils";
import { MODEL_REGISTRY, ModelMetadata, PostgresDataType } from "./types";

/**
 * Class quản lý các model trong ORM
 */
export class ModelManager {
  /**
   * Lấy metadata của một model theo tên class
   * @param className Tên class của model
   */
  public getModelMetadata(className: string): ModelMetadata | undefined {
    return MODEL_REGISTRY.get(className);
  }

  /**
   * Lấy tên bảng của một model
   * @param className Tên class của model
   */
  public getTableName(className: string): string | undefined {
    const metadata = this.getModelMetadata(className);
    return metadata?.tableName;
  }

  /**
   * Lấy tên cột trong database từ tên thuộc tính trong model
   * @param className Tên class của model
   * @param propertyName Tên thuộc tính trong model
   */
  public getColumnName(
    className: string,
    propertyName: string
  ): string | undefined {
    const metadata = this.getModelMetadata(className);
    if (!metadata) {
      return undefined;
    }

    const columnDef = metadata.columns[propertyName];
    if (!columnDef) {
      return undefined;
    }

    return columnDef.columnName ?? toSnakeCase(propertyName);
  }

  /**
   * Chuyển đổi một đối tượng model thành dữ liệu để lưu vào database
   * @param className Tên class của model
   * @param modelInstance Instance của model
   */
  public toDatabase<T extends Record<string, any>>(
    className: string,
    modelInstance: T
  ): Record<string, any> {
    const metadata = this.getModelMetadata(className);
    if (!metadata) {
      throw new ModelNotRegisteredError(className);
    }

    const result: Record<string, any> = {};

    // Chuyển đổi các thuộc tính của model thành dữ liệu cho database
    for (const [propertyName, columnDef] of Object.entries(metadata.columns)) {
      if (propertyName in modelInstance) {
        const value = modelInstance[propertyName];
        const columnName = columnDef.columnName ?? toSnakeCase(propertyName);

        // Chuyển đổi giá trị nếu cần
        result[columnName] = this.convertValueToDatabase(
          value,
          columnDef.type as PostgresDataType
        );
      }
    }

    return result;
  }

  /**
   * Chuyển đổi dữ liệu từ database thành một đối tượng model
   * @param className Tên class của model
   * @param dbData Dữ liệu từ database
   */
  public fromDatabase<T>(
    className: string,
    dbData: Record<string, any>
  ): Partial<T> {
    const metadata = this.getModelMetadata(className);
    if (!metadata) {
      throw new ModelNotRegisteredError(className);
    }

    const result: Record<string, any> = {};

    // Chuyển đổi dữ liệu từ database thành thuộc tính của model
    for (const [propertyName, columnDef] of Object.entries(metadata.columns)) {
      const columnName = columnDef.columnName ?? toSnakeCase(propertyName);

      if (columnName in dbData) {
        const value = dbData[columnName];

        // Chuyển đổi giá trị nếu cần
        result[propertyName] = this.convertValueFromDatabase(
          value,
          columnDef.type as PostgresDataType
        );
      }
    }

    return result as Partial<T>;
  }

  /**
   * Helper function to convert various date/time representations to a Unix timestamp (milliseconds).
   * @param value The value to convert (Date instance, number, or string).
   * @param dbType The target database type (for logging purposes).
   */
  private convertToTimestamp(
    value: unknown,
    dbType: PostgresDataType
  ): number | null {
    if (value instanceof Date) {
      return convertToMillis(value);
    }
    if (typeof value === "number") {
      return value; // Assume it's already a Unix timestamp in milliseconds
    }
    if (typeof value === "string") {
      try {
        const dateFromString = new Date(value);
        if (!isNaN(dateFromString.getTime())) {
          return convertToMillis(dateFromString);
        }
      } catch (e) {
        console.warn(
          `Lỗi khi parse chuỗi '${value}' thành Date cho kiểu DB '${dbType}':`,
          e instanceof Error ? e.message : String(e)
        );
      }
    }
    return null; // Return null if conversion is not possible
  }

  /**
   * Chuyển đổi giá trị từ JavaScript sang định dạng phù hợp cho PostgreSQL
   * @param value Giá trị cần chuyển đổi
   * @param type Kiểu dữ liệu PostgreSQL
   */
  private convertValueToDatabase(
    value: unknown,
    type: PostgresDataType
  ): unknown {
    if (value === undefined || value === null) {
      return null;
    }

    switch (type) {
      case PostgresDataType.BOOLEAN:
        return value ? 1 : 0;
      case PostgresDataType.DATE:
      case PostgresDataType.TIMESTAMP:
      case PostgresDataType.TIMESTAMPTZ: {
        const timestamp = this.convertToTimestamp(value, type);
        if (timestamp !== null) {
          return timestamp;
        }
        const displayValue =
          typeof value === "object" ? JSON.stringify(value) : String(value);
        console.warn(
          `Không thể chuyển đổi giá trị '${displayValue}' (kiểu: ${typeof value}) sang Unix timestamp cho kiểu DB '${type}'. Giữ nguyên giá trị.`
        );
        return value; // Return original value if conversion failed
      }
      case PostgresDataType.JSON:
      case PostgresDataType.JSONB:
        if (typeof value === "object" && value !== null) {
          return JSON.stringify(value);
        }
        // If value is already a string, assume it's pre-formatted JSON.
        // PostgreSQL will validate if it's a valid JSON string.
        return value;
      default:
        return value;
    }
  }

  // Helper methods for convertToDateObject to reduce complexity
  private _tryParseStringAsTimestamp(
    stringValue: string,
    dbType: PostgresDataType
  ): Date | null {
    try {
      const numValue = parseInt(stringValue, 10);
      if (!isNaN(numValue)) {
        const dateFromNumString = convertFromMillis(numValue);
        if (
          dateFromNumString instanceof Date &&
          !isNaN(dateFromNumString.getTime())
        ) {
          return dateFromNumString;
        }
      }
    } catch (e) {
      // This catch is for unexpected errors during parsing or conversion.
      // parseInt and convertFromMillis typically return NaN/null for invalid formats rather than throwing.
      console.warn(
        `Lỗi không mong muốn khi parse chuỗi số '${stringValue}' cho kiểu DB '${dbType}':`,
        e instanceof Error ? e.message : String(e)
      );
    }
    return null;
  }

  private _tryParseStringAsDateString(
    stringValue: string,
    dbType: PostgresDataType
  ): Date | null {
    try {
      const dateFromString = new Date(stringValue);
      if (!isNaN(dateFromString.getTime())) {
        return dateFromString;
      }
    } catch (e) {
      // This catch is for unexpected errors. new Date() typically returns an Invalid Date object.
      console.warn(
        `Lỗi không mong muốn khi parse chuỗi ngày '${stringValue}' trực tiếp cho kiểu DB '${dbType}':`,
        e instanceof Error ? e.message : String(e)
      );
    }
    return null;
  }

  /**
   * Helper function to convert a database value (number or string) to a Date object.
   * @param value The database value to convert.
   * @param dbType The source database type (for logging purposes).
   */
  private convertToDateObject(
    value: unknown,
    dbType: PostgresDataType
  ): Date | null {
    if (typeof value === "number") {
      const dateFromMillis = convertFromMillis(value);
      if (dateFromMillis instanceof Date && !isNaN(dateFromMillis.getTime())) {
        return dateFromMillis;
      }
      return null; // If conversion from number failed or resulted in invalid Date
    }

    if (typeof value === "string") {
      // Try parsing as a numeric timestamp string first
      const dateFromTimestampString = this._tryParseStringAsTimestamp(
        value,
        dbType
      );
      if (dateFromTimestampString) {
        return dateFromTimestampString;
      }

      // If that fails, try parsing as a general date string
      const dateFromDateString = this._tryParseStringAsDateString(
        value,
        dbType
      );
      if (dateFromDateString) {
        return dateFromDateString;
      }
    }
    return null; // If not a number or a parsable string, or if all parsing attempts failed
  }

  /**
   * Chuyển đổi giá trị từ PostgreSQL sang định dạng phù hợp cho JavaScript
   * @param value Giá trị cần chuyển đổi
   * @param type Kiểu dữ liệu PostgreSQL
   */
  private convertValueFromDatabase(
    value: unknown,
    type: PostgresDataType
  ): unknown {
    if (value === null || value === undefined) {
      return null;
    }

    switch (type) {
      case PostgresDataType.BOOLEAN:
        // More robust boolean conversion from various database representations
        if (typeof value === "boolean") return value;
        if (typeof value === "number") return value === 1;
        if (typeof value === "string") {
          const lowerValue = value.toLowerCase();
          return lowerValue === "true" || lowerValue === "1";
        }
        return false; // Default to false if type is uncertain but matched BOOLEAN
      case PostgresDataType.DATE:
      case PostgresDataType.TIMESTAMP:
      case PostgresDataType.TIMESTAMPTZ: {
        const dateObject = this.convertToDateObject(value, type);
        if (dateObject) {
          return dateObject;
        }
        const displayValue =
          typeof value === "object" && value !== null
            ? JSON.stringify(value)
            : String(value);
        console.warn(
          `Không thể chuyển đổi giá trị '${displayValue}' (kiểu: ${typeof value}) từ DB (kiểu DB: '${type}') sang Date object. Giữ nguyên giá trị.`
        );
        return value; // Return original value if conversion failed
      }
      case PostgresDataType.JSON:
      case PostgresDataType.JSONB:
        if (typeof value === "string") {
          try {
            return JSON.parse(value);
          } catch (error) {
            console.warn(
              `Không thể parse JSON: ${error instanceof Error ? error.message : String(error)}. Giữ nguyên giá trị.`
            );
            return value; // Return original value if parsing failed
          }
        }
        // If it's not a string (e.g., pg driver already parsed it to an object), return as is.
        return value;
      default:
        return value;
    }
  }
}
