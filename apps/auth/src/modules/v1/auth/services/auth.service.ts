import {
  addDays,
  BOOLEAN,
  convertToMillis,
  DeviceType,
  HttpStatusCode,
  MessageCode,
  now,
  Role,
  UserStatus,
} from "@repo/common";
import { UserDeviceRepository } from "@repositories/user-device.repository";
import { UserRepository } from "@repositories/user.repository";
import { CustomError } from "src/common/errors/custom.error";
import * as UAParser from "ua-parser-js"; // Use namespace import
import { v4 as uuidv4 } from "uuid"; // Để tạo session_id
import { jwtConfig } from "../../../../configs"; // Import jwtConfig để lấy expiration
import { transaction } from "../../../../database/connection"; // Import transaction helper
import { User } from "../../../../database/schema";
import { NewSessionSchema } from "../../../../database/schema/sessions.schema"; // Import NewSessionSchema
import { NewUserDevice } from "../../../../database/schema/user-devices.schema";
import {
  signAccessToken,
  signRefreshToken,
} from "../../../../plugins/jwt.plugin"; // Import các JWT sign functions
import { PermissionRepository } from "../../../../repositories/permission.repository";
import { RoleRepository } from "../../../../repositories/role.repository";
import { SessionRepository } from "../../../../repositories/session.repository"; // Import SessionRepository
import { UserRolesRepository } from "../../../../repositories/user-roles.repository";
import { comparePassword, hashPassword } from "../../../../utils/password.util";
import { getRedisClient } from "../../../../utils/redis.util"; // Import Redis client
import { UserLoginDtoType, UserRegisterDtoType } from "../dtos";

export class AuthService {
  // Helper function to map UA parser result to DeviceType enum
  private mapUAParsedToDeviceType(parsedUA: UAParser.IResult): DeviceType {
    // Use namespaced IResult
    const deviceType = parsedUA.device.type?.toLowerCase();
    const browserName = parsedUA.browser.name;

    if (deviceType === "mobile") return DeviceType.MOBILE;
    if (deviceType === "tablet") return DeviceType.TABLET;

    if (browserName) return DeviceType.WEB_BROWSER;

    if (deviceType === "desktop" || !deviceType) return DeviceType.DESKTOP;

    return DeviceType.UNKNOWN;
  }

  private static instance: AuthService;
  private readonly userRepo: UserRepository;
  private readonly sessionRepo: SessionRepository; // Thêm SessionRepository
  private readonly userDeviceRepo: UserDeviceRepository;

  private constructor() {
    this.userRepo = UserRepository.getInstance();
    this.sessionRepo = new SessionRepository(); // Khởi tạo SessionRepository
    this.userDeviceRepo = UserDeviceRepository.getInstance();
  }

  /**
   * Lấy instance của AuthService (Singleton pattern)
   * @returns Instance của AuthService
   */
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Xác thực thông tin đăng nhập của người dùng
   * @param email Email người dùng
   * @param password Mật khẩu người dùng (chưa hash)
   * @returns Thông tin người dùng nếu xác thực thành công
   * @throws CustomError nếu xác thực thất bại
   */
  private async validateUserCredentials(
    email: string,
    password: string
  ): Promise<User> {
    // Kiểm tra email tồn tại
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new CustomError(
        "Invalid email or password",
        HttpStatusCode.UNAUTHORIZED,
        MessageCode.AUTH_INVALID_CREDENTIALS
      );
    }

    // Kiểm tra mật khẩu
    const isPasswordValid = await comparePassword(
      password,
      user.hashedPassword
    );
    if (!isPasswordValid) {
      throw new CustomError(
        "Invalid email or password",
        HttpStatusCode.UNAUTHORIZED,
        MessageCode.AUTH_INVALID_CREDENTIALS
      );
    }

    // Kiểm tra trạng thái tài khoản
    if (user.accountStatus !== UserStatus.ACTIVE) {
      throw new CustomError(
        "User account is not active",
        HttpStatusCode.FORBIDDEN,
        MessageCode.AUTH_FORBIDDEN
      );
    }

    return user;
  }

  /**
   * Xử lý thông tin thiết bị người dùng (tạo mới hoặc cập nhật)
   * @param userId ID người dùng
   * @param deviceFingerprint Mã định danh thiết bị
   * @param userAgent Chuỗi User-Agent của trình duyệt/thiết bị
   * @param ipAddress Địa chỉ IP của người dùng
   * @param tx Transaction để thực hiện trong
   * @returns Thông tin thiết bị đã cập nhật hoặc tạo mới
   * @throws CustomError nếu không thể tạo/cập nhật thiết bị
   */
  private async handleUserDevice(
    userId: number,
    deviceFingerprint: string,
    userAgent: string | null,
    ipAddress: string | null,
    tx: any
  ) {
    const currentEpochMillis = convertToMillis(now());
    const parserInstance = new UAParser.UAParser(userAgent ?? "");
    const uaResult = parserInstance.getResult();
    const deviceTypeEnum = this.mapUAParsedToDeviceType(uaResult);

    // Xử lý tên thiết bị dựa trên thông tin User-Agent
    let deviceName = uaResult.device.model;
    if (!deviceName) {
      const osName = uaResult.os.name
        ? `${uaResult.os.name} ${uaResult.os.version ?? ""}`.trim()
        : "";
      const browser = uaResult.browser.name
        ? `${uaResult.browser.name} ${uaResult.browser.version ?? ""}`.trim()
        : "";
      if (osName && browser) {
        deviceName = `${osName} - ${browser}`;
      } else if (osName) {
        deviceName = osName;
      } else if (browser) {
        deviceName = browser;
      } else {
        deviceName = "Unknown Device";
      }
    }
    deviceName = deviceName.substring(0, 100);

    // Tìm thiết bị trong database nếu đã tồn tại
    let userDeviceRecord = await this.userDeviceRepo.findOne(
      {
        userId: userId,
        fingerprint: deviceFingerprint,
      },
      tx
    );

    // Tạo mới hoặc cập nhật thông tin thiết bị
    if (!userDeviceRecord) {
      // Tạo mới thiết bị
      const newUserDeviceData: NewUserDevice = {
        userId: userId,
        fingerprint: deviceFingerprint,
        name: deviceName,
        type: deviceTypeEnum,
        model: uaResult.device.model ?? "",
        osName: uaResult.os.name ?? "",
        osVersion: uaResult.os.version ?? "",
        browserName: uaResult.browser.name ?? "",
        browserVersion: uaResult.browser.version ?? "",
        lastKnownIp: ipAddress ?? "",
        lastUserAgent: userAgent ?? "",
        lastSeenAt: currentEpochMillis,
        isTrusted: 0, // Ban đầu thiết bị chưa được tin tưởng
      };
      userDeviceRecord = await this.userDeviceRepo.save(newUserDeviceData, tx);
    } else {
      // Cập nhật thông tin thiết bị hiện có
      userDeviceRecord = await this.userDeviceRepo.update(
        userDeviceRecord.id,
        {
          name: deviceName,
          type: deviceTypeEnum,
          model: uaResult.device.model ?? userDeviceRecord.model ?? "",
          osName: uaResult.os.name ?? userDeviceRecord.osName ?? "",
          osVersion: uaResult.os.version ?? userDeviceRecord.osVersion ?? "",
          browserName:
            uaResult.browser.name ?? userDeviceRecord.browserName ?? "",
          browserVersion:
            uaResult.browser.version ?? userDeviceRecord.browserVersion ?? "",
          lastKnownIp: ipAddress ?? userDeviceRecord.lastKnownIp ?? "",
          lastUserAgent: userAgent ?? userDeviceRecord.lastUserAgent ?? "",
          lastSeenAt: currentEpochMillis,
        },
        tx
      );
    }

    if (!userDeviceRecord || typeof userDeviceRecord.id !== "number") {
      throw new CustomError(
        "Failed to create or retrieve user device information.",
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        MessageCode.INTERNAL_SERVER_ERROR
      );
    }

    return userDeviceRecord;
  }

  /**
   * Vô hiệu hóa phiên đăng nhập hiện có của thiết bị
   * @param userId ID người dùng
   * @param userDeviceId ID thiết bị
   * @param tx Transaction để thực hiện trong
   * @returns Thông tin phiên đã vô hiệu hóa hoặc undefined nếu không có phiên hiện có
   */
  private async revokeExistingSession(
    userId: number,
    userDeviceId: number,
    tx: any
  ) {
    const currentEpochMillis = convertToMillis(now());

    // Tìm phiên đang hoạt động của thiết bị này
    const existingActiveSession =
      await this.sessionRepo.findActiveSessionByUserIdAndUserDeviceId(
        userId,
        userDeviceId,
        tx
      );

    if (existingActiveSession) {
      // Vô hiệu hóa phiên trong database
      await this.sessionRepo.updateSession(
        existingActiveSession.publicSessionId,
        {
          isActive: BOOLEAN.FALSE,
          revokedAt: currentEpochMillis,
        },
        tx
      );

      // Xóa session cũ khỏi Redis
      try {
        const redisClient = getRedisClient();
        await redisClient.del(
          `auth:session:${existingActiveSession.publicSessionId}`
        );
      } catch (redisError) {
        console.error("Redis error when deleting old session:", redisError);
        // Không throw lỗi ở đây, tiếp tục xử lý
      }
    }

    return existingActiveSession;
  }

  /**
   * Tạo phiên đăng nhập mới cho người dùng
   * @param userId ID người dùng
   * @param userDeviceId ID thiết bị
   * @param tx Transaction để thực hiện trong
   * @returns Thông tin phiên và tokens
   */
  private async createNewSession(
    userId: number,
    user: User,
    userDeviceId: number,
    tx: any
  ) {
    const currentEpochMillis = convertToMillis(now());

    // Tạo session ID và JWT payloads
    const publicSessionId = uuidv4();
    const accessTokenPayload = {
      sub: userId.toString(),
      session_id: publicSessionId,
      email: user.email,
      display_name: user.displayName || "",
      account_status: user.accountStatus,
    };

    const refreshTokenPayload = {
      sub: userId.toString(),
      session_id: publicSessionId,
    };

    // Ký JWT tokens
    const accessToken = signAccessToken(accessTokenPayload);
    const refreshToken = signRefreshToken(refreshTokenPayload);
    const hashedRefreshToken = await hashPassword(refreshToken);

    // Tính thời gian hết hạn của refresh token
    const refreshTokenExpString =
      jwtConfig.JWT_REFRESH_TOKEN_EXPIRATION ?? "7d";
    const daysMatch = refreshTokenExpString.match(/^(\d+)d$/);
    let numberOfDaysToExpire = 7;
    if (daysMatch && daysMatch[1]) {
      numberOfDaysToExpire = parseInt(daysMatch[1]);
    }
    const expiresAtMillis = convertToMillis(
      addDays(now(), numberOfDaysToExpire)
    );

    // Tạo bản ghi phiên mới trong database
    const newSessionData: NewSessionSchema = {
      publicSessionId: publicSessionId,
      userId: Number(userId),
      userDeviceId: userDeviceId,
      hashedRefreshToken: hashedRefreshToken,
      familyId: uuidv4(), // Mỗi phiên đăng nhập mới tạo một token family mới
      expiresAt: expiresAtMillis,
      isActive: 1,
    };

    const newSession = await this.sessionRepo.createSession(newSessionData, tx);

    // Cập nhật thời gian đăng nhập gần nhất
    await this.userRepo.update(
      userId,
      {
        last_login_at: currentEpochMillis,
      },
      tx
    );

    return {
      session: newSession,
      publicSessionId,
      accessToken,
      refreshToken,
      hashedRefreshToken,
      expiresAtMillis,
    };
  }

  /**
   * Cache thông tin phiên và người dùng trong Redis
   * @param userId ID người dùng
   * @param userDeviceId ID thiết bị
   * @param sessionInfo Thông tin phiên đăng nhập
   * @param userInfo Thông tin người dùng
   */
  private async cacheSessionData(
    userId: number,
    userDeviceId: number,
    sessionInfo: any,
    userInfo: User
  ) {
    try {
      const redisClient = getRedisClient();

      // Lưu thông tin session với thời gian hết hạn giống refresh token
      const sessionKey = `auth:session:${sessionInfo.publicSessionId}`;
      const sessionData = {
        user_id: userId,
        device_id: userDeviceId,
        refresh_token_hash: sessionInfo.hashedRefreshToken,
        is_active: 1,
        expires_at: sessionInfo.expiresAtMillis,
      };

      await redisClient.set(sessionKey, JSON.stringify(sessionData));
      await redisClient.expireAt(
        sessionKey,
        Math.floor(sessionInfo.expiresAtMillis / 1000)
      ); // Redis expireAt dùng Unix timestamp (giây)

      // Cache thông tin user cơ bản để tăng tốc xác thực
      const userKey = `auth:user:${userId}`;
      const userData = {
        id: userId,
        email: userInfo.email,
        display_name: userInfo.displayName || "",
        account_status: userInfo.accountStatus,
        last_login_at: convertToMillis(now()),
      };

      // Cache thông tin user trong 1 giờ (có thể điều chỉnh)
      await redisClient.set(userKey, JSON.stringify(userData));
      await redisClient.expire(userKey, 3600); // 1 giờ

      // Lưu danh sách session của user để dễ dàng quản lý
      await redisClient.sAdd(
        `auth:user:${userId}:sessions`,
        sessionInfo.publicSessionId
      );

      // Cache thông tin roles và permissions
      await this.cacheUserRolesAndPermissions(userId);
    } catch (redisError) {
      console.error("Redis error when storing session data:", redisError);
      // Không throw lỗi ở đây, tiếp tục xử lý
    }
  }

  /**
   * Cache thông tin roles và permissions của người dùng vào Redis
   * @param userId ID của người dùng
   */
  private async cacheUserRolesAndPermissions(userId: number) {
    try {
      const redisClient = getRedisClient();
      const userRolesRepo = UserRolesRepository.getInstance();
      const permissionRepo = PermissionRepository.getInstance();

      // Lấy danh sách roles từ database
      const userRoles = await userRolesRepo.findRolesByUserId(userId);
      const roleNames = userRoles.map((role) => role.name);

      if (roleNames.length > 0) {
        // Cache roles vào Redis
        const userRolesKey = `auth:user:${userId}:roles`;
        await redisClient.set(userRolesKey, JSON.stringify(roleNames));
        await redisClient.expire(userRolesKey, 3600); // 1 giờ

        // Cache permissions cho từng role
        for (const roleName of roleNames) {
          const rolePermissions = await permissionRepo.findPermissionsByRoles([
            roleName,
          ]);
          const rolePermissionNames = rolePermissions.map(
            (permission) => permission.name
          );

          const rolePermissionsKey = `auth:role:${roleName}:permissions`;
          await redisClient.set(
            rolePermissionsKey,
            JSON.stringify(rolePermissionNames)
          );
          await redisClient.expire(rolePermissionsKey, 3600); // 1 giờ
        }
      }
    } catch (redisError) {
      console.error(
        "Redis error when caching roles and permissions:",
        redisError
      );
      // Không throw lỗi ở đây, tiếp tục xử lý
    }
  }

  async register(
    data: UserRegisterDtoType,
    ipAddress: string | null,
    userAgent: string | null
  ) {
    try {
      // Kiểm tra email đã tồn tại chưa (nằm ngoài transaction)
      const existingUser = await this.userRepo.findByEmail(data.email);
      if (existingUser) {
        throw new CustomError(
          "Email already exists",
          HttpStatusCode.CONFLICT,
          MessageCode.EMAIL_EXISTS
        );
      }

      // Hash mật khẩu (nằm ngoài transaction)
      const hashedPassword = await hashPassword(data.password);

      // Khởi tạo repositories
      const roleRepo = RoleRepository.getInstance();
      const userRolesRepo = UserRolesRepository.getInstance();

      // Thực hiện transaction
      return await transaction(async (tx) => {
        // Tạo user mới
        const newUser = await this.userRepo.save(
          {
            email: data.email,
            hashedPassword: hashedPassword,
            displayName: data.display_name,
            accountStatus: UserStatus.PENDING_VERIFICATION,
          },
          tx
        );

        // Tìm role USER
        const userRole = await roleRepo.findByName(Role.USER, tx);

        if (userRole) {
          // Gán role USER cho người dùng mới
          await userRolesRepo.save(
            {
              userId: newUser.id,
              roleId: userRole.id,
            },
            tx
          );
        } else {
          console.error("USER role not found in the database");
        }

        // Cache thông tin roles và permissions sau khi đăng ký
        await this.cacheUserRolesAndPermissions(newUser.id);

        return newUser;
      });
    } catch (error) {
      // Log the error for debugging purposes
      if (error instanceof Error) {
        console.error("Registration error:", error.message);

        // Xử lý CustomError - không cần wrap lại trong CustomError khác
        if (error instanceof CustomError) {
          throw error; // Trả về CustomError trực tiếp
        }

        // Check if it's a DrizzleError for unique constraint violation
        if (
          error?.message?.includes(
            "duplicate key value violates unique constraint"
          )
        ) {
          throw new CustomError(
            "User with this email already exists.",
            HttpStatusCode.CONFLICT,
            MessageCode.EMAIL_EXISTS
          );
        }
      } else {
        console.error("Registration error (unknown type):", error);
      }

      // Throw a generic error to the client for other issues
      throw new CustomError(
        "Failed to register user.",
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        MessageCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Đăng nhập người dùng
   * @param data Dữ liệu đăng nhập (email, password, device_id)
   * @param ipAddress Địa chỉ IP của người dùng
   * @param userAgent User-Agent của trình duyệt/thiết bị
   * @returns Thông tin đăng nhập thành công (tokens, session_id)
   * @throws CustomError nếu đăng nhập thất bại
   */
  async login(
    data: UserLoginDtoType,
    ipAddress: string | null,
    userAgent: string | null
  ) {
    try {
      // 1. Xác thực thông tin đăng nhập (nằm ngoài transaction)
      const user = await this.validateUserCredentials(
        data.email,
        data.password
      );

      // 2. Thực hiện transaction cho các thao tác ghi/cập nhật
      return await transaction(async (tx) => {
        // 3. Xử lý thông tin thiết bị
        const userDeviceRecord = await this.handleUserDevice(
          user.id,
          data.device_id,
          userAgent,
          ipAddress,
          tx
        );
        const userDeviceId = userDeviceRecord.id;

        // 4. Vô hiệu hóa phiên đăng nhập hiện có
        await this.revokeExistingSession(user.id, userDeviceId, tx);

        // 5. Tạo phiên đăng nhập mới
        const sessionInfo = await this.createNewSession(
          user.id,
          user,
          userDeviceId,
          tx
        );

        // 6. Cache thông tin phiên và người dùng (Không ảnh hưởng đến transaction)
        await this.cacheSessionData(user.id, userDeviceId, sessionInfo, user);

        // 7. Trả về thông tin đăng nhập
        return {
          user_id: user.id,
          device_id: userDeviceId,
          session_id: sessionInfo.publicSessionId,
          access_token: sessionInfo.accessToken,
          refresh_token: sessionInfo.refreshToken,
        };
      });
    } catch (error) {
      // Xử lý lỗi và ném lại cho client
      if (error instanceof CustomError) {
        throw error;
      }
      console.error(
        "Login error:",
        error instanceof Error ? error.message : error
      );
      throw new CustomError(
        "Failed to login user.",
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        MessageCode.INTERNAL_SERVER_ERROR
      );
    }
  }
}
