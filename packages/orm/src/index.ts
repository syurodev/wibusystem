// Entry point for the @repo/orm package

// Core
export { OrmClient } from "./client";
export { OrmFactory } from "./orm-factory";

// Connection
export * from "./connection";

// Errors
export * from "./errors";

// Model
export * from "./model";

// QueryBuilder
export * from "./query-builder";

// Logger - Tạm thời comment out nếu gây lỗi
// export * from "./logger";

// Types - Tạm thời comment out nếu gây lỗi
// export * from "./types";

// Re-export các types cần thiết từ các module con và pg
export type { ConnectionConfig, ConnectionStatus } from "./connection/types";
export {
  ConnectionError,
  ModelError,
  ModelNotRegisteredError,
  OrmError,
  OrmErrorCode, // Đảm bảo OrmErrorCode được export
  PoolNotInitializedError,
  PropertyNotFoundError,
  QueryFailedError,
  ValueConversionError,
} from "./errors";

export {
  Column,
  Entity,
  ForeignKey,
  Index,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UniqueIndex,
} from "./model/decorators";
export { PostgresDataType } from "./model/types";
export type {
  ColumnDefinition,
  ForeignKeyDefinition,
  IndexDefinition,
  ModelMetadata,
} from "./model/types";

export { BaseEntity } from "./model/base-entity";

// Export các hàm tiện ích từ model-manager (nếu cần thiết ở mức cao nhất)
// export { getColumnName, getTableName } from "./model/model-manager";

// Export type QueryResult từ pg
export type { QueryResult, QueryResultRow } from "pg";
