/**
 * Auth service English translations
 */
export const auth = {
  // Authentication flows
  login: {
    success: "Login successful",
    failed: "Login failed",
    invalid_credentials: "Invalid email or password",
    invalid_otp: "Invalid OTP",
    account_locked: "Account has been locked",
    account_disabled: "Account has been disabled",
    too_many_attempts: "Too many failed attempts. Try again later",
    session_expired: "Your session has expired",
    username_or_password_incorrect: "Username or password is incorrect",
    user_not_found: "User not found",
    user_not_verified: "User not verified",
    user_not_active: "User not active",
    user_not_authorized: "User not authorized",
    user_not_authenticated: "User not authenticated",
  },

  logout: {
    success: "Logout successful",
    failed: "Logout failed",
  },

  register: {
    success: "Registration successful",
    failed: "Registration failed",
    email_exists: "Email already registered",
    username_exists: "Username already taken",
    weak_password: "Password is too weak",
    terms_required: "You must accept terms and conditions",
  },

  // Password management
  password: {
    reset_sent: "Password reset email sent",
    reset_success: "Password reset successful",
    reset_failed: "Password reset failed",
    reset_expired: "Password reset link has expired",
    change_success: "Password changed successfully",
    change_failed: "Password change failed",
    current_incorrect: "Current password is incorrect",
    must_differ: "New password must be different from current",
    requirements:
      "Password must contain at least 8 characters, 1 uppercase, 1 lowercase, and 1 number",
    invalid_otp: "Invalid OTP",
  },

  // Token management
  token: {
    expired: "Token has expired",
    invalid: "Invalid token",
    missing: "Authentication token is missing",
    refresh_success: "Token refreshed successfully",
    refresh_failed: "Token refresh failed",
    auth_failed: "Authentication failed",
    auth_success: "Authentication successful",
  },

  // Two-factor authentication
  twoFactor: {
    enabled: "Two-factor authentication enabled",
    disabled: "Two-factor authentication disabled",
    code_sent: "Verification code sent",
    code_invalid: "Invalid verification code",
    code_expired: "Verification code has expired",
    backup_codes_generated: "Backup codes generated",
  },

  // Account verification
  verification: {
    email_sent: "Verification email sent",
    email_verified: "Email verified successfully",
    email_required: "Email verification required",
    phone_sent: "Verification SMS sent",
    phone_verified: "Phone number verified successfully",
    code_invalid: "Invalid verification code",
  },
} as const;
