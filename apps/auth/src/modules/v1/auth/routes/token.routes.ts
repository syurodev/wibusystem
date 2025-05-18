import { Elysia } from 'elysia';
import { RefreshTokenSchema, RevokeTokenSchema } from '../validations/token.validation';
import { AuthServiceApi } from '@repo/common';
import { tokenController } from '../controllers/token.controller';
import { jwtPlugin } from '../../../../plugins/jwt.plugin';

// Lấy API definitions
const authApi = new AuthServiceApi('v1').getDefinition();

// Tạo một instance mới của Elysia với JWT plugin
const tokenApp = new Elysia()
  .use(jwtPlugin);

/**
 * Routes xử lý refresh token và revoke token
 */
export const tokenRoutes = (app: Elysia) =>
  app
    .use(tokenApp)
    // Làm mới access token
    .post(
      authApi.auth.endpoints.AUTH_REFRESH_TOKEN.subPath,
      async ({ body, set, refreshJwt, accessJwt }) => {
        const { refresh_token: refreshToken } = body as { refresh_token: string };
        return tokenController.refreshToken(
          refreshToken,
          refreshJwt.verify,
          accessJwt.sign
        );
      },
      {
        body: RefreshTokenSchema,
        detail: {
          summary: 'Làm mới access token',
          description: 'Sử dụng refresh token để lấy access token mới',
          tags: ['auth', 'token']
        }
      }
    )
    // Thu hồi refresh token
    .post(
      authApi.auth.endpoints.AUTH_REVOKE_TOKEN.subPath,
      async ({ body, refreshJwt }) => {
        const { refresh_token: refreshToken } = body as { refresh_token: string };
        return tokenController.logout(refreshToken, refreshJwt.verify);
      },
      {
        body: RevokeTokenSchema,
        detail: {
          summary: 'Thu hồi refresh token',
          description: 'Đánh dấu refresh token đã bị thu hồi',
          tags: ['auth', 'token']
        }
      }
    );
