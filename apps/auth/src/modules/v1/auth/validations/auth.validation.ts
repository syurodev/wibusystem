/**
 * @file Validation schemas cho Auth module.
 * @author Your Name
 */
import { t } from "elysia";

/**
 * Schema validate cho đăng ký tài khoản
 */
export const RegisterUserSchema = t.Object(
  {
    email: t.String({
      format: "email",
      error: "Email không hợp lệ",
    }),
    password: t.String({
      minLength: 8,
      error: "Mật khẩu phải có ít nhất 8 ký tự",
    }),
    full_name: t.Optional(
      t.String({
        minLength: 1,
        error: "Họ tên không được để trống",
      })
    ),
  },
  {
    error: "Thông tin đăng ký không hợp lệ",
  }
);

/**
 * Schema validate cho đăng nhập
 */
export const LoginUserSchema = t.Object(
  {
    email: t.String({
      format: "email",
      error: "Email không hợp lệ",
    }),
    password: t.String({
      minLength: 1,
      error: "Mật khẩu không được để trống",
    }),
  },
  {
    error: "Thông tin đăng nhập không hợp lệ",
  }
);

/**
 * Schema validate cho refresh token
 */
export const RefreshTokenSchema = t.Object(
  {
    refresh_token: t.String({
      minLength: 1,
      error: "Refresh token không được để trống",
    }),
  },
  {
    error: "Refresh token không hợp lệ",
  }
);

/**
 * Schema validate cho quên mật khẩu
 */
export const ForgotPasswordSchema = t.Object(
  {
    email: t.String({
      format: "email",
      error: "Email không hợp lệ",
    }),
  },
  {
    error: "Email không hợp lệ",
  }
);

/**
 * Schema validate cho đặt lại mật khẩu
 */
export const ResetPasswordSchema = t.Object(
  {
    email: t.String({
      format: "email",
      error: "Email không hợp lệ",
    }),
    otp: t.String({
      minLength: 6,
      maxLength: 6,
      pattern: "^[0-9]{6}$",
      error: "OTP phải là 6 chữ số",
    }),
    new_password: t.String({
      minLength: 8,
      error: "Mật khẩu mới phải có ít nhất 8 ký tự",
    }),
  },
  {
    error: "Thông tin đặt lại mật khẩu không hợp lệ",
  }
);

// Thêm các schema khác nếu cần
