import { drizzle } from "drizzle-orm/postgres-js";
import { reset } from "drizzle-seed";
import postgres from "postgres";

import { dbUserConfig } from "../configs";
import * as schema from "./schema/index";

async function main() {
  console.log("Starting database reset...");

  // Kiểm tra cấu hình DB
  if (
    !dbUserConfig.host ||
    !dbUserConfig.port ||
    !dbUserConfig.username ||
    !dbUserConfig.dbname
  ) {
    console.error(
      "Database connection parameters (host, port, username, dbname) are missing."
    );
    throw new Error("Database connection parameters are incomplete for reset.");
  }

  // Không sử dụng getDb() ở đây để tránh cache connection cũ nếu có
  // Tạo một client mới cho việc reset
  const resetConnectionString = `postgres://${dbUserConfig.username}:${dbUserConfig.password}@${dbUserConfig.host}:${dbUserConfig.port}/${dbUserConfig.dbname}`;
  const pgClient = postgres(resetConnectionString, { max: 1 });
  const db = drizzle(pgClient, { schema });

  try {
    await reset(db, schema);
    console.log("Database has been successfully reset.");
  } catch (error) {
    console.error("Error resetting database:", error);
    throw error; // Ném lỗi ra ngoài để script báo lỗi nếu thất bại
  } finally {
    await pgClient.end(); // Đảm bảo client này được đóng
    console.log("Database connection for reset script closed.");
  }
}

main().catch((e) => {
  console.error("Unhandled error during database reset:", e);
  process.exit(1);
});
