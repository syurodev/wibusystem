/**
 * User management Vietnamese translations
 */
export const user = {
  // Thao tác CRUD
  create: {
    success: "Tạo người dùng thành công",
    failed: "Tạo người dùng thất bại",
  },

  update: {
    success: "Cập nhật người dùng thành công",
    failed: "Cập nhật người dùng thất bại",
    profile_success: "Cập nhật hồ sơ thành công",
    settings_success: "Cập nhật cài đặt thành công",
  },

  delete: {
    success: "Xóa người dùng thành công",
    failed: "Xóa người dùng thất bại",
    confirm: "Bạn có chắc chắn muốn xóa người dùng này?",
    cannot_delete_self: "Bạn không thể xóa tài khoản của chính mình",
    has_dependencies: "Không thể xóa người dùng có dữ liệu liên quan",
  },

  // Trạng thái người dùng
  status: {
    activated: "Tài khoản đã được kích hoạt",
    deactivated: "Tài khoản đã được vô hiệu hóa",
    suspended: "Tài khoản đã bị tạm khóa",
    banned: "Tài khoản đã bị cấm",
    verified: "Tài khoản đã được xác minh",
  },

  // Thông tin người dùng
  profile: {
    not_found: "Không tìm thấy hồ sơ người dùng",
    incomplete: "Thông tin hồ sơ chưa đầy đủ",
    avatar_updated: "Cập nhật ảnh đại diện thành công",
    avatar_removed: "Xóa ảnh đại diện thành công",
  },

  // Quyền và vai trò
  permissions: {
    granted: "Cấp quyền thành công",
    revoked: "Thu hồi quyền thành công",
    insufficient: "Không đủ quyền",
    role_assigned: "Gán vai trò thành công",
    role_removed: "Xóa vai trò thành công",
  },

  // Tùy chọn người dùng
  preferences: {
    updated: "Cập nhật tùy chọn thành công",
    reset: "Đặt lại tùy chọn về mặc định",
    language_changed: "Cập nhật ngôn ngữ thành công",
    timezone_changed: "Cập nhật múi giờ thành công",
    notifications_updated: "Cập nhật cài đặt thông báo thành công",
  },

  // Validation cho dữ liệu người dùng
  validation: {
    username_required: "Tên đăng nhập là bắt buộc",
    username_taken: "Tên đăng nhập đã được sử dụng",
    username_invalid: "Tên đăng nhập chứa ký tự không hợp lệ",
    email_required: "Email là bắt buộc",
    email_taken: "Email đã được đăng ký",
    phone_invalid: "Định dạng số điện thoại không hợp lệ",
    birthdate_invalid: "Ngày sinh không hợp lệ",
    age_requirement: "Phải đủ 18 tuổi trở lên",
  },
} as const;
