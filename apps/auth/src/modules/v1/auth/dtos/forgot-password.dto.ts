import { Static, t } from "elysia";

/**
 * DTO cho yêu cầu quên mật khẩu
 */
export const ForgotPasswordDto = t.Object({
  email: t.String({
    format: 'email',
    description: 'Email của tài khoản cần khôi phục mật khẩu',
    error: 'Email không hợp lệ',
  }),
});

export interface ForgotPasswordDtoType extends Static<typeof ForgotPasswordDto> {}
