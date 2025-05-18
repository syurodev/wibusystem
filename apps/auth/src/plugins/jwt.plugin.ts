/**
 * @file Cấu hình plugin @elysiajs/jwt.
 * @author Your Name
 */
import { jwt } from "@elysiajs/jwt";
import { Elysia } from "elysia";
import { jwtConfig } from "../configs";

/**
 * Plugin JWT cấu hình cho auth-service
 * Cung cấp 2 JWT signer: accessToken & refreshToken
 */
export const jwtPlugin = new Elysia()
  .use(
    jwt({
      name: "accessJwt",
      secret: jwtConfig.JWT_SECRET_KEY ?? "access_secret_key_placeholder",
      exp: jwtConfig.JWT_ACCESS_TOKEN_EXPIRATION ?? "15m",
    })
  )
  .use(
    jwt({
      name: "refreshJwt",
      secret:
        jwtConfig.JWT_REFRESH_SECRET_KEY ?? "refresh_secret_key_placeholder",
      exp: jwtConfig.JWT_REFRESH_TOKEN_EXPIRATION ?? "7d",
    })
  );

// TODO: Hoàn thiện cấu hình JWT với secret keys và expiration times từ src/configs/index.ts
