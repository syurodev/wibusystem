import { ModelNotRegisteredError } from "../errors/model-errors";
import { toSnakeCase } from "../utils";
import { MODEL_REGISTRY, ModelMetadata } from "./types";

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
        result[columnName] = this.convertValueToDatabase(value, columnDef.type);
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
          columnDef.type
        );
      }
    }

    return result as Partial<T>;
  }

  /**
   * Chuyển đổi giá trị từ JavaScript sang định dạng phù hợp cho PostgreSQL
   * @param value Giá trị cần chuyển đổi
   * @param type Kiểu dữ liệu PostgreSQL
   */
  private convertValueToDatabase(value: any, type: string): any {
    if (value === undefined || value === null) {
      return null;
    }

    switch (type) {
      case "BOOLEAN":
        // Chuyển boolean thành 1 hoặc 0
        return value ? 1 : 0;
      case "DATE":
      case "TIMESTAMP":
      case "TIMESTAMPTZ":
        // Chuyển Date thành ISO string
        if (value instanceof Date) {
          return value.toISOString();
        }
        return value;
      case "JSON":
      case "JSONB":
        // Chuyển object thành JSON string
        if (typeof value === "object") {
          return JSON.stringify(value);
        }
        return value;
      default:
        return value;
    }
  }

  /**
   * Chuyển đổi giá trị từ PostgreSQL sang định dạng phù hợp cho JavaScript
   * @param value Giá trị cần chuyển đổi
   * @param type Kiểu dữ liệu PostgreSQL
   */
  private convertValueFromDatabase(value: any, type: string): any {
    if (value === null || value === undefined) {
      return null;
    }

    switch (type) {
      case "BOOLEAN":
        // Chuyển 1/0 thành boolean
        return (
          value === 1 || value === true || value === "1" || value === "true"
        );
      case "DATE":
      case "TIMESTAMP":
      case "TIMESTAMPTZ":
        // Chuyển ISO string thành Date
        if (typeof value === "string") {
          return new Date(value);
        }
        // Chuyển timestamp (số) thành Date
        if (typeof value === "number") {
          return new Date(value);
        }
        return value;
      case "JSON":
      case "JSONB":
        // Chuyển JSON string thành object
        if (typeof value === "string") {
          try {
            return JSON.parse(value);
          } catch (error) {
            // Nếu không thể parse JSON, ghi log và trả về giá trị gốc
            console.warn(`Không thể parse JSON: ${(error as Error).message}`);
            return value;
          }
        }
        return value;
      default:
        return value;
    }
  }
}
