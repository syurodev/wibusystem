# Danh sách Công việc Còn Lại cho Auth Service

Dưới đây là danh sách chi tiết các công việc cần hoàn thành để triển khai `auth-service`, sau khi đã khởi tạo dự án, kết nối database và thực hiện migrations.

## Phase 1: Hoàn thiện Cấu trúc Dự án và Thiết lập Cơ bản

- [x] **Tạo cấu trúc thư mục và file còn thiếu:**
  - [x] `src/index.ts` (Entry point, khởi tạo Elysia app, áp dụng plugins, middlewares chung, import modules API)
  - [x] `src/middlewares/error.middleware.ts`
  - [x] `src/modules/v1/index.ts` (Gom các route của v1)
  - [x] `src/modules/v1/auth/controllers/auth.controller.ts`
  - [x] `src/modules/v1/auth/services/auth.service.ts`
  - [x] `src/modules/v1/auth/validations/auth.validation.ts`
  - [x] `src/modules/v1/users/controllers/user.controller.ts`
  - [x] `src/modules/v1/users/services/user.service.ts`
  - [x] `src/modules/v1/users/validations/user.validation.ts` (File `list-user-query-schema.ts` đã tồn tại)
  - [x] `src/modules/v1/sessions/controllers/session.controller.ts`
  - [x] `src/modules/v1/sessions/services/session.service.ts`
  - [x] `src/modules/v1/sessions/validations/session.validation.ts` (nếu cần)
  - [x] `src/plugins/jwt.plugin.ts` (Cấu hình @elysiajs/jwt)
  - [x] `src/plugins/swagger.plugin.ts` (Cấu hình @elysiajs/swagger)
  - [x] `src/repositories/user.repository.ts`
  - [x] `src/repositories/role.repository.ts` (nếu có quản lý role chi tiết)
  - [x] `src/repositories/permission.repository.ts` (nếu có quản lý permission chi tiết)
  - [x] `src/repositories/refresh-token.repository.ts` (Đã đổi tên từ `refreshToken.repository.ts`)
  - [x] `src/repositories/password-reset-otp.repository.ts` (Đã đổi tên từ `passwordResetOtp.repository.ts`)
  - [x] `src/repositories/types.ts`
  - [x] `src/types/enums.ts` (Nếu có enums đặc thù cho auth-service)
  - [x] `src/types/interfaces.ts` (Nếu có interfaces đặc thù cho auth-service)
  - [x] `src/utils/password.util.ts` (bcrypt helpers)
  - [x] `src/utils/token.util.ts` (JWT helpers)
- [x] **Hoàn thiện tích hợp Shared Packages:**
  - [x] Đảm bảo `@repo/common` (HttpStatusCode, MessageCode, Enums, response-formatter) được sử dụng nhất quán. (HttpStatusCode, MessageCode đã được sử dụng, MessageCode đã được cập nhật)
        (Ghi chú: Các biến môi trường nên được truy cập thông qua `src/configs/index.ts` mà bạn đã tạo, nơi chúng được load từ process.env. Các Enums, Types, utils dùng chung nên ưu tiên lấy từ `@repo/common` nếu có.)
  - [x] Sử dụng cấu hình API definitions đã được định nghĩa trong `packages/common/src/configs/api-definitions` khi xây dựng các controllers và định tuyến, đảm bảo tính nhất quán về đường dẫn, phương thức, và các yêu cầu truy cập. (Đã áp dụng cho auth, users, sessions controllers)

## Phase 2: Triển khai Module Xác thực (Auth Module)

- [x] **Repositories:**
  - [x] `user.repository.ts`:
    - [x] `createUser(data)`
    - [x] `findUserByEmail(email)`
    - [x] `findUserById(id)`
    - [x] `updateUserPassword(userId, newPasswordHash)`
    - [x] `updateUserProfile(userId, data)`
  - [ ] `refresh-token.repository.ts`:
    - [x] `createToken(data)` (Tương ứng với `save` method trong BaseRepository và được dùng trong AuthService)
    - [x] `findTokenByHash(tokenHash)` (Đã triển khai là `findByHash`)
    - [x] `findTokenById(id)` (Kế thừa từ BaseRepository)
    - [x] `getTokensByUserId(userId, onlyActive)` (Đã triển khai là `findByUserId`)
    - [x] `markTokenAsInactive(tokenId)` (Đã triển khai là `markAsInactive`)
    - [x] `markTokenFamilyAsInactive(familyId)`
    - [x] `deleteExpiredTokens()` (cho cron job sau này)
  - [ ] `password-reset-otp.repository.ts`:
    - [x] `createOtp(data)` (Tương ứng với `save` method và được dùng trong AuthService)
    - [x] `findOtpByHashAndUser(otpHash, userId)` (Đã triển khai là `findByHashAndUser`)
    - [x] `markOtpAsUsed(otpId)` (Đã triển khai là `markAsUsed`)
    - [x] `deleteExpiredOtps()` (cho cron job sau này)
- [x] **Auth Service (`auth.service.ts`):**
  - [x] `register(data)`: Kiểm tra email, hash password, tạo user, (tùy chọn: gán role).
  - [x] `login(email, password)`: Tìm user, so sánh password, tạo Access & Refresh Token, lưu Refresh Token.
  - [x] `refreshToken(token)`: Xác thực Refresh Token, thực hiện Refresh Token Rotation, vô hiệu hóa token cũ, tạo cặp token mới.
  - [x] `logout(refreshToken)`: Vô hiệu hóa Refresh Token.
  - [x] `requestPasswordReset(email)`: Tạo OTP, lưu OTP hash, (MVP: trả OTP hardcoded).
  - [x] `resetPassword(email, otp, newPassword)`: Xác thực OTP, hash password mới, cập nhật user, đánh dấu OTP đã dùng.
- [x] **Validation Schemas (`auth.validation.ts` với Elysia `t`):**
  - [x] `RegisterUserSchema`
  - [x] `LoginUserSchema`
  - [x] `RefreshTokenSchema`
  - [x] `ForgotPasswordSchema`
  - [x] `ResetPasswordSchema`
- [x] **Auth Controller (`auth.controller.ts`):**
  - [x] Route `POST /register`
  - [x] Route `POST /login`
  - [x] Route `POST /refresh-token`
  - [x] Route `POST /logout`
  - [x] Route `POST /forgot-password`
  - [x] Route `POST /reset-password`

## Phase 3: Triển khai Module Quản lý Người dùng (User Module)

- [x] **User Service (`user.service.ts`):**
  - [x] `getUserProfile(userId)`
  - [x] `updateUserProfile(userId, data)`
- [x] **Validation Schemas (`user.validation.ts`):**
  - [x] `UpdateUserProfileSchema`
- [x] **User Controller (`user.controller.ts`):**
  - [x] Route `GET /me`
  - [x] Route `PUT /me`

## Phase 4: Triển khai Module Quản lý Phiên (Session Module)

- [x] **Session Service (`session.service.ts`):**
  - [x] `getActiveSessions(userId)`: Lấy danh sách refresh tokens đang hoạt động.
  - [x] `revokeSession(userId, refreshTokenIdToRevoke)`: Thu hồi một refresh token.
  - [x] `revokeAllOtherSessions(userId, currentRefreshTokenFamilyId)`: Thu hồi tất cả refresh token khác.
- [x] **Validation Schemas (`session.validation.ts`):** (Nếu cần, ví dụ cho path params)
- [x] **Session Controller (`session.controller.ts`):**
  - [x] Route `GET /`
  - [x] Route `DELETE /:sessionId`
  - [x] Route `DELETE /all-others`

## Phase 5: Hoàn thiện và Tích hợp

- [x] **Middlewares:**
  - [x] `error.middleware.ts`: Hoàn thiện xử lý lỗi tập trung, format response lỗi.
- [x] **Plugins:**
  - [x] `jwt.plugin.ts`: Cấu hình đầy đủ `@elysiajs/jwt` (secrets, expiration times từ `src/configs/index.ts`).
  - [x] `swagger.plugin.ts`: Cấu hình `@elysiajs/swagger` để sinh tài liệu API.
- [ ] **gRPC Server (Nếu có trong MVP):**
  - [ ] Thiết lập `AuthValidatorService` dựa trên Protobuf từ `@repo/grpc`.
- [ ] **Cấu hình Môi trường:**
  - [ ] Hoàn thiện file `.env.example` với tất cả các biến cần thiết.
  - [ ] Kiểm tra việc load cấu hình từ `src/configs/index.ts` là chính xác.
- [ ] **Logging:**
  - [ ] Tích hợp thư viện logging (ví dụ: `pino`).
  - [ ] Thêm logging cho request/response, các sự kiện quan trọng và lỗi.
- [ ] **Testing:**
  - [ ] Viết Unit Tests cho Services và Utils.
  - [ ] Viết Integration Tests cho API Endpoints.
- [ ] **Documentation:**
  - [ ] Cập nhật `README.md` của `auth-service` với hướng dẫn cài đặt, chạy dự án, và mô tả API.
  - [ ] Đảm bảo JSDoc được viết cho các thành phần quan trọng.
  - [ ] Kiểm tra và hoàn thiện tài liệu Swagger.

---

Hãy đánh dấu tick vào các mục khi bạn hoàn thành chúng!
