# Work Log – Triển khai chức năng đăng ký user (21/05/2025)

## 1. Mục tiêu
- Xây dựng API đăng ký tài khoản user theo chuẩn best-practice của Elysia.js.
- Áp dụng chuẩn hóa code, phân lớp rõ ràng (DTO, Validation, Repository, Service, Controller).

## 2. Các bước thực hiện

### 2.1. Định nghĩa DTO & Validation
- **Tạo file:** `dtos/register-user.dto.ts` – Định nghĩa interface `RegisterUserDto`.
- **Tạo file:** `validations/register-user.validation.ts` – Định nghĩa schema xác thực input đăng ký.
- **Cập nhật:** `dtos/index.ts`, `validations/index.ts` để export các thành phần mới.

### 2.2. Repository
- **Tạo file:** `repositories/user.repository.ts` – Kế thừa `BaseRepository`, bổ sung các hàm:
  - `findByEmail`, `existsByEmail`, `findByUsername`.

### 2.3. Service
- **Sửa file:** `services/auth.service.ts` – Cài đặt hàm `registerUser`:
  - Kiểm tra email đã tồn tại.
  - Hash password với bcrypt.
  - Lưu user mới vào DB với trạng thái INACTIVE.
  - Trả về user vừa tạo.

### 2.4. Controller
- **Sửa file:** `controllers/auth.controller.ts` – Thêm endpoint `POST /auth/register`:
  - Validate input.
  - Gọi service đăng ký user.
  - Xử lý lỗi chuẩn REST (409 nếu email đã tồn tại, 400 nếu lỗi khác).

### 2.5. Module binding
- **Tạo file:** `auth/index.ts` – Hàm `registerAuthV1Routes` để đăng ký route vào Elysia group.
- **Sửa file:** `v1/index.ts` – Mount group `/auth` và chuẩn hóa trả về instance Elysia đúng best-practice.

## 3. Best Practice đã áp dụng
- Phân lớp rõ ràng: Controller – Service – Repository – DTO – Validation.
- Không chứa business logic trong controller.
- Validation input chuẩn hóa với Elysia `t.Object`.
- Xử lý lỗi rõ ràng, trả về mã lỗi và message chuẩn REST.
- Không trả về trường nhạy cảm (hashedPassword) cho FE.
- Sử dụng group route và module hóa theo chuẩn Elysia.

## 4. Đề xuất tiếp theo
- Bổ sung xác thực email (gửi mail xác nhận).
- Thêm kiểm tra trùng username nếu cần.
- Viết unit test cho flow đăng ký.

---
**Log tự động bởi AI – mọi thay đổi đều đã commit vào codebase.**
