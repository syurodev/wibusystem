import { Elysia } from 'elysia';
import { jwtPlugin } from '../../../plugins/jwt.plugin';
import { authRoutes } from './routes/auth.routes';
import { passwordRoutes } from './routes/password.routes';
import { tokenRoutes } from './routes/token.routes';

// Tạo một instance mới của Elysia với JWT plugin
const authApp = new Elysia()
  .use(jwtPlugin);

/**
 * Auth Plugin chính
 * Kết hợp tất cả các thành phần của auth module
 */
export const authPlugin = new Elysia({ 
  name: 'auth-plugin',
  prefix: '/api/v1/auth'
})
  .use(authApp) // Sử dụng JWT plugin
  .use(authRoutes) // Auth routes (đăng ký, đăng nhập)
  .use(passwordRoutes) // Password routes (quên mật khẩu, đặt lại mật khẩu)
  .use(tokenRoutes); // Token routes (refresh token, đăng xuất)
