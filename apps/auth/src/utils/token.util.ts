import { now, toSecondsFromDateTime } from "@repo/common";
import { createHash, randomBytes } from "crypto";

/**
 * @file Các hàm tiện ích xử lý JWT.
 * @description Cung cấp các hàm tiện ích để làm việc với JWT trong Elysia
 */

// Kiểu dữ liệu cho JWT Payload
// Tương thích với Elysia JWT plugin
interface JwtPayload {
  [key: string]: string | number | string[] | boolean | undefined;
  sub: string; // Subject (thường là user ID)
  iat?: number; // Thời điểm tạo token (issued at)
  exp?: number; // Thời điểm hết hạn token (expiration time)
  type?: "access" | "refresh";
  jti?: string; // JWT ID (dùng cho refresh token)
  fid?: string; // Family ID (dùng cho refresh token)
  roles?: string[]; // Danh sách quyền của người dùng
}

// Interface cho JWT instance từ Elysia
export interface JwtInstance {
  sign: (payload: JwtPayload) => Promise<string>;
  verify: (token: string) => Promise<JwtPayload | false>;
}

/**
 * Tạo token ngẫu nhiên
 * @param size Kích thước của token (mặc định: 32 bytes)
 * @returns Token ngẫu nhiên dạng hex string
 */
export const generateRandomToken = (size = 32): string => {
  return randomBytes(size).toString("hex");
};

/**
 * Tạo family ID cho refresh token
 * @returns Family ID ngẫu nhiên
 */
export const generateTokenFamilyId = (): string => {
  return randomBytes(16).toString("hex");
};

/**
 * Hash token để lưu trong database
 * Không lưu trữ token gốc trong database để tránh rủi ro bảo mật
 * @param token Token cần hash
 * @returns Token đã được hash
 */
export const hashToken = (token: string): string => {
  return createHash("sha256").update(token).digest("hex");
};

/**
 * Tạo payload cho JWT access token
 * @param userId ID của người dùng
 * @param roles Các quyền của người dùng (tùy chọn)
 * @returns Payload cho JWT access token
 */
export function createAccessTokenPayload(
  userId: bigint | number | string,
  roles: string[] = []
): JwtPayload {
  return {
    sub: userId.toString(),
    roles,
    type: "access",
    iat: toSecondsFromDateTime(now()),
  };
}

/**
 * Tạo payload cho JWT refresh token
 * @param userId ID của người dùng
 * @param tokenId ID của refresh token trong database
 * @param familyId Family ID của refresh token
 * @returns Payload cho JWT refresh token
 */
export function createRefreshTokenPayload(
  userId: bigint | number | string,
  tokenId: string,
  familyId: string
): JwtPayload {
  return {
    sub: userId.toString(),
    jti: tokenId,
    fid: familyId,
    type: "refresh",
    iat: toSecondsFromDateTime(now()),
  };
}

/**
 * Tạo cặp access token và refresh token
 * @param jwtInstance Instance JWT từ Elysia
 * @param userId ID của người dùng
 * @param roles Danh sách quyền của người dùng
 * @returns Đối tượng chứa access token và refresh token
 */
export async function generateTokenPair(
  jwtInstance: JwtInstance,
  userId: bigint | number | string,
  roles: string[] = []
): Promise<{ accessToken: string; refreshToken: string }> {
  const userIdStr = userId.toString();

  // Tạo access token
  const accessToken = await jwtInstance.sign(
    createAccessTokenPayload(userIdStr, roles)
  );

  // Tạo refresh token
  const refreshTokenId = generateRandomToken(32);
  const familyId = generateTokenFamilyId();

  const refreshToken = await jwtInstance.sign(
    createRefreshTokenPayload(userIdStr, refreshTokenId, familyId)
  );

  return {
    accessToken,
    refreshToken,
  };
}

/**
 * Xác thực và giải mã refresh token
 * @param jwtInstance Instance JWT từ Elysia
 * @param token Token cần xác thực
 * @returns Payload nếu hợp lệ, null nếu không hợp lệ
 */
export async function verifyRefreshToken(
  jwtInstance: JwtInstance,
  token: string
): Promise<JwtPayload | null> {
  try {
    const payload = await jwtInstance.verify(token);

    if (!payload || payload.type !== "refresh") {
      return null;
    }

    return payload;
  } catch (error) {
    console.error("Error verifying refresh token:", error);
    return null;
  }
}

// Re-export các kiểu dữ liệu để sử dụng ở nơi khác
export type { JwtPayload };
