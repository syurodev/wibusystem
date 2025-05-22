import {
  addDays,
  BOOLEAN,
  convertToMillis,
  DeviceType,
  HttpStatusCode,
  MessageCode,
  now,
  UserStatus,
} from "@repo/common";
import { UserDeviceRepository } from "@repositories/user-device.repository";
import { UserRepository } from "@repositories/user.repository";
import { CustomError } from "src/common/errors/custom.error";
import * as UAParser from "ua-parser-js"; // Use namespace import
import { v4 as uuidv4 } from "uuid"; // Để tạo session_id
import { jwtConfig } from "../../../../configs"; // Import jwtConfig để lấy expiration
import { transaction } from "../../../../database/connection"; // Import transaction helper
import { NewSessionSchema } from "../../../../database/schema/sessions.schema"; // Import NewSessionSchema
import { NewUserDevice } from "../../../../database/schema/user-devices.schema";
import {
  signAccessToken,
  signRefreshToken,
} from "../../../../plugins/jwt.plugin"; // Import các JWT sign functions
import { SessionRepository } from "../../../../repositories/session.repository"; // Import SessionRepository
import { comparePassword, hashPassword } from "../../../../utils/password.util";
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

      // Thực hiện transaction
      return await transaction(async (tx) => {
        // Tạo user mới
        const newUser = await this.userRepo.save(
          {
            email: data.email,
            hashedPassword: hashedPassword,
            displayName: data.display_name,
            accountStatus: UserStatus.INACTIVE,
          },
          tx
        );

        return newUser;
      });
    } catch (error) {
      // Log the error for debugging purposes
      if (error instanceof Error) {
        console.error("Registration error:", error.message);
        // Check if it's a DrizzleError for unique constraint violation
        // This is a basic check; you might need more specific error handling
        if (
          error?.message?.includes(
            "duplicate key value violates unique constraint"
          )
        ) {
          throw new CustomError(
            "User with this email already exists.",
            HttpStatusCode.CONFLICT,
            MessageCode.EMAIL_EXISTS // Or a more specific code for DB constraint violation
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

  async login(
    data: UserLoginDtoType,
    ipAddress: string | null,
    userAgent: string | null
  ) {
    try {
      // Các kiểm tra xác thực nằm ngoài transaction
      const user = await this.userRepo.findByEmail(data.email);
      if (!user) {
        throw new CustomError(
          "Invalid email or password",
          HttpStatusCode.UNAUTHORIZED,
          MessageCode.AUTH_INVALID_CREDENTIALS
        );
      }

      // Kiểm tra mật khẩu
      const isPasswordValid = await comparePassword(
        data.password,
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

      // Thực hiện transaction
      return await transaction(async (tx) => {
        const clientDeviceId = data.device_id;
        const parserInstance = new UAParser.UAParser(userAgent ?? "");
        const uaResult = parserInstance.getResult();
        const deviceTypeEnum = this.mapUAParsedToDeviceType(uaResult);

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

        // Find or Create UserDevice entry
        let userDeviceRecord = await this.userDeviceRepo.findOne(
          {
            userId: user.id,
            fingerprint: clientDeviceId,
          },
          tx
        );

        const currentEpochMillis = convertToMillis(now());

        if (!userDeviceRecord) {
          const newUserDeviceData: NewUserDevice = {
            userId: user.id,
            fingerprint: clientDeviceId,
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
            isTrusted: 0,
          };
          userDeviceRecord = await this.userDeviceRepo.save(
            newUserDeviceData,
            tx
          );
        } else {
          userDeviceRecord = await this.userDeviceRepo.update(
            userDeviceRecord.id,
            {
              name: deviceName,
              type: deviceTypeEnum,
              model: uaResult.device.model ?? userDeviceRecord.model ?? "",
              osName: uaResult.os.name ?? userDeviceRecord.osName ?? "",
              osVersion:
                uaResult.os.version ?? userDeviceRecord.osVersion ?? "",
              browserName:
                uaResult.browser.name ?? userDeviceRecord.browserName ?? "",
              browserVersion:
                uaResult.browser.version ??
                userDeviceRecord.browserVersion ??
                "",
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
        const userDeviceId = userDeviceRecord.id;

        // Revoke existing active session
        const existingActiveSession =
          await this.sessionRepo.findActiveSessionByUserIdAndUserDeviceId(
            user.id,
            userDeviceId,
            tx
          );

        if (existingActiveSession) {
          await this.sessionRepo.updateSession(
            existingActiveSession.publicSessionId,
            {
              isActive: BOOLEAN.FALSE,
              revokedAt: currentEpochMillis,
            },
            tx
          );
        }

        // Tạo session và tokens
        const publicSessionId = uuidv4();

        const accessTokenPayload = {
          sub: user.id.toString(),
          session_id: publicSessionId,
        };

        const refreshTokenPayload = {
          sub: user.id.toString(),
          session_id: publicSessionId,
        };

        // Ký token (nằm ngoài transaction vì không liên quan đến DB)
        const accessToken = signAccessToken(accessTokenPayload);
        const refreshToken = signRefreshToken(refreshTokenPayload);
        const hashedRefreshToken = await hashPassword(refreshToken);

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

        // Tạo session mới
        const newSessionData: NewSessionSchema = {
          publicSessionId: publicSessionId,
          userId: Number(user.id),
          userDeviceId: userDeviceId,
          hashedRefreshToken: hashedRefreshToken,
          familyId: uuidv4(),
          expiresAt: expiresAtMillis,
          isActive: 1,
        };

        const newSession = await this.sessionRepo.createSession(
          newSessionData,
          tx
        );

        // Cập nhật last_login_at
        await this.userRepo.update(
          user.id,
          {
            last_login_at: currentEpochMillis,
          },
          tx
        );

        return {
          user_id: user.id,
          device_id: newSession.userDeviceId,
          session_id: newSession.publicSessionId,
          access_token: accessToken,
          refresh_token: refreshToken,
        };
      });
    } catch (error) {
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
