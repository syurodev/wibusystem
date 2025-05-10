// Ví dụ sử dụng ORM cơ bản
import { OrmFactory, QueryResult } from "../src";

async function main() {
  try {
    // Khởi tạo ORM với cấu hình kết nối
    const db = await OrmFactory.initialize({
      host: "localhost",
      port: 5432,
      user: "postgres",
      password: "your_password",
      database: "your_database",
      logging: true, // Bật logging để xem các truy vấn
    });

    console.log("ORM đã được khởi tạo thành công!");

    // Thực thi một truy vấn SQL đơn giản
    const result: QueryResult = await db.query("SELECT NOW() as current_time");
    console.log("Thời gian hiện tại từ database:", result.rows[0].current_time);

    // Thực thi truy vấn với tham số
    const userResult: QueryResult = await db.query(
      "SELECT * FROM users WHERE id = $1",
      [1]
    );

    if (userResult.rowCount > 0) {
      console.log("Thông tin người dùng:", userResult.rows[0]);
    } else {
      console.log("Không tìm thấy người dùng với id = 1");
    }

    // Đóng kết nối khi hoàn thành
    await OrmFactory.close();
    console.log("Đã đóng kết nối đến database");
  } catch (error) {
    console.error("Lỗi:", (error as Error).message);
  }
}

// Chạy hàm main
main().catch(console.error);
