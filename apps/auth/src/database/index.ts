import { PostgresConnectionManager } from "@repo/database";
import { PG_CONFIG } from "../configs";
import { UserRepository } from "./repositories/user.repository";

// Khởi tạo PostgreSQL connection
const postgresManager = new PostgresConnectionManager({
  host: PG_CONFIG.CONFIG_POSTGRESQL_USER_HOST!,
  port: Number(PG_CONFIG.CONFIG_POSTGRESQL_USER_PORT!),
  database: PG_CONFIG.CONFIG_POSTGRESQL_USER_DBNAME!,
  username: PG_CONFIG.CONFIG_POSTGRESQL_USER_USERNAME!,
  password: PG_CONFIG.CONFIG_POSTGRESQL_USER_PASSWORD!,
  max: 20,
  connection_timeout: 10000,
  ssl: false,
});

// Export SQL instance để sử dụng trong repositories
export const sql = postgresManager.sql;

// Export PostgreSQL manager
export { postgresManager };

// Khởi tạo repositories với SQL connection
export const userRepository = new UserRepository(sql);

// Test connection function
export async function testDatabaseConnection(): Promise<boolean> {
  return await postgresManager.testConnection();
}

// Graceful shutdown function
export async function closeDatabaseConnection(): Promise<void> {
  await postgresManager.close();
}
