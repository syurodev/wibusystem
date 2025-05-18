import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { dbUserConfig } from "../configs";
import * as schema from "../database/schema";

// Tạo connection string từ config.db.user
// Lưu ý: PostgresqlConfig interface trong @repo/config có password là optional.
// Cần đảm bảo password được cung cấp nếu database yêu cầu.
const connectionString = `postgres://${dbUserConfig.username}:${dbUserConfig.password}@${dbUserConfig.host}:${dbUserConfig.port}/${dbUserConfig.dbname}`;

if (
  !dbUserConfig.host ||
  !dbUserConfig.port ||
  !dbUserConfig.username ||
  !dbUserConfig.dbname
) {
  console.error(
    "Database connection parameters (host, port, username, dbname) are missing in @repo/config for db.user."
  );
  throw new Error("Database connection parameters are incomplete.");
}
// Không cần kiểm tra connectionString nữa vì nó được tạo từ các thành phần đã được kiểm tra (ít nhất là sự tồn tại)

let dbInstance: ReturnType<typeof drizzle> | null = null;
let pgClient: postgres.Sql | null = null;

/**
 * Khởi tạo và trả về một instance của Drizzle ORM.
 * Sử dụng singleton pattern để đảm bảo chỉ có một kết nối được tạo.
 */
export function getDb() {
  if (!dbInstance) {
    try {
      pgClient = postgres(connectionString, { max: 10 });
      dbInstance = drizzle(pgClient, { schema });
      console.log("Database connection established successfully.");
    } catch (error) {
      console.error("Failed to connect to database:", error);
      throw error;
    }
  }
  return dbInstance;
}

/**
 * Đóng kết nối cơ sở dữ liệu.
 * Quan trọng: gọi hàm này khi ứng dụng tắt để giải phóng tài nguyên.
 */
export async function closeDbConnection() {
  if (pgClient) {
    await pgClient.end();
    dbInstance = null;
    pgClient = null;
    console.log("Database connection closed.");
  }
}

// Có thể thêm các xử lý sự kiện cho kết nối ở đây nếu cần
// Ví dụ: pgClient.on('error', ...)

// Gọi getDb() một lần để khởi tạo kết nối khi module này được import lần đầu (tùy chọn)
// getDb();

// Lưu ý quan trọng về quản lý kết nối trong môi trường serverless:
// Trong môi trường serverless (ví dụ: AWS Lambda), việc giữ kết nối mở giữa các lời gọi hàm
// có thể không hiệu quả. Cân nhắc chiến lược kết nối/ngắt kết nối phù hợp.
// Tuy nhiên, với ElysiaJS thường chạy như một server liên tục, việc giữ kết nối là phổ biến.
