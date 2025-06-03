import { logger } from "@repo/elysia-common";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/bun-sql";
import { APP_CONFIG, USER_POSTGRES_CONFIG } from "../configs/env";
import { databaseSchema } from "./schemas";

// Database connection với Bun SQL
const connectionString = `postgres://${USER_POSTGRES_CONFIG.CONFIG_POSTGRESQL_USER_USERNAME}:${USER_POSTGRES_CONFIG.CONFIG_POSTGRESQL_USER_PASSWORD}@${USER_POSTGRES_CONFIG.CONFIG_POSTGRESQL_USER_HOST}:${USER_POSTGRES_CONFIG.CONFIG_POSTGRESQL_USER_PORT}/${USER_POSTGRES_CONFIG.CONFIG_POSTGRESQL_USER_DBNAME}`;

console.info("🔄 Đang khởi tạo kết nối database...");
console.info(
  `📍 Database Host: ${USER_POSTGRES_CONFIG.CONFIG_POSTGRESQL_USER_HOST}:${USER_POSTGRES_CONFIG.CONFIG_POSTGRESQL_USER_PORT}`
);
console.info(
  `🗄️ Database Name: ${USER_POSTGRES_CONFIG.CONFIG_POSTGRESQL_USER_DBNAME}`
);
console.info(
  `👤 Database User: ${USER_POSTGRES_CONFIG.CONFIG_POSTGRESQL_USER_USERNAME}`
);

const connection = drizzle(connectionString, {
  schema: databaseSchema,
  logger: APP_CONFIG.NODE_ENV === "development",
});

// Test database connection
async function testDatabaseConnection() {
  try {
    logger.debug("🔍 Đang test kết nối database...");

    // Test query đơn giản
    const result = await connection.execute(
      sql`SELECT 1 as test, NOW() as current_time, version() as postgres_version`
    );

    if (result && result.length > 0) {
      const { _, current_time, postgres_version } = result[0] as any;

      logger.debug("✅ Kết nối database thành công!");
      logger.debug(`🕒 Server Time: ${current_time}`);
      logger.debug(`🐘 PostgreSQL Version: ${postgres_version.split(" ")[0]}`);
      logger.debug("🚀 Drizzle ORM đã sẵn sàng với Bun SQL driver");

      return true;
    }

    return false;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error as any);
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error("❌ Kết nối database thất bại!");
    logger.error(`🚨 Chi tiết lỗi: ${errorMessage}`);

    // Log thêm thông tin debug trong development
    if (APP_CONFIG.NODE_ENV === "development") {
      console.error(
        "🔧 Connection String (masked):",
        connectionString.replace(/:[^:@]*@/, ":****@")
      );
      if (errorStack) {
        console.error("📋 Error Stack:", errorStack);
      }
    }

    throw error;
  }
}

// Gọi test connection khi khởi tạo
testDatabaseConnection().catch((error) => {
  console.error("💀 Không thể kết nối database. Ứng dụng sẽ không hoạt động!");
  process.exit(1);
});

export type Database = typeof connection;
export type DbTransactionAdapter = typeof connection;
export default connection;
