import { Context } from 'elysia';
import { ApiAccessibilityEnum, HttpStatusCode, MessageCode, createErrorResponse } from '@repo/common';
import { AuthGrpcService } from '../services/auth-grpc.service';
import {
  findEndpointDetail,
  hasAccess,
  isAuthRequired
} from '../utils/api-definitions.util';

/**
 * Interface cho token metadata
 */
interface TokenValidationResult {
  isValid: boolean;
  userId: string;
  email: string;
  roles: string[];
  permissions: string[];
  error?: string;
}

/**
 * Trích xuất token từ header Authorization
 * @param authHeader Header Authorization
 * @returns Token hoặc null nếu không tìm thấy
 */
function extractToken(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // Bỏ 'Bearer ' ở đầu
}

/**
 * Middleware xác thực token và kiểm tra quyền truy cập
 * @param serviceName Tên service (auth, novel, ...)
 */
export function createAuthMiddleware(serviceName: 'auth' | 'novel') {
  const authService = AuthGrpcService.getInstance();

  return async ({ request, path, set }: Context<any>) => {
    // Xác định endpoint dựa trên path và method
    const urlPath = path.split('?')[0]; // Loại bỏ query string
    const endpoint = findEndpointDetail(serviceName, urlPath, request.method);

    if (!endpoint) {
      set.status = HttpStatusCode.NOT_FOUND;
      return createErrorResponse(
        'Endpoint not found',
        HttpStatusCode.NOT_FOUND,
        MessageCode.RESOURCE_NOT_FOUND
      );
    }

    // Nếu endpoint là PUBLIC, cho phép truy cập mà không cần xác thực
    if (endpoint.accessibility === ApiAccessibilityEnum.PUBLIC) {
      return;
    }

    // Lấy token từ header
    const authHeader = request.headers.get('authorization');
    const token = authHeader ? extractToken(authHeader) : undefined;

    // Nếu endpoint yêu cầu token nhưng không có token
    if (isAuthRequired(endpoint) && !token) {
      set.status = HttpStatusCode.UNAUTHORIZED;
      return createErrorResponse(
        'Authentication required',
        HttpStatusCode.UNAUTHORIZED,
        MessageCode.AUTH_INVALID_TOKEN
      );
    }

    // Nếu có token (bắt buộc hoặc tùy chọn), xác thực nó
    if (token) {
      try {
        const validationResult = await authService.validateToken(token);

        // Nếu token không hợp lệ
        if (!validationResult.isValid) {
          set.status = HttpStatusCode.UNAUTHORIZED;
          return createErrorResponse(
            validationResult.error || 'Invalid token',
            HttpStatusCode.UNAUTHORIZED,
            MessageCode.AUTH_INVALID_TOKEN
          );
        }

        // Chỉ truyền user ID vào header khi xác thực thành công
        request.headers.set('X-User-ID', validationResult.userId);

        // Kiểm tra quyền truy cập nếu endpoint yêu cầu xác thực
        if (isAuthRequired(endpoint) && 
            !hasAccess(endpoint, validationResult.roles, validationResult.permissions)) {
          set.status = HttpStatusCode.FORBIDDEN;
          return createErrorResponse(
            'Insufficient permissions',
            HttpStatusCode.FORBIDDEN,
            MessageCode.AUTH_FORBIDDEN
          );
        }
      } catch (error) {
        console.error('[Auth Middleware Error]:', error);
        set.status = HttpStatusCode.INTERNAL_SERVER_ERROR;
        return createErrorResponse(
          'Authentication service error',
          HttpStatusCode.INTERNAL_SERVER_ERROR,
          MessageCode.INTERNAL_SERVER_ERROR,
          error instanceof Error ? error.message : error
        );
      }
    }

    // Cho phép tiếp tục xử lý request
    return;
  };
}
