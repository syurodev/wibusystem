export enum ApiAccessibilityEnum {
  PUBLIC, // Không cần token, ai cũng có thể truy cập
  OPTIONAL, // Có thể có hoặc không có token (ví dụ: xem sản phẩm, nếu có token thì thêm thông tin cá nhân hóa)
  PROTECTED, // Bắt buộc phải có token hợp lệ
}
