import { Elysia } from 'elysia';
import { 
  ForgotPasswordSchema, 
  ResetPasswordSchema
} from '../validations';
import { AuthServiceApi } from '@repo/common';
import { passwordController } from '../controllers/password.controller';

// Lấy API definitions
const authApi = new AuthServiceApi('v1').getDefinition();

/**
 * Routes xử lý quên mật khẩu và đặt lại mật khẩu
 */
export const passwordRoutes = (app: Elysia) =>
  app
    // Gửi yêu cầu quên mật khẩu
    .post(
      authApi.auth.endpoints.AUTH_FORGOT_PASSWORD.subPath,
      async ({ body }) => {
        return passwordController.requestResetPassword(body.email);
      },
      {
        body: ForgotPasswordSchema,
        detail: {
          summary: 'Yêu cầu đặt lại mật khẩu',
          description: 'Gửi OTP qua email để xác thực đặt lại mật khẩu',
          tags: ['auth', 'password']
        }
      }
    )
    // Xác thực OTP và đặt lại mật khẩu được gộp thành một bước
    // Nên endpoint AUTH_VERIFY_OTP sẽ được xử lý trong AUTH_RESET_PASSWORD
    // Đặt lại mật khẩu mới
    .post(
      authApi.auth.endpoints.AUTH_RESET_PASSWORD.subPath,
      async ({ body }) => {
        return passwordController.resetPassword(
          body.email,
          body.otp,
          body.new_password
        );
      },
      {
        body: ResetPasswordSchema,
        detail: {
          summary: 'Đặt lại mật khẩu mới',
          description: 'Đặt lại mật khẩu mới sau khi xác thực OTP',
          tags: ['auth', 'password']
        }
      }
    );
