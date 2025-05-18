/**
 * @file Định nghĩa các enums đặc thù cho auth-service.
 * @author Your Name
 */

// Ví dụ: Enum cho trạng thái tài khoản nếu cần
// export enum AccountStatus {
//   PENDING_VERIFICATION = 0,
//   ACTIVE = 1,
//   SUSPENDED = 2,
//   DEACTIVATED = 3,
// }

// Các enums khác dùng chung nên được lấy từ @repo/common/enums
// Nếu có enums rất đặc thù chỉ auth-service dùng thì định nghĩa ở đây.
// Hiện tại để trống hoặc chỉ chứa ví dụ.

/**
 * Enum định nghĩa các trạng thái tài khoản người dùng
 */
export enum AccountStatus {
  INACTIVE = 0, // Tài khoản chưa kích hoạt (mới đăng ký)
  ACTIVE = 1, // Tài khoản đang hoạt động bình thường
  LOCKED = 2, // Tài khoản bị khóa (do vi phạm chính sách hoặc quản trị viên khóa)
  SUSPENDED = 3, // Tài khoản bị tạm ngưng (có thể tự động mở lại sau một thời gian)
  DELETED = 4, // Tài khoản đã bị xóa
}

/**
 * Enum định nghĩa các trạng thái của Refresh Token
 */
export enum TokenStatus {
  INACTIVE = 0, // Token không còn hiệu lực (đã bị thu hồi hoặc đã sử dụng để refresh)
  ACTIVE = 1, // Token đang hoạt động
  REVOKED = 2, // Token đã bị thu hồi (do đăng xuất hoặc bảo mật)
}

/**
 * Enum định nghĩa các trạng thái của OTP
 */
export enum OtpStatus {
  UNUSED = 0, // OTP chưa được sử dụng
  USED = 1, // OTP đã được sử dụng
}

/**
 * Enum định nghĩa các loại lỗi của auth-service
 */
export enum AuthErrorType {
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  USER_ALREADY_EXISTS = "USER_ALREADY_EXISTS",
  USER_NOT_FOUND = "USER_NOT_FOUND",
  INVALID_TOKEN = "INVALID_TOKEN",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  INVALID_OTP = "INVALID_OTP",
}

/**
 * Enum định nghĩa các quyền mặc định
 */
export enum DefaultRoles {
  ADMIN = "admin",
  USER = "user",
  GUEST = "guest",
}

export {}; // Đảm bảo file là một module
