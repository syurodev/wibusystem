import * as _grpc from "@grpc/grpc-js"; // Vẫn cần cho ServerUnaryCall và sendUnaryData
import { ValidateTokenRequest, ValidateTokenResponse } from "@repo/elysia-grpc";
import { verifyAccessToken } from "../plugins/jwt.plugin";
import { PermissionRepository } from "../repositories/permission.repository";
import { SessionRepository } from "../repositories/session.repository";
import { UserDeviceRepository } from "../repositories/user-device.repository";
import { UserRolesRepository } from "../repositories/user-roles.repository";
import { UserRepository } from "../repositories/user.repository";
import { getRedisClient } from "../utils/redis.util";

// Interface cho payload sau khi giải mã JWT
interface JwtPayload {
  sub?: string; // userId được lưu trong trường sub theo chuẩn JWT
  userId?: string; // Dự phòng nếu sử dụng userId thay vì sub
  email: string;
  session_id?: string;
  display_name?: string;
  account_status?: number;
  // Các trường khác nếu có
}

// Thời gian cache trong Redis (giây)
const ROLES_CACHE_DURATION = 3600; // 1 giờ
const PERMISSIONS_CACHE_DURATION = 3600; // 1 giờ

/**
 * Triển khai gRPC service handlers cho AuthService
 * Cung cấp các phương thức để xác thực token và lấy thông tin người dùng
 * từ token thông qua gRPC protocol
 */
export const authServiceHandlers = {
  /**
   * Xác thực token và trả về thông tin người dùng
   * @param call gRPC call chứa request với token cần xác thực
   * @param callback Callback function để trả về kết quả
   */
  ValidateToken: async (
    call: _grpc.ServerUnaryCall<ValidateTokenRequest, ValidateTokenResponse>,
    callback: _grpc.sendUnaryData<ValidateTokenResponse>
  ) => {
    const token = call.request.token;
    if (!token) {
      // Trả về đúng định dạng ValidateTokenResponse khi token không được cung cấp
      return callback(null, {
        userId: "",
        email: "",
        isValid: false,
        error: "Token is required",
        roles: [],
        permissions: [],
        sessionId: "",
        deviceId: "",
      });
    }

    try {
      const decoded = verifyAccessToken(token);

      if (!decoded) {
        // Trả về đúng định dạng ValidateTokenResponse khi token không hợp lệ
        return callback(null, {
          userId: "",
          email: "",
          isValid: false,
          error: "Invalid token: verification failed",
          roles: [],
          permissions: [],
          sessionId: "",
          deviceId: "",
        });
      }

      console.log("JWT Payload:", decoded); // Log để debug

      const payload = decoded as JwtPayload;
      // Lấy userId từ trường sub (JWT standard) hoặc userId nếu có
      const userId = payload.sub ?? payload.userId ?? "";
      const sessionId = payload.session_id ?? "";

      if (!userId) {
        // Trả về đúng định dạng ValidateTokenResponse khi thiếu userId
        return callback(null, {
          userId: "",
          email: "",
          isValid: false,
          error: "Invalid token: missing userId or sub field",
          roles: [],
          permissions: [],
          sessionId: "",
          deviceId: "",
        });
      }

      // Lấy redis client
      const redisClient = getRedisClient();

      // Tìm thông tin user trong Redis trước
      const userKey = `auth:user:${userId}`;
      let user;
      let email = "";

      // Kiểm tra session trong Redis
      const sessionKey = sessionId ? `auth:session:${sessionId}` : null;
      let session = null;
      let deviceId = "";

      // Lấy device ID từ request nếu có
      const requestDeviceId = call.request.device_id || "";

      // Tìm roles và permissions trong Redis
      const userRolesKey = `auth:user:${userId}:roles`;
      let roleNames: string[] = [];
      let permissionNames: string[] = [];

      try {
        // Sử dụng các lệnh riêng biệt thay vì multi để tránh vấn đề kiểu dữ liệu
        const [userCache, sessionCache, rolesCache] = await Promise.all([
          redisClient.get(userKey),
          sessionKey ? redisClient.get(sessionKey) : null,
          redisClient.get(userRolesKey),
        ]);

        // Xử lý thông tin user từ cache
        if (userCache) {
          const userData = JSON.parse(userCache);
          email = userData.email;
          user = userData; // Lưu lại để sử dụng nếu cần
        }

        // Xử lý thông tin session từ cache
        if (sessionCache) {
          session = JSON.parse(sessionCache);
          deviceId = session.device_id?.toString() ?? "";

          // Kiểm tra nếu có device ID trong request và không khớp với device ID trong session
          if (requestDeviceId && deviceId && requestDeviceId !== deviceId) {
            console.warn(
              `Token reuse detected! Session device: ${deviceId}, Request device: ${requestDeviceId}`
            );

            // Trả về lỗi xác thực
            return callback(null, {
              userId: "",
              email: "",
              isValid: false,
              error: "Token is being used on a different device",
              roles: [],
              permissions: [],
              sessionId: "",
              deviceId: "",
            });
          }
        }

        // Xử lý thông tin roles từ cache
        if (rolesCache) {
          roleNames = JSON.parse(rolesCache);

          // Lấy permissions cho các roles từ cache
          if (roleNames.length > 0) {
            const permissionsPromises = roleNames.map((roleName) =>
              redisClient.get(`auth:role:${roleName}:permissions`)
            );

            const permissionResults = await Promise.all(permissionsPromises);

            // Gộp tất cả permissions từ các roles
            permissionNames = permissionResults.reduce(
              (allPermissions, currentResult) => {
                if (currentResult) {
                  const permissions = JSON.parse(currentResult);
                  return [...allPermissions, ...permissions];
                }
                return allPermissions;
              },
              [] as string[]
            );

            // Loại bỏ các permissions trùng lặp
            permissionNames = [...new Set(permissionNames)];
          }
        }
      } catch (redisError) {
        console.error("Redis error during token validation:", redisError);
        // Tiếp tục xử lý với database nếu Redis fail
      }

      // Nếu không tìm thấy dữ liệu trong Redis, truy vấn từ database
      if (!email || roleNames.length === 0) {
        // Khởi tạo các repository để lấy thông tin từ database
        const userRepo = UserRepository.getInstance();
        const sessionRepo = SessionRepository.getInstance();
        const userDeviceRepo = UserDeviceRepository.getInstance();
        const userRolesRepo = UserRolesRepository.getInstance();
        const permissionRepo = PermissionRepository.getInstance();

        // Nếu chưa có thông tin user, lấy từ database
        if (!email) {
          const userFromDb = await userRepo.findById(Number(userId));

          if (!userFromDb) {
            // Trả về đúng định dạng ValidateTokenResponse khi không tìm thấy user
            return callback(null, {
              userId: userId,
              email: "",
              isValid: false,
              error: "User not found",
              roles: [],
              permissions: [],
              sessionId: "",
              deviceId: "",
            });
          }

          email = userFromDb.email;

          // Cache thông tin user vào Redis
          const userData = {
            id: userFromDb.id,
            email: userFromDb.email,
            display_name: userFromDb.displayName ?? "",
            account_status: userFromDb.accountStatus,
          };

          await redisClient.set(userKey, JSON.stringify(userData));
          await redisClient.expire(userKey, 3600); // 1 giờ
        }

        // Nếu chưa có thông tin session và có sessionId, lấy từ database
        if (!session && sessionId) {
          const sessionFromDb = await sessionRepo.findSessionById(sessionId);

          if (sessionFromDb) {
            // Lấy thiết bị từ session
            const userDevice = await userDeviceRepo.findById(
              sessionFromDb.userDeviceId
            );
            deviceId = userDevice?.id?.toString() ?? "";

            // Cache thông tin session vào Redis
            const sessionData = {
              user_id: sessionFromDb.userId,
              device_id: sessionFromDb.userDeviceId,
              refresh_token_hash: sessionFromDb.hashedRefreshToken,
              is_active: sessionFromDb.isActive,
              expires_at: sessionFromDb.expiresAt,
            };

            await redisClient.set(
              sessionKey as string,
              JSON.stringify(sessionData)
            );
            await redisClient.expireAt(
              sessionKey as string,
              Math.floor(sessionFromDb.expiresAt / 1000)
            );
          }
        }

        // Nếu chưa có thông tin roles, lấy từ database
        if (roleNames.length === 0) {
          const userRoles = await userRolesRepo.findRolesByUserId(
            Number(userId)
          );
          roleNames = userRoles.map((role) => role.name);

          // Cache roles vào Redis
          if (roleNames.length > 0) {
            await redisClient.set(userRolesKey, JSON.stringify(roleNames));
            await redisClient.expire(userRolesKey, ROLES_CACHE_DURATION);

            // Lấy permissions từ các role và cache
            const userPermissions =
              await permissionRepo.findPermissionsByRoles(roleNames);
            permissionNames = userPermissions.map(
              (permission) => permission.name
            );

            // Cache permissions cho từng role
            for (const roleName of roleNames) {
              // Lấy permissions cho role cụ thể
              const rolePermissions =
                await permissionRepo.findPermissionsByRoles([roleName]);
              const rolePermissionNames = rolePermissions.map(
                (permission) => permission.name
              );

              // Cache vào Redis
              await redisClient.set(
                `auth:role:${roleName}:permissions`,
                JSON.stringify(rolePermissionNames)
              );
              await redisClient.expire(
                `auth:role:${roleName}:permissions`,
                PERMISSIONS_CACHE_DURATION
              );
            }
          }
        }
      }

      // Trả về đúng định dạng ValidateTokenResponse khi thành công
      callback(null, {
        userId: userId,
        email: email,
        isValid: true,
        error: "", // Không có lỗi
        roles: roleNames,
        permissions: permissionNames,
        sessionId: sessionId,
        deviceId: deviceId,
      });
    } catch (err: any) {
      console.error("[gRPC ValidateToken Error]:", err);
      // Trả về đúng định dạng ValidateTokenResponse khi có lỗi
      callback(null, {
        userId: "",
        email: "",
        isValid: false,
        error: err.message ?? "Invalid token",
        roles: [],
        permissions: [],
        sessionId: "",
        deviceId: "",
      });
    }
  },
};
