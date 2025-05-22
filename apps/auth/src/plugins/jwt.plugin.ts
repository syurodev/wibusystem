/**
 * @file Cấu hình JWT cho auth service.
 * @author Your Name
 */
import { jwt as elysiaJwt } from "@elysiajs/jwt";
import { Elysia } from "elysia";
import { jwtConfig } from "../configs";

// Tạo các instance JWT helper functions sử dụng thư viện chuẩn jsonwebtoken
import * as jwt from "jsonwebtoken";

// Cấu hình JWT
const accessJwtConfig = {
  secret: jwtConfig.JWT_SECRET_KEY ?? "access_secret_key_placeholder",
  exp: jwtConfig.JWT_ACCESS_TOKEN_EXPIRATION ?? "15m",
};

const refreshJwtConfig = {
  secret: jwtConfig.JWT_REFRESH_SECRET_KEY ?? "refresh_secret_key_placeholder",
  exp: jwtConfig.JWT_REFRESH_TOKEN_EXPIRATION ?? "7d",
};

// Helper function để chuyển đổi chuỗi expiration (ví dụ: "15m", "7d") thành seconds
const parseExpiration = (exp: string): number => {
  const match = exp.match(/^(\d+)([smhd])$/);
  if (!match) return 60 * 15; // Mặc định 15 phút nếu không parse được

  const [, value, unit] = match;
  const num = parseInt(value || "0", 10);

  switch (unit) {
    case "s":
      return num;
    case "m":
      return num * 60;
    case "h":
      return num * 60 * 60;
    case "d":
      return num * 60 * 60 * 24;
    default:
      return 60 * 15;
  }
};

// Helper functions để ký token và verify token
export const signAccessToken = (payload: Record<string, any>): string => {
  return jwt.sign(payload, accessJwtConfig.secret, {
    expiresIn: parseExpiration(accessJwtConfig.exp),
  });
};

export const verifyAccessToken = (token: string): any => {
  try {
    return jwt.verify(token, accessJwtConfig.secret);
  } catch (err) {
    return null;
  }
};

export const signRefreshToken = (payload: Record<string, any>): string => {
  return jwt.sign(payload, refreshJwtConfig.secret, {
    expiresIn: parseExpiration(refreshJwtConfig.exp),
  });
};

export const verifyRefreshToken = (token: string): any => {
  try {
    return jwt.verify(token, refreshJwtConfig.secret);
  } catch (err) {
    return null;
  }
};

/**
 * Plugin JWT cấu hình cho auth-service
 * Cung cấp 2 JWT signer: accessToken & refreshToken
 */
export const jwtPlugin = new Elysia()
  .use(
    elysiaJwt({
      name: "accessJwt",
      secret: accessJwtConfig.secret,
      exp: accessJwtConfig.exp,
    })
  )
  .use(
    elysiaJwt({
      name: "refreshJwt",
      secret: refreshJwtConfig.secret,
      exp: refreshJwtConfig.exp,
    })
  );

// TODO: Hoàn thiện cấu hình JWT với secret keys và expiration times từ src/configs/index.ts
