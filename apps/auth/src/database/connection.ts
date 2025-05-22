import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { dbUserConfig } from "../configs"; // Import cấu hình DB
import * as schema from "./schema"; // Import tất cả các schema từ ./schema/index.ts

// Kiểm tra xem các biến môi trường cần thiết đã được cung cấp chưa
if (
  !dbUserConfig.host ||
  !dbUserConfig.port ||
  !dbUserConfig.username ||
  !dbUserConfig.password ||
  !dbUserConfig.dbname
) {
  console.error("Missing database configuration in environment variables.");
  // Trong môi trường production, bạn có thể muốn throw error hoặc xử lý nghiêm ngặt hơn
  // For now, we'll log an error and potentially let the app fail later if db connection is critical at startup
  // throw new Error('Missing database configuration.');
}

const connectionString = `postgresql://${dbUserConfig.username}:${dbUserConfig.password}@${dbUserConfig.host}:${dbUserConfig.port}/${dbUserConfig.dbname}`;

const pool = new Pool({
  connectionString,
  // Bạn có thể thêm các cấu hình khác cho Pool ở đây nếu cần
  // ví dụ: max clients, idle timeout, etc.
  // ssl: {
  //   rejectUnauthorized: false, // Cần thiết nếu kết nối tới DB yêu cầu SSL và không có CA hợp lệ
  // },
});

// drizzle() nhận vào một client và một object tùy chọn có schema
export const db = drizzle(pool, {
  schema,
  logger: process.env.NODE_ENV === "development",
}); // Bật logger khi ở môi trường dev

// Helper function để thực hiện transaction
export const transaction = async <T>(
  callback: (tx: any) => Promise<T>
): Promise<T> => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const tx = drizzle(client, { schema });
    const result = await callback(tx);

    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// Kiểm tra kết nối (tùy chọn, nhưng hữu ích)
// (async () => {
//   try {
//     await pool.query('SELECT NOW()');
//     console.log('Database connected successfully');
//   } catch (error) {
//     console.error('Failed to connect to the database:', error);
//   }
// })();

// Bạn cũng có thể export pool nếu cần truy cập trực tiếp vào nó ở đâu đó
export { pool };
