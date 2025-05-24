# Protocol Buffers

Thư mục này chứa các định nghĩa Protocol Buffers (proto) được chia sẻ giữa các service trong hệ thống, cùng với các type TypeScript được sinh ra từ chúng.

## Danh sách Proto hiện có

- `auth.proto`: Định nghĩa service và message cho xác thực người dùng
  - Package: `com.wibu.auth`
  - Service: `AuthService`
  - Methods: `ValidateToken`

## Thêm mới hoặc cập nhật Proto

1. Đặt file `.proto` vào thư mục này
2. Chạy lệnh để sinh mã TypeScript:
   ```bash
   npm run gen:proto
   ```
3. Cập nhật `index.ts` để export các đường dẫn và package name

## Quy ước đặt tên Proto

- Sử dụng package name theo format: `com.wibu.<service-name>`
- Đặt tên service với hậu tố `Service`, ví dụ: `AuthService`
- Đặt tên message request với hậu tố `Request`, ví dụ: `ValidateTokenRequest`
- Đặt tên message response với hậu tố `Response`, ví dụ: `ValidateTokenResponse`
