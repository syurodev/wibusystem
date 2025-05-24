import { Static, t } from "elysia";

/**
 * DTO cho yêu cầu làm mới token
 */
export const RefreshTokenDto = t.Object({
  refresh_token: t.String({
    description: "Refresh token cần sử dụng để lấy access token mới",
    error: "Refresh token không hợp lệ",
  }),
});

export interface RefreshTokenDtoType extends Static<typeof RefreshTokenDto> {}
