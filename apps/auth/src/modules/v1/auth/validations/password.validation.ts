import { t } from 'elysia';

/**
 * Schema cho quên mật khẩu
 */
export const ForgotPasswordSchema = t.Object(
  {
    email: t.String({
      format: 'email',
      error: 'Email không hợp lệ',
    }),
  },
  {
    error: 'Dữ liệu không hợp lệ',
  }
);

/**
 * Schema cho xác thực OTP
 */
export const VerifyOtpSchema = t.Object(
  {
    email: t.String({
      format: 'email',
      error: 'Email không hợp lệ',
    }),
    otp: t.String({
      minLength: 6,
      maxLength: 6,
      pattern: '^[0-9]{6}$',
      error: 'OTP phải là 6 chữ số',
    }),
  },
  {
    error: 'Dữ liệu không hợp lệ',
  }
);

/**
 * Schema cho đặt lại mật khẩu
 */
export const ResetPasswordSchema = t.Object(
  {
    email: t.String({
      format: 'email',
      error: 'Email không hợp lệ',
    }),
    otp: t.String({
      minLength: 6,
      maxLength: 6,
      pattern: '^[0-9]{6}$',
      error: 'OTP phải là 6 chữ số',
    }),
    new_password: t.String({
      minLength: 8,
      error: 'Mật khẩu mới phải có ít nhất 8 ký tự',
    }),
    confirm_password: t.String({
      minLength: 8,
      error: 'Xác nhận mật khẩu không khớp',
    }),
  },
  {
    error: 'Dữ liệu không hợp lệ',
  }
);

/**
 * Schema cho thay đổi mật khẩu
 */
export const ChangePasswordSchema = t.Object(
  {
    current_password: t.String({
      minLength: 1,
      error: 'Mật khẩu hiện tại không được để trống',
    }),
    new_password: t.String({
      minLength: 8,
      error: 'Mật khẩu mới phải có ít nhất 8 ký tự',
    }),
    confirm_password: t.String({
      minLength: 8,
      error: 'Xác nhận mật khẩu không khớp',
    }),
  },
  {
    error: 'Dữ liệu không hợp lệ',
  }
);
