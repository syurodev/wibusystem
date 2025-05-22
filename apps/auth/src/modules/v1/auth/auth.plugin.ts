import { Elysia } from "elysia";
import { jwtPlugin } from "../../../plugins/jwt.plugin";
import { authRoutes } from "./routes/auth.route";

// Tạo một instance mới của Elysia với JWT plugin
const authApp = new Elysia().use(jwtPlugin);

/**
 * Auth Plugin chính
 * Kết hợp tất cả các thành phần của auth module
 */
export const authPlugin = new Elysia({
  name: "auth-plugin",
  prefix: "/auth",
})
  .use(authApp) // Sử dụng JWT plugin
  .use(authRoutes); // Auth routes (đăng ký, đăng nhập)
