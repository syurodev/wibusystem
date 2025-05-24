import { Elysia } from 'elysia';

/**
 * Interface cho thông tin người dùng được lấy từ header
 */
export interface UserContext {
  userId?: string;
  sessionId?: string;
  deviceId?: string;
  isAuthenticated: boolean;
}

/**
 * Type mở rộng Context của Elysia để thêm thông tin user
 */
declare global {
  namespace Elysia {
    interface Context {
      user: UserContext;
    }
  }
}

/**
 * Plugin để lấy thông tin user từ header do gateway gửi xuống
 * @returns Plugin Elysia
 */
export function userContextPlugin() {
  return new Elysia()
    .derive((context) => {
      // Lấy thông tin từ các header
      const userId = context.request.headers.get('X-User-ID');
      const sessionId = context.request.headers.get('X-Session-ID');
      const deviceId = context.request.headers.get('X-Device-ID');
      
      // Thêm thông tin user vào context
      return {
        user: {
          userId: userId || undefined,
          sessionId: sessionId || undefined,
          deviceId: deviceId || undefined,
          isAuthenticated: !!userId
        }
      };
    });
}

/**
 * Middleware xác thực yêu cầu user đã đăng nhập
 * Sử dụng khi endpoint cần xác thực
 */
export function requireAuth({ set, user }: any) {
  if (!user.isAuthenticated) {
    set.status = 401;
    return {
      is_success: false,
      status_code: 401,
      message: 'Unauthorized',
      error: {
        code: 2000, // MessageCode.AUTH_UNAUTHORIZED
        details: 'Authentication required'
      }
    };
  }
}

/**
 * Hook kiểm tra user đã đăng nhập, nếu không thì trả về lỗi
 * @example
 * app.get('/protected-route', 
 *   { beforeHandle: [requireAuthentication] }, 
 *   ({ user }) => `Hello, User ${user.userId}`
 * );
 */
export const requireAuthentication = ({ set, user }: any) => {
  if (!user.isAuthenticated) {
    set.status = 401;
    return {
      is_success: false,
      status_code: 401,
      message: 'Unauthorized',
      error: {
        code: 2000, // MessageCode.AUTH_UNAUTHORIZED
        details: 'Authentication required'
      }
    };
  }
};
