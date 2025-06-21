import {
  decryptDeviceData,
  EncryptionResult,
  generateSecretKey,
  getCurrentUnixTimestamp,
  parseUnixToVietnamTime,
} from "@repo/utils";
import { jwtVerify } from "jose";
import { SERVICE_CONFIG } from "../../../configs";
import { sessionRepository, userRepository } from "../../../database";
import { SessionModel } from "../../../database/models/session.model";
import { AuthDto } from "./auth.dto";
import { AuthResponse } from "./auth.response";

/**
 * Service xử lý xác thực người dùng và device fingerprinting
 * Sử dụng Repository Pattern để tách biệt business logic và data access
 */
export class AuthService {
  constructor(
    private readonly userRepo = userRepository,
    private readonly sessionRepo = sessionRepository
  ) {}

  async register(data: AuthDto.RegisterAccountSchema) {}

  /**
   * Tạo device fingerprint hash từ client data sử dụng Bun password
   */
  private async generateServerFingerprint(
    data: AuthDto.DeviceFingerprintSchema
  ): Promise<string> {
    // const fingerprintData = {
    //   screenWidth: data.device.screenWidth,
    //   screenHeight: data.device.screenHeight,
    //   colorDepth: data.device.colorDepth,
    //   devicePixelRatio: data.device.devicePixelRatio,
    //   concurrency: data.device.concurrency,
    //   memory: data.device.memory || 0,
    //   maxTouchPoints: data.device.maxTouchPoints,
    //   platform: data.device.platform,
    //   language: data.device.language,
    //   timezone: data.device.timezone,
    //   webGL: data.features.webGL,
    //   canvas: data.features.canvas,
    //   localStorage: data.features.localStorage,
    //   touchDevice: data.features.touchDevice,
    // };
    // const fingerprintString = JSON.stringify(
    //   fingerprintData,
    //   Object.keys(fingerprintData).sort()
    // );
    // // Sử dụng Bun password để hash fingerprint
    // const hashedFingerprint = await Bun.password.hash(fingerprintString, {
    //   algorithm: "bcrypt",
    //   cost: 4, // Low cost vì không cần security cao cho fingerprint
    // });
    // // Lấy 64 ký tự cuối để có fingerprint ngắn gọn
    // return hashedFingerprint.slice(-64);
  }

  /**
   * Tính risk score dựa trên device fingerprint (scale 0-100)
   */
  private calculateRiskScore(data: AuthDto.DeviceFingerprintSchema): number {
    // let risk = 0;
    // // Kiểm tra các yếu tố nghi ngờ (scale 0-100)
    // if (!data.features.localStorage) risk += 20;
    // if (!data.features.canvas) risk += 30;
    // if (data.device.concurrency > 32) risk += 20; // CPU quá mạnh - có thể là bot
    // if (data.device.screenWidth < 800 || data.device.screenHeight < 600)
    //   risk += 10;
    // // User agent không khớp với device info
    // const isInconsistent = this.checkDeviceConsistency(data);
    // if (!isInconsistent) risk += 40;
    // return Math.min(risk, 100); // Cap ở 100
  }

  /**
   * Kiểm tra tính nhất quán của device info
   */
  private checkDeviceConsistency(
    data: AuthDto.DeviceFingerprintSchema
  ): boolean {
    // const userAgent = data.userAgent.toLowerCase();

    // // Kiểm tra mobile vs desktop
    // const isMobileUA = /mobile|android|iphone|ipad/.test(userAgent);
    // const isMobileDevice =
    //   data.features.touchDevice && data.device.maxTouchPoints > 0;

    // if (isMobileUA !== isMobileDevice) return false;

    // // Kiểm tra OS consistency
    // if (
    //   userAgent.includes("windows") &&
    //   !data.device.platform.toLowerCase().includes("win")
    // )
    //   return false;
    // if (
    //   userAgent.includes("mac") &&
    //   !data.device.platform.toLowerCase().includes("mac")
    // )
    //   return false;

    return true;
  }

  /**
   * Tạo device token cho guest user (chưa đăng nhập)
   */
  async createDeviceToken(
    deviceData: AuthDto.DeviceFingerprintSchema,
    ipAddress: string
  ): Promise<AuthResponse.DeviceTokenData> {
    const encryption: EncryptionResult = JSON.parse(deviceData.deviceInfo);

    const secretKey = generateSecretKey(
      SERVICE_CONFIG.DATA_ENCRYPT_SECRET_KEY,
      SERVICE_CONFIG.NODE_ENV
    );

    const deviceInfoDecrypted = await decryptDeviceData(encryption, {
      secretKey,
    });

    console.log("deviceInfoDecrypted:", deviceInfoDecrypted);

    // const deviceId = nanoid(16);
    // const serverFingerprint = await this.generateServerFingerprint(deviceData);
    // const riskScore = this.calculateRiskScore(deviceData);

    // // Tạo device token (JWT with device info)
    // const secret = new TextEncoder().encode(
    //   process.env.JWT_SECRET || "device-secret"
    // );
    // const deviceToken = await new SignJWT({
    //   deviceId,
    //   fingerprint: serverFingerprint,
    //   type: "device",
    //   isGuest: true,
    // })
    //   .setProtectedHeader({ alg: "HS256" })
    //   .setIssuedAt()
    //   .setExpirationTime("30d")
    //   .sign(secret);

    // // Parse device info từ user agent
    // const deviceInfo = this.parseUserAgent(deviceData.userAgent);

    // // Lưu session với user_id = null (guest)
    // const sessionData: Partial<SessionModel> = {
    //   user_id: 0, // Guest user
    //   access_token: "",
    //   refresh_token: "",
    //   device_id: deviceId,
    //   device_fingerprint: serverFingerprint,
    //   device_token: deviceToken,
    //   device_name: deviceInfo.name,
    //   device_type: deviceInfo.type,
    //   device_os: deviceInfo.os,
    //   device_browser: deviceInfo.browser,
    //   user_agent: deviceData.userAgent,
    //   ip_address: ipAddress,
    //   roles: ["guest"],
    //   permissions: ["basic"],
    //   metadata: {
    //     clientFingerprints: deviceData.clientFingerprints,
    //     confidence: await this.calculateConfidence(deviceData),
    //     firstSeen: getCurrentUnixTimestamp(),
    //   },
    //   risk_score: riskScore,
    //   request_count: 1,
    //   last_used_at: getCurrentUnixTimestamp(),
    //   is_active: true,
    //   is_blocked: riskScore > 80, // Block nếu risk cao (> 80/100)
    //   blocked_reason: riskScore > 80 ? "High risk device" : "",
    //   expires_at: getCurrentUnixTimestamp() + 30 * 24 * 60 * 60,
    //   revoked_at: 0,
    //   created_at: getCurrentUnixTimestamp(),
    //   updated_at: getCurrentUnixTimestamp(),
    // };

    // await this.sessionRepo.create(sessionData as SessionModel, 0);

    // return {
    //   deviceToken,
    //   deviceId,
    //   fingerprint: serverFingerprint,
    //   expiresAt: parseUnixToVietnamTime(
    //     Number(sessionData.expires_at),
    //     "YYYY-MM-DD HH:mm:ss"
    //   ),
    //   createdAt: parseUnixToVietnamTime(
    //     Number(sessionData.created_at),
    //     "YYYY-MM-DD HH:mm:ss"
    //   ),
    //   isGuest: true,
    // };
  }

  /**
   * Verify device fingerprint
   */
  async verifyDevice(
    deviceData: AuthDto.DeviceFingerprintSchema,
    deviceToken?: string
  ): Promise<AuthResponse.DeviceVerificationData> {
    const serverFingerprint = await this.generateServerFingerprint(deviceData);

    // Tìm session existing
    let existingSession: SessionModel | null = null;

    if (deviceToken) {
      try {
        const secret = new TextEncoder().encode(
          process.env.JWT_SECRET || "device-secret"
        );
        const { payload } = await jwtVerify(deviceToken, secret);

        existingSession = await this.sessionRepo.findOne({
          device_id: payload.deviceId as string,
          is_active: true,
        });
      } catch (error) {
        // Token không hợp lệ
      }
    }

    // Nếu không có token, tìm bằng fingerprint
    if (!existingSession) {
      existingSession = await this.sessionRepo.findOne({
        device_fingerprint: serverFingerprint,
        is_active: true,
      });
    }

    const confidence = await this.calculateConfidence(deviceData);
    const isNewDevice = !existingSession;

    if (existingSession) {
      // Update last used
      await this.sessionRepo.update(
        BigInt(existingSession.id),
        {
          last_used_at: getCurrentUnixTimestamp(),
          request_count: existingSession.request_count + 1,
          updated_at: getCurrentUnixTimestamp(),
        },
        BigInt(0)
      );
    }

    return {
      isValid: !!existingSession && !existingSession.is_blocked,
      deviceId: Number(existingSession?.device_id),
      fingerprint: serverFingerprint,
      confidence,
      lastSeen: parseUnixToVietnamTime(
        Number(existingSession?.last_used_at),
        "YYYY-MM-DD HH:mm:ss"
      ),
      isNewDevice,
    };
  }

  /**
   * Link device với user khi đăng nhập
   */
  async linkDeviceToUser(
    userId: string,
    deviceToken: string,
    accessToken: string,
    refreshToken: string
  ): Promise<boolean> {
    try {
      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET || "device-secret"
      );
      const { payload } = await jwtVerify(deviceToken, secret);

      const session = await this.sessionRepo.findOne({
        device_id: payload.deviceId as string,
        is_active: true,
      });

      if (session) {
        await this.sessionRepo.update(
          BigInt(session.id),
          {
            user_id: userId,
            access_token: accessToken,
            refresh_token: refreshToken,
            roles: ["user"], // Upgrade từ guest thành user
            permissions: ["read", "write"],
            updated_at: getCurrentUnixTimestamp(),
          },
          BigInt(Number(userId))
        );
        return true;
      }
    } catch (error) {
      console.error("Error linking device to user:", error);
    }

    return false;
  }

  /**
   * Parse user agent để lấy thông tin device
   */
  private parseUserAgent(userAgent: string) {
    const ua = userAgent.toLowerCase();

    let deviceType = "desktop";
    if (/mobile|android|iphone/.test(ua)) deviceType = "mobile";
    else if (/tablet|ipad/.test(ua)) deviceType = "tablet";

    let os = "Unknown";
    if (ua.includes("windows")) os = "Windows";
    else if (ua.includes("mac")) os = "macOS";
    else if (ua.includes("linux")) os = "Linux";
    else if (ua.includes("android")) os = "Android";
    else if (ua.includes("ios")) os = "iOS";

    let browser = "Unknown";
    if (ua.includes("chrome")) browser = "Chrome";
    else if (ua.includes("firefox")) browser = "Firefox";
    else if (ua.includes("safari")) browser = "Safari";
    else if (ua.includes("edge")) browser = "Edge";

    return {
      name: `${os} ${deviceType}`,
      type: deviceType,
      os,
      browser,
    };
  }

  /**
   * Tính confidence score cho fingerprint (async để support server fingerprint)
   */
  private async calculateConfidence(
    data: AuthDto.DeviceFingerprintSchema
  ): Promise<number> {
    let confidence = 50; // Base confidence (scale 0-100)

    // Có nhiều thông tin unique
    if (data.device.memory) confidence += 10;
    if (data.features.webGL) confidence += 10;
    if (data.features.canvas) confidence += 10;
    if (data.device.maxTouchPoints > 0) confidence += 5;

    // Client và server fingerprint khớp
    const serverFingerprint = await this.generateServerFingerprint(data);
    if (
      data.clientFingerprints.basic.slice(0, 16) ===
      serverFingerprint.slice(0, 16)
    ) {
      confidence += 20;
    }

    // Device info consistent
    if (this.checkDeviceConsistency(data)) confidence += 10;

    return Math.min(confidence, 100);
  }
}
