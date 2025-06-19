// PostgreSQL Connection
export { PostgresConnectionManager } from "./postgres/connection";
export type { PostgresConfig } from "./postgres/connection";

// Base Models and Types
export {
  SQL,
  now,
  withBaseFields,
  withUpdateFields,
} from "./shared/base-model";
export type { BaseModel, CreateModel, UpdateModel } from "./shared/base-model";

// Base Repository
export { BaseRepository } from "./shared/base-repository";
export type {
  PaginationResult,
  QueryOptions,
  WhereCondition,
} from "./shared/base-repository";

// MongoDB Connection (placeholder for future)
// export { MongoConnectionManager } from './mongodb/connection';

// Utility functions
export async function createDatabaseConnection(
  config: import("./postgres/connection.js").PostgresConfig
) {
  const { PostgresConnectionManager } = await import(
    "./postgres/connection.js"
  );
  return new PostgresConnectionManager(config);
}
