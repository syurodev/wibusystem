/**
 * Auth service Vietnamese translations
 */
export const auth = {
  // Luồng xác thực
  login: {
    success: "Đăng nhập thành công",
    failed: "Đăng nhập thất bại",
    invalid_credentials: "Email hoặc mật khẩu không đúng",
    invalid_otp: "Mã OTP không hợp lệ",
    account_locked: "Tài khoản đã bị khóa",
    account_disabled: "Tài khoản đã bị vô hiệu hóa",
    too_many_attempts: "Quá nhiều lần thử sai. Vui lòng thử lại sau",
    session_expired: "Phiên đăng nhập của bạn đã hết hạn",
    username_or_password_incorrect: "Tên đăng nhập hoặc mật khẩu không đúng",
    user_not_found: "Tài khoản không tồn tại",
    user_not_verified: "Tài khoản chưa được xác thực",
    user_not_active: "Tài khoản chưa được kích hoạt",
    user_not_authorized: "Tài khoản không có quyền truy cập",
    user_not_authenticated: "Tài khoản chưa được xác thực",
  },

  logout: {
    success: "Đăng xuất thành công",
    failed: "Đăng xuất thất bại",
  },

  register: {
    success: "Đăng ký thành công",
    failed: "Đăng ký thất bại",
    email_exists: "Email đã được đăng ký",
    username_exists: "Tên đăng nhập đã được sử dụng",
    weak_password: "Mật khẩu quá yếu",
    terms_required: "Bạn phải chấp nhận điều khoản và điều kiện",
  },

  // Quản lý mật khẩu
  password: {
    reset_sent: "Đã gửi email đặt lại mật khẩu",
    reset_success: "Đặt lại mật khẩu thành công",
    reset_failed: "Đặt lại mật khẩu thất bại",
    reset_expired: "Liên kết đặt lại mật khẩu đã hết hạn",
    change_success: "Đổi mật khẩu thành công",
    change_failed: "Đổi mật khẩu thất bại",
    current_incorrect: "Mật khẩu hiện tại không đúng",
    must_differ: "Mật khẩu mới phải khác mật khẩu hiện tại",
    requirements:
      "Mật khẩu phải có ít nhất 8 ký tự, 1 chữ hoa, 1 chữ thường và 1 số",
    invalid_otp: "Mã OTP không hợp lệ",
  },

  // Quản lý token
  token: {
    expired: "Token đã hết hạn",
    invalid: "Token không hợp lệ",
    missing: "Thiếu token xác thực",
    refresh_success: "Làm mới token thành công",
    refresh_failed: "Làm mới token thất bại",
    auth_failed: "Xác thực thất bại",
    auth_success: "Xác thực thành công",
  },

  // Xác thực 2 bước
  twoFactor: {
    enabled: "Đã bật xác thực 2 bước",
    disabled: "Đã tắt xác thực 2 bước",
    code_sent: "Đã gửi mã xác minh",
    code_invalid: "Mã xác minh không hợp lệ",
    code_expired: "Mã xác minh đã hết hạn",
    backup_codes_generated: "Đã tạo mã dự phòng",
  },

  // Xác minh tài khoản
  verification: {
    email_sent: "Đã gửi email xác minh",
    email_verified: "Xác minh email thành công",
    email_required: "Cần xác minh email",
    phone_sent: "Đã gửi SMS xác minh",
    phone_verified: "Xác minh số điện thoại thành công",
    code_invalid: "Mã xác minh không hợp lệ",
  },
} as const;
