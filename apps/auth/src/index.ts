import { Elysia } from "elysia";
import { appConfig } from "./configs";
import { appRoutes } from "./modules";
import { jwtPlugin } from "./plugins/jwt.plugin"; // Import JWT plugin
import { swaggerPlugin } from "./plugins/swagger.plugin";
import { handleAppError } from "./utils/error-formatter.util"; // Import hàm mới

// Khởi tạo ứng dụng Elysia
const app = new Elysia()
  .onError((context) => {
    // Sử dụng context đầy đủ
    return handleAppError(context);
  })
  .use(swaggerPlugin)
  .use(jwtPlugin) // Thêm JWT plugin vào main app
  .use(appRoutes)
  .get("/", () => "Auth Service is running") // Route kiểm tra service hoạt động
  .listen(appConfig.SERVICE_PORT);

console.log(
  `🦊 Auth Service is running at ${app.server?.hostname}:${app.server?.port}`
);
