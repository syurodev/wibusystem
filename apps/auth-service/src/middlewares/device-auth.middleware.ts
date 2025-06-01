import { Elysia } from "elysia";
import db from "../database/database.provider";
import { DeviceTokenRepository } from "../database/repositories/device-token.repository";
import { DeviceAuthService } from "../services/device-auth.service";

// Initialize services
const deviceTokenRepo = new DeviceTokenRepository(db);
const deviceAuthService = new DeviceAuthService(deviceTokenRepo);

/**
 * Middleware xác thực device token cho anonymous users
 * Sử dụng cho các API cần bảo mật cơ bản nhưng không yêu cầu đăng nhập
 */
export const deviceAuthMiddleware = (
  options: {
    required?: boolean; // Bắt buộc phải có device token
    permissions?: string[]; // Permissions cần thiết
  } = {}
) => {
  return new Elysia().derive(async ({ headers, set }) => {
    const authHeader = headers.authorization;
    const deviceToken = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : authHeader;

    // Nếu không bắt buộc và không có token, cho phép tiếp tục
    if (!options.required && !deviceToken) {
      return {
        deviceAuth: null,
        isAnonymous: true,
      };
    }

    // Nếu bắt buộc nhưng không có token
    if (options.required && !deviceToken) {
      set.status = 401;
      throw new Error("Device token là bắt buộc");
    }

    // Validate token nếu có
    if (deviceToken) {
      try {
        const deviceInfo =
          await deviceAuthService.validateDeviceToken(deviceToken);

        if (!deviceInfo) {
          set.status = 401;
          throw new Error("Device token không hợp lệ hoặc đã hết hạn");
        }

        // Kiểm tra permissions nếu có yêu cầu
        if (options.permissions && options.permissions.length > 0) {
          const devicePermissions = deviceInfo.permissions as string[];
          const hasRequiredPermissions = options.permissions.every(
            (permission) => devicePermissions.includes(permission)
          );

          if (!hasRequiredPermissions) {
            set.status = 403;
            throw new Error("Thiết bị không có quyền truy cập");
          }
        }

        return {
          deviceAuth: {
            device_id: deviceInfo.device_id,
            permissions: deviceInfo.permissions,
            device_info: {
              name: deviceInfo.device_name,
              type: deviceInfo.device_type,
              os: deviceInfo.device_os,
              browser: deviceInfo.device_browser,
            },
            risk_score: deviceInfo.risk_score,
            created_at: deviceInfo.created_at,
          },
          isAnonymous: true,
        };
      } catch (error) {
        set.status = 401;
        throw new Error("Lỗi xác thực device token");
      }
    }

    return {
      deviceAuth: null,
      isAnonymous: true,
    };
  });
};

/**
 * Middleware để require device authentication
 */
export const requireDeviceAuth = (permissions?: string[]) => {
  return deviceAuthMiddleware({
    required: true,
    permissions,
  });
};

/**
 * Middleware cho optional device authentication
 */
export const optionalDeviceAuth = () => {
  return deviceAuthMiddleware({
    required: false,
  });
};

/**
 * Example usage trong các service khác:
 *
 * import { requireDeviceAuth, optionalDeviceAuth } from "./auth-service/middlewares/device-auth.middleware";
 *
 * // API yêu cầu device token
 * app.use(requireDeviceAuth(["read:public_content"]))
 *   .get("/protected-content", ({ deviceAuth }) => {
 *     return {
 *       message: "Protected content",
 *       device: deviceAuth?.device_id
 *     };
 *   });
 *
 * // API không bắt buộc device token
 * app.use(optionalDeviceAuth())
 *   .get("/public-content", ({ deviceAuth, isAnonymous }) => {
 *     return {
 *       message: "Public content",
 *       tracked: isAnonymous && deviceAuth ? true : false
 *     };
 *   });
 */
