import { convertFromMillis, convertToMillis } from "@repo/common";
import { OrmError, OrmErrorCode } from "../errors";
import { Logger } from "../logger";
import type {
  ColumnDefinition,
  ColumnName,
  ModelDefinition,
  ModelName,
  ModelSchema,
  ModelStatic,
} from "./types";
import { PostgresDataType } from "./types";

/**
 * Class quản lý các model trong ORM
 */
export class ModelManager {
  private static instance: ModelManager;
  private readonly models: Map<ModelName, ModelStatic<any>> = new Map();
  private readonly schemas: Map<ModelName, ModelSchema<any>> = new Map();
  private readonly logger: Logger = Logger.getInstance();

  private constructor() {}

  public static getInstance(): ModelManager {
    if (!ModelManager.instance) {
      ModelManager.instance = new ModelManager();
    }
    return ModelManager.instance;
  }

  public registerModel<T extends object>(
    modelClass: ModelStatic<T>,
    schema: ModelSchema<T>
  ): void {
    const modelName = modelClass.name as ModelName;
    if (this.models.has(modelName)) {
      this.logger.warn(`Model ${modelName} đã được đăng ký. Ghi đè...`);
    }
    this.models.set(modelName, modelClass);
    this.schemas.set(modelName, schema);
    this.logger.log(`Model ${modelName} đã được đăng ký với schema.`);
  }

  public getModel<T extends object>(
    modelName: ModelName
  ): ModelStatic<T> | undefined {
    return this.models.get(modelName) as ModelStatic<T> | undefined;
  }

  public getSchema<T extends object>(
    modelName: ModelName
  ): ModelSchema<T> | undefined {
    return this.schemas.get(modelName);
  }

  private convertToTimestamp(
    value: unknown,
    columnName: ColumnName<any>,
    modelName: ModelName
  ): number | null | undefined {
    if (value === null || value === undefined) {
      return value;
    }
    if (value instanceof Date) {
      return convertToMillis(value);
    }
    if (typeof value === "number") {
      return value; // Giả sử đã là timestamp
    }
    this.logger.warn(
      `Không thể chuyển đổi giá trị '${String(value)}' của cột '${String(
        columnName
      )}' trong model '${modelName}' sang timestamp.`
    );
    throw new OrmError(
      `Giá trị không hợp lệ cho cột timestamp: ${String(columnName)}`,
      OrmErrorCode.TYPE_CONVERSION_ERROR
    );
  }

  private convertToDateObject(
    value: unknown,
    columnName: ColumnName<any>,
    modelName: ModelName
  ): Date | null | undefined {
    if (value === null || value === undefined) {
      return value;
    }
    if (typeof value === "number") {
      return convertFromMillis(value);
    }
    if (value instanceof Date) {
      return value; // Đã là đối tượng Date
    }
    this.logger.warn(
      `Không thể chuyển đổi giá trị '${String(value)}' của cột '${String(
        columnName
      )}' trong model '${modelName}' sang Date.`
    );
    throw new OrmError(
      `Giá trị không hợp lệ cho cột Date: ${String(columnName)}`,
      OrmErrorCode.TYPE_CONVERSION_ERROR
    );
  }

  public convertToDatabaseFormat<T extends object>(
    entity: Partial<T>,
    modelName: ModelName
  ): Record<string, any> {
    const schema = this.getSchema<T>(modelName);
    if (!schema) {
      this.logger.error(`Không tìm thấy schema cho model ${modelName}`);
      throw new OrmError(
        `Schema không tồn tại cho model: ${modelName}`,
        OrmErrorCode.MODEL_NOT_REGISTERED
      );
    }

    const dbObject: Record<string, any> = {};
    for (const key in entity) {
      if (Object.prototype.hasOwnProperty.call(entity, key)) {
        const columnName = key as ColumnName<T>;
        const columnDef = schema.columns[columnName];
        const value = entity[columnName];

        if (!columnDef) {
          this.logger.warn(
            `[convertToDatabaseFormat] Không tìm thấy định nghĩa cột cho '${String(
              columnName
            )}' trong model '${modelName}'. Bỏ qua cột này.`
          );
          continue;
        }

        try {
          if (
            (columnDef.type === PostgresDataType.TIMESTAMP ||
              columnDef.type === PostgresDataType.TIMESTAMPTZ) &&
            value !== undefined &&
            value !== null
          ) {
            dbObject[columnDef.columnName ?? (columnName as string)] =
              this.convertToTimestamp(value, columnName, modelName);
          } else if (
            columnDef.type === PostgresDataType.DATE &&
            value !== undefined &&
            value !== null
          ) {
            if (value instanceof Date) {
              dbObject[columnDef.columnName ?? (columnName as string)] = value;
            } else if (typeof value === "number") {
              this.logger.warn(
                `Cột '${String(
                  columnName
                )}' (${modelName}) có kiểu DATE nhưng nhận giá trị số (timestamp). Điều này có thể không được hỗ trợ bởi driver.`
              );
              dbObject[columnDef.columnName ?? (columnName as string)] =
                this.convertToDateObject(value, columnName, modelName);
            } else {
              dbObject[columnDef.columnName ?? (columnName as string)] = value;
            }
          } else {
            dbObject[columnDef.columnName ?? (columnName as string)] = value;
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          this.logger.error(
            `Lỗi khi chuyển đổi giá trị cho cột '${String(
              columnName
            )}' của model '${modelName}' sang định dạng database: ${errorMessage}`
          );
          this.logger.error(`Nguyên nhân gốc: ${String(error)}`);
          throw new OrmError(
            `Lỗi chuyển đổi dữ liệu cho cột ${String(
              columnName
            )} trong model ${modelName}`,
            OrmErrorCode.DATA_TRANSFORMATION_ERROR
          );
        }
      }
    }
    return dbObject;
  }

  public convertFromDatabaseFormat<T extends object>(
    dbRow: Record<string, any>,
    modelName: ModelName
  ): T {
    const schema = this.getSchema<T>(modelName);
    const ModelClass = this.getModel<T>(modelName);

    if (!schema || !ModelClass) {
      this.logger.error(
        `Không tìm thấy schema hoặc class cho model ${modelName}`
      );
      throw new OrmError(
        `Schema hoặc ModelClass không tồn tại cho model: ${modelName}`,
        OrmErrorCode.MODEL_NOT_REGISTERED
      );
    }

    const entity = new ModelClass() as T & { [key: string]: any };

    for (const modelPropertyKey in schema.columns) {
      if (
        Object.prototype.hasOwnProperty.call(schema.columns, modelPropertyKey)
      ) {
        const modelProperty = modelPropertyKey as ColumnName<T>;
        const columnDef = schema.columns[modelProperty] as ColumnDefinition;
        const dbColumnName = columnDef.columnName ?? (modelProperty as string);
        let value = dbRow[dbColumnName];

        try {
          if (value !== undefined && value !== null) {
            if (
              columnDef.type === PostgresDataType.TIMESTAMP ||
              columnDef.type === PostgresDataType.TIMESTAMPTZ
            ) {
              entity[modelProperty] = this.convertToTimestamp(
                value,
                modelProperty,
                modelName
              );
            } else if (columnDef.type === PostgresDataType.DATE) {
              entity[modelProperty] = this.convertToDateObject(
                value,
                modelProperty,
                modelName
              );
            } else if (
              columnDef.type === PostgresDataType.JSON ||
              columnDef.type === PostgresDataType.JSONB
            ) {
              entity[modelProperty] = value;
            } else if (
              (columnDef.type === PostgresDataType.INTEGER ||
                columnDef.type === PostgresDataType.BIGINT ||
                columnDef.type === PostgresDataType.SMALLINT) &&
              typeof value === "string"
            ) {
              entity[modelProperty] = parseInt(value, 10);
            } else if (
              columnDef.type === PostgresDataType.REAL ||
              columnDef.type === PostgresDataType.DOUBLE_PRECISION ||
              columnDef.type === PostgresDataType.NUMERIC
            ) {
              if (typeof value === "string") {
                entity[modelProperty] = parseFloat(value);
              } else {
                entity[modelProperty] = value;
              }
            } else {
              entity[modelProperty] = value;
            }
          } else if (columnDef.default !== undefined) {
            entity[modelProperty] =
              typeof columnDef.default === "function"
                ? columnDef.default()
                : columnDef.default;
          } else if (columnDef.nullable) {
            entity[modelProperty] = null;
          } else {
            this.logger.warn(
              `Cột '${String(
                modelProperty
              )}' (${modelName}) không nullable, không có giá trị default, và không có giá trị từ DB.`
            );
            entity[modelProperty] = undefined;
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          this.logger.error(
            `Lỗi khi chuyển đổi giá trị cho cột '${String(
              modelProperty
            )}' của model '${modelName}' từ định dạng database: ${errorMessage}`
          );
          this.logger.error(`Nguyên nhân gốc: ${String(error)}`);
          throw new OrmError(
            `Lỗi chuyển đổi dữ liệu từ DB cho cột ${String(
              modelProperty
            )} trong model ${modelName}`,
            OrmErrorCode.DATA_TRANSFORMATION_ERROR
          );
        }
      }
    }
    return entity as T;
  }

  public getTableName<T extends object>(modelName: ModelName): string {
    const schema = this.getSchema<T>(modelName);
    if (!schema) {
      this.logger.error(
        `[getTableName] Không tìm thấy schema cho model ${modelName}`
      );
      throw new OrmError(
        `Schema không tồn tại cho model: ${modelName}`,
        OrmErrorCode.MODEL_NOT_REGISTERED
      );
    }
    return schema.tableName;
  }

  public getColumnName<T extends object>(
    modelName: ModelName,
    modelProperty: ColumnName<T>
  ): string {
    const schema = this.getSchema<T>(modelName);
    if (!schema) {
      this.logger.error(
        `[getColumnName] Không tìm thấy schema cho model ${modelName}`
      );
      throw new OrmError(
        `Schema không tồn tại cho model: ${modelName}`,
        OrmErrorCode.MODEL_NOT_REGISTERED
      );
    }
    const columnDef = schema.columns[modelProperty];
    if (!columnDef) {
      this.logger.error(
        `[getColumnName] Không tìm thấy định nghĩa cho thuộc tính ${String(
          modelProperty
        )} trong model ${modelName}`
      );
      throw new OrmError(
        `Thuộc tính không tồn tại: ${String(
          modelProperty
        )} trong model ${modelName}`,
        OrmErrorCode.MODEL_PROPERTY_NOT_FOUND_ERROR
      );
    }
    return columnDef.columnName ?? (modelProperty as string);
  }

  public getModelDefinition<T extends object>(
    modelName: ModelName
  ): ModelDefinition<T> {
    const modelClass = this.getModel<T>(modelName);
    const schema = this.getSchema<T>(modelName);

    if (!modelClass || !schema) {
      this.logger.error(
        `[getModelDefinition] Không tìm thấy model hoặc schema cho ${modelName}`
      );
      throw new OrmError(
        `Model hoặc schema không tồn tại: ${modelName}`,
        OrmErrorCode.MODEL_NOT_REGISTERED
      );
    }

    return {
      name: modelName,
      tableName: schema.tableName,
      columns: schema.columns,
      relations: schema.relations || {},
      modelClass,
    };
  }

  public getAllModelDefinitions(): ModelDefinition<any>[] {
    const definitions: ModelDefinition<any>[] = [];
    for (const modelName of this.models.keys()) {
      try {
        definitions.push(this.getModelDefinition(modelName));
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `Bỏ qua model '${modelName}' khi lấy tất cả định nghĩa do lỗi: ${errorMessage}`
        );
        this.logger.warn(
          `Nguyên nhân gốc khi getAllModelDefinitions: ${String(error)}`
        );
      }
    }
    return definitions;
  }
}
