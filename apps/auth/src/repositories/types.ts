/**
 * @file Định nghĩa các kiểu dữ liệu chung cho Repositories.
 * @author Your Name
 */

// Ví dụ: Kiểu dữ liệu cho việc tạo User (sẽ được chi tiết hóa sau dựa trên schema)
export interface CreateUserData {
  email: string;
  password_hash: string;
  full_name?: string;
  // Thêm các trường khác từ schema usersTable
}

// Ví dụ: Kiểu dữ liệu cho việc cập nhật User
export interface UpdateUserData {
  full_name?: string;
  avatar_url?: string;
  // Thêm các trường khác có thể cập nhật
}

// Ví dụ: Kiểu dữ liệu cho việc tạo Refresh Token
export interface CreateRefreshTokenData {
  user_id: string;
  token_hash: string;
  family_id: string;
  expires_at: Date;
  // Thêm các trường khác từ schema refreshTokensTable
}

// Ví dụ: Kiểu dữ liệu cho việc tạo Password Reset OTP
export interface CreatePasswordResetOtpData {
  user_id: string;
  otp_hash: string;
  expires_at: Date;
  // Thêm các trường khác từ schema passwordResetOtpsTable
}

// Thêm các kiểu dữ liệu chung khác nếu cần
