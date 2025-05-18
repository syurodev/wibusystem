import { Elysia } from "elysia";
import { appConfig } from "./configs";
import { closeDbConnection, getDb } from "./database/connection";
import { errorMiddleware } from "./middlewares/error.middleware";
import { v1Routes } from "./modules/v1";
import { swaggerPlugin } from "./plugins/swagger.plugin";

// Khởi tạo kết nối database ngay khi khởi động app
getDb();

// Khởi tạo ứng dụng Elysia
const app = new Elysia()
  .use(errorMiddleware) // Cần đặt trước để bắt lỗi từ các routes
  .use(swaggerPlugin) // Cung cấp tài liệu Swagger
  .use(v1Routes) // Các routes API v1
  .get("/", () => "Auth Service is running") // Route kiểm tra service hoạt động
  .listen(appConfig.SERVICE_PORT);

console.log(
  `🦊 Auth Service is running at ${app.server?.hostname}:${app.server?.port}`
);

// Xử lý đóng kết nối database khi ứng dụng tắt
process.on("SIGINT", async () => {
  console.log("Shutting down server...");
  await closeDbConnection();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Shutting down server...");
  await closeDbConnection();
  process.exit(0);
});
