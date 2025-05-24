import { Static, t } from "elysia";

/**
 * DTO cho yêu cầu đặt lại mật khẩu
 */
export const ResetPasswordDto = t.Object({
  token: t.String({
    description: 'Token reset mật khẩu (nhận được qua email)',
    error: 'Token không hợp lệ',
  }),
  password: t.String({
    description: 'Mật khẩu mới',
    error: 'Mật khẩu không hợp lệ',
    minLength: 8,
    maxLength: 100,
  }),
  password_confirmation: t.String({
    description: 'Xác nhận mật khẩu mới',
    error: 'Xác nhận mật khẩu không khớp',
  }),
});

export interface ResetPasswordDtoType extends Static<typeof ResetPasswordDto> {}
