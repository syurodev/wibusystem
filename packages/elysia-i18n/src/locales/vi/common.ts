/**
 * Common Vietnamese translations - Dùng chung cho tất cả service
 */
export const common = {
  // Thông báo thành công chung
  success: {
    general: "Thành công",
    create: "Tạo mới thành công",
    update: "Cập nhật thành công",
    delete: "Xóa thành công",
    fetch: "Lấy dữ liệu thành công",
    save: "Lưu thành công",
    submit: "Gửi thành công",
    process: "Xử lý thành công",
  },

  // Thông báo lỗi chung
  error: {
    general: "Đã có lỗi xảy ra",
    not_found: "Không tìm thấy dữ liệu",
    unauthorized: "Không có quyền truy cập",
    forbidden: "Bị cấm truy cập",
    validation: "Dữ liệu không hợp lệ",
    internal_server: "Lỗi server nội bộ",
    invalid_input: "Dữ liệu đầu vào không hợp lệ",
    missing_field: "Thiếu trường bắt buộc",
    duplicate_entry: "Dữ liệu đã tồn tại",
    network_error: "Lỗi kết nối mạng",
    timeout: "Hết thời gian chờ",
  },

  // Thông báo validation chung
  validation: {
    required_field: "Trường này là bắt buộc",
    email_invalid: "Định dạng email không hợp lệ",
    phone_invalid: "Định dạng số điện thoại không hợp lệ",
    url_invalid: "Định dạng URL không hợp lệ",
    min_length: "Tối thiểu {{count}} ký tự",
    max_length: "Tối đa {{count}} ký tự",
    min_value: "Giá trị tối thiểu là {{min}}",
    max_value: "Giá trị tối đa là {{max}}",
    field_invalid: "{{field}} không hợp lệ",
    format_invalid: "Định dạng không hợp lệ",
  },

  // Phân trang
  pagination: {
    showing_results:
      "Hiển thị {{from}} đến {{to}} trong tổng số {{total}} kết quả",
    no_results: "Không tìm thấy kết quả",
    page_not_found: "Không tìm thấy trang",
    items_per_page: "Số mục mỗi trang",
    go_to_page: "Đi đến trang",
    previous: "Trước",
    next: "Tiếp",
    first: "Đầu",
    last: "Cuối",
  },

  // Hành động chung
  actions: {
    save: "Lưu",
    cancel: "Hủy",
    submit: "Gửi",
    reset: "Đặt lại",
    search: "Tìm kiếm",
    filter: "Lọc",
    sort: "Sắp xếp",
    export: "Xuất",
    import: "Nhập",
    download: "Tải xuống",
    upload: "Tải lên",
    edit: "Sửa",
    delete: "Xóa",
    view: "Xem",
    back: "Quay lại",
    continue: "Tiếp tục",
    confirm: "Xác nhận",
  },
} as const;
