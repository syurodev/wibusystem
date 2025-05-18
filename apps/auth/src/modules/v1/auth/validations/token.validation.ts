import { t } from 'elysia';

/**
 * Schema cho refresh token
 */
export const RefreshTokenSchema = t.Object(
  {
    refresh_token: t.String({
      minLength: 1,
      error: 'Refresh token không được để trống',
    }),
  },
  {
    error: 'Dữ liệu không hợp lệ',
  }
);

/**
 * Schema cho revoke token
 */
export const RevokeTokenSchema = t.Object(
  {
    refresh_token: t.String({
      minLength: 1,
      error: 'Refresh token không được để trống',
    }),
  },
  {
    error: 'Dữ liệu không hợp lệ',
  }
);

/**
 * Schema cho verify token
 */
export const VerifyTokenSchema = t.Object(
  {
    token: t.String({
      minLength: 1,
      error: 'Token không được để trống',
    }),
  },
  {
    error: 'Dữ liệu không hợp lệ',
  }
);
