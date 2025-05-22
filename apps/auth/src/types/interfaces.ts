/**
 * @file Định nghĩa các interfaces đặc thù cho auth-service.
 * @author Your Name
 */

// Ví dụ: Interface cho payload của JWT
export interface JwtPayload {
  sub: string; // User ID
  // email: string; // Có thể thêm email hoặc các thông tin khác
  // roles?: string[]; // Vai trò nếu có
  [key: string]: any; // Cho phép các claim khác
}

// Ví dụ: Interface cho một User object trả về cho client (public data)
export interface UserPublicProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: Date;
  // Không bao gồm password_hash hay các thông tin nhạy cảm khác
}

// Các interfaces khác dùng chung nên được lấy từ @repo/common/types
// Nếu có interfaces rất đặc thù chỉ auth-service dùng thì định nghĩa ở đây.

/**
 * Interface cho payload của JWT access token
 */
export interface AccessTokenPayload {
  sub: string; // subject (user ID)
  roles?: string[]; // danh sách roles của user
  permissions?: string[]; // danh sách permissions của user
  type: "access"; // loại token
  iat: number; // issued at (thời gian tạo)
  exp: number; // expiration time
}

/**
 * Interface cho payload của JWT refresh token
 */
export interface RefreshTokenPayload {
  sub: string; // subject (user ID)
  jti: string; // JWT ID (token ID)
  fid: string; // family ID
  type: "refresh"; // loại token
  iat: number; // issued at (thời gian tạo)
  exp: number; // expiration time
}

/**
 * Interface cho context API để sử dụng cho middleware bên trong routes
 */
export interface AuthContext {
  user?: {
    id: string;
    roles?: string[];
    permissions?: string[];
  };
}

/**
 * Interface cho kết quả đăng ký
 */
export interface RegisterResult {
  success: boolean;
  message: string;
  user?: {
    id: string | number;
    email: string;
    full_name?: string;
  };
}

/**
 * Interface cho kết quả đăng nhập
 */
export interface LoginResult {
  success: boolean;
  message: string;
  access_token?: string;
  refresh_token?: string;
  user?: {
    id: string | number;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
}

/**
 * Interface cho kết quả refresh token
 */
export interface RefreshTokenResult {
  success: boolean;
  message: string;
  access_token?: string;
  refresh_token?: string;
}

/**
 * Interface cho thông tin session
 */
export interface SessionInfo {
  id: number | bigint;
  created_at: number;
  expires_at: number;
  ip_address?: string;
  user_agent?: string;
  is_current: boolean;
}

export {}; // Đảm bảo file là một module nếu không có export nào khác
