export interface PasswordResetRequest {
  email: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface PasswordResetConfirm {
  email: string;
  otp: string;
  newPassword: string;
}

export interface PasswordService {
  requestReset(email: string): Promise<{ success: boolean; message: string }>;
  resetPassword(
    email: string,
    otp: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }>;
}
