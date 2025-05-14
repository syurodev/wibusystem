# Tài liệu Thiết kế Kỹ thuật: Dịch vụ Xác thực và Quản lý Người dùng (Auth Service)

**Phiên bản:** 1.0
**Ngày tạo:** {{CURRENT_DATE}}
**Người tạo:** AI Assistant (với sự đóng góp của USER)

---

## 1. Giới thiệu

### 1.1. Mục đích

Tài liệu này mô tả thiết kế kỹ thuật chi tiết cho Dịch vụ Xác thực và Quản lý Người dùng (Auth Service). Mục tiêu là cung cấp một nền tảng xác thực an toàn, hiệu quả và có khả năng mở rộng cho các ứng dụng trong hệ thống.

### 1.2. Phạm vi

**Trong phạm vi (MVP - Giai đoạn 1):**

- Đăng ký tài khoản mới (email/mật khẩu).
- Đăng nhập (email/mật khẩu).
- Đăng xuất (vô hiệu hóa token/session).
- Làm mới token (Refresh token).
- Quên mật khẩu và đặt lại mật khẩu (MVP: sử dụng OTP hardcoded "111111", sẽ tích hợp gửi OTP qua email sau).
- Xem thông tin cá nhân (User Profile).
- Cập nhật thông tin cá nhân.
- Quản lý phiên đăng nhập (xem và thu hồi).

**Ngoài phạm vi (Giai đoạn sau):**

- Xác minh email sau đăng ký.
- Đăng nhập bằng mạng xã hội (Social Login).
- Xác thực đa yếu tố (MFA - TOTP, SMS OTP).
- Quản lý Tổ chức/Đội nhóm.
- Tích hợp gửi email cho các thông báo (xác thực, quên mật khẩu).
- API Keys.
- Audit logging chi tiết.

### 1.3. Tổng quan về dịch vụ

- **Tên dịch vụ:** `auth-service`
- **Mô tả:** `auth-service` là một dịch vụ backend chịu trách nhiệm quản lý danh tính người dùng, bao gồm quá trình đăng ký, đăng nhập, quản lý phiên và thông tin cá nhân. Dịch vụ này sẽ sử dụng Elysia.js, PostgreSQL (thông qua Drizzle ORM) và Redis.

### 1.4. Thuật ngữ và Từ viết tắt

- **JWT:** JSON Web Token
- **API:** Application Programming Interface
- **DB:** Database
- **ORM:** Object-Relational Mapping
- **OTP:** One-Time Password
- **MFA:** Multi-Factor Authentication
- **MVP:** Minimum Viable Product
- **MESSAGE_CODE:** Mã định danh cho thông điệp API (ví dụ: `OPERATION_SUCCESS`, `VALIDATION_ERROR`), tham chiếu `ErrorCodeEnum` từ `@repo/common`.
- **Unix Timestamp:** Số giây kể từ Unix Epoch (1 tháng 1 năm 1970, 00:00:00 UTC), lưu trữ dạng `bigint`.
- **@repo/common:** Package dùng chung chứa types, enums, constants, và utilities.
- **@repo/config:** Package quản lý cấu hình tập trung.
- **@repo/grpc:** Package quản lý định nghĩa Protobuf và mã gRPC client/server.

---

## 2. Yêu cầu

### 2.1. Yêu cầu chức năng

- **UC-AUTH-001: Đăng ký tài khoản**
  - Người dùng có thể đăng ký tài khoản mới bằng email và mật khẩu.
  - Mật khẩu phải được hash trước khi lưu trữ.
  - Email phải là duy nhất.
- **UC-AUTH-002: Đăng nhập tài khoản**
  - Người dùng có thể đăng nhập bằng email và mật khẩu đã đăng ký.
  - Sau khi đăng nhập thành công, hệ thống trả về Access Token và Refresh Token.
- **UC-AUTH-003: Đăng xuất**
  - Người dùng có thể đăng xuất khỏi tài khoản.
  - Refresh Token liên quan đến phiên đăng xuất phải bị vô hiệu hóa.
- **UC-AUTH-004: Làm mới Access Token**
  - Khi Access Token hết hạn, người dùng có thể sử dụng Refresh Token hợp lệ để nhận Access Token mới.
- **UC-AUTH-005: Quản lý hồ sơ cá nhân**
  - Người dùng đã đăng nhập có thể xem thông tin cá nhân của mình.
  - Người dùng đã đăng nhập có thể cập nhật thông tin cá nhân (ví dụ: tên, avatar).
- **UC-AUTH-006: Quên mật khẩu (MVP - OTP Hardcoded)**
  - Người dùng có thể yêu cầu đặt lại mật khẩu nếu quên.
  - (Giai đoạn 1 - MVP) Hệ thống sẽ sử dụng một mã OTP hardcoded (ví dụ: "111111") để xác thực yêu cầu. OTP này sẽ được lưu tạm thời (ví dụ: trong Redis) liên kết với email của người dùng.
  - _(Ghi chú: Chức năng gửi OTP qua email thực tế sẽ được triển khai ở giai đoạn sau)._
- **UC-AUTH-007: Đặt lại mật khẩu (sử dụng OTP)**
  - Người dùng có thể sử dụng OTP hợp lệ (nhận được từ UC-AUTH-006) và email của mình để đặt mật khẩu mới.
- **UC-AUTH-008: Quản lý phiên đăng nhập**
  - Người dùng có thể xem danh sách các thiết bị/phiên đang hoạt động của mình.
  - Người dùng có thể thu hồi một phiên đăng nhập cụ thể hoặc tất cả các phiên khác.

### 2.2. Yêu cầu phi chức năng

- **Bảo mật:**
  - Mã hóa mật khẩu bằng bcrypt.
  - Sử dụng JWT với thuật toán HS256 (hoặc RS256 nếu có kế hoạch quản lý key phức tạp hơn).
  - Bảo vệ chống lại các tấn công phổ biến (XSS, CSRF, SQL Injection) thông qua các biện pháp của Elysia.js và Drizzle ORM.
  - Input validation nghiêm ngặt.
- **Hiệu năng:**
  - Thời gian phản hồi API trung bình < 200ms.
  - Khả năng xử lý ít nhất 100 requests/giây.
- **Khả năng mở rộng:** Thiết kế stateless để dễ dàng scale theo chiều ngang.
- **Tính sẵn sàng:** Mục tiêu 99.9% uptime.
- **Khả năng bảo trì:** Code rõ ràng, tuân thủ quy ước, dễ dàng mở rộng.

---

## 3. Kiến trúc Hệ thống

### 3.1. Tổng quan kiến trúc

Dịch vụ `auth-service` sẽ được xây dựng trên nền tảng Elysia.js, một framework web nhanh và nhẹ cho Bun. Dữ liệu người dùng và các thông tin liên quan sẽ được lưu trữ trong PostgreSQL, với Drizzle ORM làm lớp truy cập dữ liệu. Redis sẽ được sử dụng để lưu trữ session/refresh token và các dữ liệu cần truy cập nhanh khác.

**Tích hợp với Shared Packages:**

- **Cấu hình:** Toàn bộ cấu hình (biến môi trường cho DB, Redis, JWT, cổng server, etc.) sẽ được cung cấp bởi package `@repo/config`.
- **Thành phần dùng chung:** Các Types, Enums (ví dụ: `HttpStatusCodeEnum`, `ErrorCodeEnum`, `UserStatusEnum`, `RoleEnum`, `PermissionEnum`), Constants và Utility functions (ví dụ: API response formatters, date utilities) sẽ được sử dụng từ package `@repo/common`.
- **gRPC:** Định nghĩa Protobuf cho `AuthValidatorService` và các mã gRPC client/server liên quan sẽ được quản lý bởi package `@repo/grpc`. `Auth-service` sẽ implement gRPC server này.
- **Phát triển song song:** Trong quá trình triển khai `auth-service`, các cấu hình, kiểu dữ liệu, enums, hằng số, hoặc hàm tiện ích mới được xác định là có khả năng tái sử dụng cao sẽ được chủ động bổ sung vào các package `@repo/config` và `@repo/common` tương ứng.

```mermaid
graph LR
    Client[Client Application] -->|HTTPS API Requests| ELB[Load Balancer]
    ELB --> App1[Auth Service (Elysia.js)]
    ELB --> App2[Auth Service (Elysia.js)]
    ELB --> AppN[Auth Service (Elysia.js)]

    App1 --> Drizzle[Drizzle ORM]
    App2 --> Drizzle
    AppN --> Drizzle
    Drizzle --> Postgres[(PostgreSQL DB)]

    App1 --> Redis[(Redis)]
    App2 --> Redis
    AppN --> Redis

    subgraph "Auth Service Instances"
        App1
        App2
        AppN
    end
```

### 3.2. Các thành phần chính

- **Elysia.js Application:**
  - **Routes/Controllers:** Định nghĩa các API endpoints, nhận request, gọi services và trả về response.
  - **Services:** Chứa toàn bộ business logic của ứng dụng (xác thực, quản lý user, token).
  - **Repositories (thông qua Drizzle ORM):** Lớp trừu tượng để tương tác với PostgreSQL.
  - **Middlewares:**
    - `Auth Middleware`: Kiểm tra JWT trong header `Authorization` cho các protected routes.
    - `Error Handling Middleware`: Xử lý lỗi tập trung.
    - `Logging Middleware`: Ghi log request/response.
    - `Input Validation Middleware` (tích hợp sẵn trong Elysia.js với `t`): Validate request body, params, query.
  - **Plugins (Elysia.js):**
    - `@elysiajs/jwt`: Để tạo và xác minh JWT.
    - `@elysiajs/cookie`: Để xử lý cookies (nếu Refresh Token được lưu trong cookie).
    - `@elysiajs/swagger`: Để tự động tạo tài liệu API Swagger/OpenAPI.
- **PostgreSQL Database (với Drizzle ORM):**
  - Lưu trữ thông tin người dùng, mật khẩu đã hash, thông tin hồ sơ, và các dữ liệu liên quan khác.
  - Drizzle ORM sẽ được sử dụng để định nghĩa schema, thực hiện migrations, và truy vấn dữ liệu một cách an toàn và hiệu quả.
- **Redis:**
  - Lưu trữ danh sách các Refresh Token đang hoạt động hoặc bị thu hồi (để quản lý session và đăng xuất).
  - Có thể sử dụng cho caching (ví dụ: thông tin user ít thay đổi).
  - Lưu trữ token reset mật khẩu tạm thời.
  - Rate limiting.

### 3.3. Luồng dữ liệu (Ví dụ)

#### Luồng Đăng Nhập:

1.  Client gửi request `POST /api/v1/auth/login` với `email` và `password`.
2.  Elysia.js Controller nhận request, validate input.
3.  Controller gọi `AuthService.login(email, password)`.
4.  `AuthService` truy vấn `UserRepository` (Drizzle) để tìm user theo email.
5.  Nếu user tồn tại, `AuthService` so sánh hash của password gửi lên với hash trong DB bằng bcrypt.
6.  Nếu mật khẩu khớp:
    - Tạo Access Token (JWT, ngắn hạn) và Refresh Token (JWT hoặc opaque token, dài hạn).
    - Lưu thông tin Refresh Token (hoặc hash của nó) vào Redis cùng với `userId` và thời gian hết hạn.
    - Trả về Access Token và Refresh Token cho client.
7.  Nếu không thành công, trả về lỗi 401.

---

## 4. Thiết kế API

### 4.1. Nguyên tắc thiết kế

- RESTful API.
- Phiên bản API: `/api/v1/` (Theo `api-rule.mdc`).
- Định dạng dữ liệu: JSON.
- Sử dụng HTTP status codes chuẩn (tham chiếu `HttpStatusCodeEnum` từ `@repo/common`).
- **Định dạng Response API:** Tuân thủ cấu trúc chuẩn từ `api-rule.mdc` và sử dụng các API response formatter utilities từ `@repo/common/utils/api/response-formatter` để tạo response. Các `message_code` sẽ tham chiếu `ErrorCodeEnum` từ `@repo/common`.
- Tất cả các API yêu cầu xác thực sẽ yêu cầu `Authorization: Bearer <AccessToken>` header.

### 4.2. Xác thực và Ủy quyền API

- **Access Token (JWT):** Thời gian sống ngắn (ví dụ: 15 phút - 1 giờ). Chứa `userId` và có thể các thông tin cơ bản khác.
- **Refresh Token (JWT hoặc Opaque Token):** Thời gian sống dài (ví dụ: 7 ngày - 30 ngày). Được lưu trữ an toàn ở client (ví dụ: HTTPOnly cookie nếu là web, hoặc secure storage trên mobile) và hash của nó được lưu trong Redis phía server.
- Khi Access Token hết hạn, client gửi Refresh Token đến endpoint `/api/v1/auth/refresh-token` để nhận Access Token mới.
- **Refresh Token Rotation:** Để tăng cường bảo mật, mỗi khi một Refresh Token được sử dụng thành công để làm mới Access Token, Refresh Token đó sẽ bị vô hiệu hóa và một cặp Access Token mới cùng với một Refresh Token hoàn toàn mới sẽ được cấp lại. Client có trách nhiệm lưu trữ Refresh Token mới này cho lần sử dụng tiếp theo.

### 4.3. Định nghĩa Endpoints (MVP)

#### Resource: `Auth` (Path: `/api/v1/auth`)

1.  **Đăng ký người dùng mới**

    - **Endpoint:** `POST /register`
    - **Request Body:**
      ```json
      {
        "email": "user@example.com", // string, required, email format
        "password": "securePassword123", // string, required, min 8 chars
        "first_name": "John", // string, optional
        "last_name": "Doe" // string, optional
      }
      ```
    - **Response (201 Created):**
      ```json
      {
        "status": 201,
        "message_code": "USER_CREATED_SUCCESSFULLY",
        "message": "Người dùng đã được tạo thành công.",
        "data": {
          "id": "uuid-user-id",
          "email": "user@example.com",
          "first_name": "John",
          "last_name": "Doe",
          "created_ts": 1678886400 // Unix timestamp
        }
      }
      ```
    - **Response (400 Bad Request - Email đã tồn tại):**
      ```json
      {
        "status": 400,
        "message_code": "EMAIL_ALREADY_EXISTS",
        "message": "Địa chỉ email này đã được sử dụng.",
        "data": {}
      }
      ```
    - **Response (400 Bad Request - Lỗi validation):**
      ```json
      {
        "status": 400,
        "message_code": "VALIDATION_ERROR",
        "message": "Dữ liệu đầu vào không hợp lệ.",
        "data": {
          "errors": [
            // Chi tiết lỗi validation (ví dụ)
            {
              "field": "password",
              "message": "Mật khẩu phải có ít nhất 8 ký tự."
            }
          ]
        }
      }
      ```
    - **Response (500 Internal Server Error):**
      ```json
      {
        "status": 500,
        "message_code": "INTERNAL_SERVER_ERROR",
        "message": "Đã có lỗi xảy ra ở máy chủ.",
        "data": {}
      }
      ```

2.  **Đăng nhập**

    - **Endpoint:** `POST /login`
    - **Request Body:**
      ```json
      {
        "email": "user@example.com",
        "password": "securePassword123"
      }
      ```
    - **Response (200 OK):**
      ```json
      {
        "status": 200,
        "message_code": "LOGIN_SUCCESSFUL",
        "message": "Đăng nhập thành công.",
        "data": {
          "access_token": "jwt_access_token_string",
          "refresh_token": "jwt_refresh_token_string",
          "token_type": "Bearer",
          "expires_in": 3600 // Thời gian sống của access_token (giây)
        }
      }
      ```
    - **Response (401 Unauthorized - Sai thông tin):**
      ```json
      {
        "status": 401,
        "message_code": "INVALID_CREDENTIALS",
        "message": "Email hoặc mật khẩu không đúng.",
        "data": {}
      }
      ```
    - **Response (400 Bad Request - Lỗi validation):**
      ```json
      {
        "status": 400,
        "message_code": "VALIDATION_ERROR",
        "message": "Dữ liệu đầu vào không hợp lệ.",
        "data": {}
      }
      ```

3.  **Đăng xuất**

    - **Endpoint:** `POST /logout`
    - **Request Header:** `Authorization: Bearer <AccessToken>`
    - **Request Body:** (Tùy chọn, có thể chứa refresh_token nếu không dùng cookie)
      ```json
      {
        "refresh_token": "jwt_refresh_token_string" // Nếu không lưu refresh token trong HttpOnly cookie
      }
      ```
    - **Response (200 OK):**
      ```json
      {
        "status": 200,
        "message_code": "LOGOUT_SUCCESSFUL",
        "message": "Đăng xuất thành công.",
        "data": {}
      }
      ```
    - **Response (401 Unauthorized):**
      ```json
      {
        "status": 401,
        "message_code": "UNAUTHENTICATED",
        "message": "Token không hợp lệ hoặc đã hết hạn.",
        "data": {}
      }
      ```

4.  **Làm mới Access Token**

    - **Endpoint:** `POST /refresh-token`
    - **Mô tả:** Client gửi Refresh Token (`RT_old`) hiện tại. Nếu hợp lệ, server sẽ vô hiệu hóa `RT_old`, tạo ra một Access Token mới (`AT_new`) và một Refresh Token mới (`RT_new`), sau đó trả về cả hai cho client.
    - **Request Body:**
      ```json
      {
        "refresh_token": "jwt_refresh_token_string"
      }
      ```
    - **Response (200 OK):**
      ```json
      {
        "status": 200,
        "message_code": "TOKEN_REFRESHED_SUCCESSFULLY",
        "message": "Access token đã được làm mới thành công.",
        "data": {
          "access_token": "new_jwt_access_token_string",
          "refresh_token": "new_jwt_refresh_token_string", // Refresh Token mới
          "token_type": "Bearer",
          "expires_in": 3600
        }
      }
      ```
    - **Response (401 Unauthorized - Refresh Token không hợp lệ/đã bị thu hồi/đã sử dụng):**
      ```json
      {
        "status": 401,
        "message_code": "INVALID_REFRESH_TOKEN",
        "message": "Refresh token không hợp lệ hoặc đã được sử dụng.",
        "data": {}
      }
      ```

5.  **Yêu cầu Đặt lại Mật khẩu (MVP - OTP Hardcoded)**

    - **Endpoint:** `POST /forgot-password`
    - **Request Body:**
      ```json
      {
        "email": "user@example.com"
      }
      ```
    - **Response (200 OK):** (Trong MVP, OTP là hardcoded "111111" và được "gửi" giả lập)
      ```json
      {
        "status": 200,
        "message_code": "PASSWORD_RESET_OTP_SENT", // Thay đổi message_code
        "message": "Một mã OTP (hardcoded '111111' cho MVP) đã được 'gửi' để xác thực. Vui lòng sử dụng OTP này để đặt lại mật khẩu. Sẽ tích hợp gửi email OTP ở giai đoạn sau.",
        "data": {} // Không trả về token/OTP ở đây
      }
      ```
    - **Response (404 Not Found - Email không tồn tại):**
      ```json
      {
        "status": 404,
        "message_code": "EMAIL_NOT_FOUND",
        "message": "Không tìm thấy tài khoản với địa chỉ email này.",
        "data": {}
      }
      ```

6.  **Đặt lại Mật khẩu (sử dụng OTP)**
    - **Endpoint:** `POST /reset-password`
    - **Request Body:**
      ```json
      {
        "email": "user@example.com", // Thêm email để xác định người dùng
        "otp": "111111", // Thay reset_token bằng otp
        "new_password": "newSecurePassword456"
      }
      ```
    - **Response (200 OK):**
      ```json
      {
        "status": 200,
        "message_code": "PASSWORD_RESET_SUCCESSFUL",
        "message": "Mật khẩu đã được đặt lại thành công.",
        "data": {}
      }
      ```
    - **Response (400 Bad Request - OTP không hợp lệ/email không khớp/mật khẩu mới không đạt yêu cầu):**
      ```json
      {
        "status": 400,
        "message_code": "INVALID_OTP_OR_PASSWORD", // Thay đổi message_code
        "message": "OTP không hợp lệ, email không khớp hoặc mật khẩu mới không đáp ứng yêu cầu.",
        "data": {}
      }
      ```

#### Resource: `Users` (Path: `/api/v1/users`)

1.  **Lấy thông tin người dùng hiện tại**

    - **Endpoint:** `GET /me`
    - **Request Header:** `Authorization: Bearer <AccessToken>`
    - **Response (200 OK):**
      ```json
      {
        "status": 200,
        "message_code": "USER_PROFILE_FETCHED",
        "message": "Lấy thông tin người dùng thành công.",
        "data": {
          "id": "uuid-user-id",
          "email": "user@example.com",
          "first_name": "John",
          "last_name": "Doe",
          "avatar_url": "url_to_avatar",
          "created_ts": 1678886400, // Unix timestamp
          "updated_ts": 1678886400 // Unix timestamp
        }
      }
      ```
    - **Response (401 Unauthorized):**
      ```json
      {
        "status": 401,
        "message_code": "UNAUTHENTICATED",
        "message": "Token không hợp lệ hoặc đã hết hạn.",
        "data": {}
      }
      ```

2.  **Cập nhật thông tin người dùng hiện tại**
    - **Endpoint:** `PUT /me`
    - **Request Header:** `Authorization: Bearer <AccessToken>`
    - **Request Body:**
      ```json
      {
        "first_name": "Jane", // optional
        "last_name": "Doer", // optional
        "avatar_url": "new_url_to_avatar" // optional
      }
      ```
    - **Response (200 OK):** (Thông tin user đã cập nhật)
      ```json
      {
        "status": 200,
        "message_code": "USER_PROFILE_UPDATED",
        "message": "Cập nhật thông tin người dùng thành công.",
        "data": {
          "id": "uuid-user-id",
          "email": "user@example.com",
          "first_name": "Jane",
          "last_name": "Doer",
          "avatar_url": "new_url_to_avatar",
          "created_ts": 1678886400,
          "updated_ts": 1678886405 // Unix timestamp mới
        }
      }
      ```
    - **Response (400 Bad Request - Lỗi validation):**
      ```json
      {
        "status": 400,
        "message_code": "VALIDATION_ERROR",
        "message": "Dữ liệu cập nhật không hợp lệ.",
        "data": {}
      }
      ```
    - **Response (401 Unauthorized):**
      ```json
      {
        "status": 401,
        "message_code": "UNAUTHENTICATED",
        "message": "Token không hợp lệ hoặc đã hết hạn.",
        "data": {}
      }
      ```

#### Resource: `Sessions` (Path: `/api/v1/sessions`)

1.  **Lấy danh sách các phiên đang hoạt động**

    - **Endpoint:** `GET /`
    - **Request Header:** `Authorization: Bearer <AccessToken>`
    - **Response (200 OK):**
      ```json
      {
        "status": 200,
        "message_code": "SESSIONS_FETCHED_SUCCESSFULLY",
        "message": "Lấy danh sách phiên hoạt động thành công.",
        "data": {
          "list": [
            {
              "session_id": "redis_session_key_or_refresh_token_id",
              "ip_address": "192.168.1.10",
              "user_agent": "Chrome/90.0.4430.93",
              "last_active_ts": 1678887000, // Unix timestamp
              "created_ts": 1678886400 // Unix timestamp
            }
          ],
          "total_record": 1, // Ví dụ
          "total_page": 1 // Ví dụ
        }
      }
      ```
    - **Response (401 Unauthorized):**
      ```json
      {
        "status": 401,
        "message_code": "UNAUTHENTICATED",
        "message": "Token không hợp lệ hoặc đã hết hạn.",
        "data": {}
      }
      ```

2.  **Thu hồi một phiên đăng nhập cụ thể**

    - **Endpoint:** `DELETE /{sessionId}`
    - **Request Header:** `Authorization: Bearer <AccessToken>`
    - **Path Parameter:** `sessionId` (ID của refresh token hoặc key trong Redis)
    - **Response (200 OK):**
      ```json
      {
        "status": 200,
        "message_code": "SESSION_REVOKED_SUCCESSFULLY",
        "message": "Phiên đã được thu hồi thành công.",
        "data": {}
      }
      ```
    - **Response (401 Unauthorized):**
      ```json
      {
        "status": 401,
        "message_code": "UNAUTHENTICATED",
        "message": "Token không hợp lệ hoặc đã hết hạn.",
        "data": {}
      }
      ```
    - **Response (403 Forbidden):**
      ```json
      {
        "status": 403,
        "message_code": "FORBIDDEN_SESSION_REVOKE",
        "message": "Không có quyền thu hồi phiên này.",
        "data": {}
      }
      ```
    - **Response (404 Not Found):**
      ```json
      {
        "status": 404,
        "message_code": "SESSION_NOT_FOUND",
        "message": "Không tìm thấy phiên này.",
        "data": {}
      }
      ```

3.  **Thu hồi tất cả các phiên khác**
    - **Endpoint:** `POST /revoke-others` (hoặc `DELETE /others`)
    - **Request Header:** `Authorization: Bearer <AccessToken>`
    - **Response (200 OK):**
      ```json
      {
        "status": 200,
        "message_code": "OTHER_SESSIONS_REVOKED_SUCCESSFULLY",
        "message": "Tất cả các phiên khác đã được thu hồi thành công.",
        "data": {}
      }
      ```
    - **Response (401 Unauthorized):**
      ```json
      {
        "status": 401,
        "message_code": "UNAUTHENTICATED",
        "message": "Token không hợp lệ hoặc đã hết hạn.",
        "data": {}
      }
      ```

### 4.4. gRPC Interface cho Xác thực Token Nội bộ

Để phục vụ cho việc xác thực token từ API Gateway hoặc các microservices khác trong hệ thống, `auth-service` sẽ cung cấp một gRPC interface. Giao diện này cho phép các service nội bộ xác minh tính hợp lệ của một Access Token và nhận lại thông tin chi tiết (claims) của người dùng, bao gồm cả vai trò và quyền, để các service đó có thể tự thực hiện logic ủy quyền.

**Service Definition (tham chiếu đến `@repo/grpc/protos/auth_service/v1/auth_validator.proto`):**

```protobuf
// Nội dung file .proto sẽ được đặt trong package @repo/grpc
// Ví dụ (tóm tắt lại, chi tiết tham khảo file proto thực tế):
// syntax = "proto3";
// package auth.v1;
// import "google/protobuf/wrappers.proto"; // Nếu dùng wrapper types cho optional
// import "common/v1/enums.proto"; // Ví dụ nếu RoleEnum, PermissionEnum có định nghĩa proto

// message UserClaims {
//   string user_id = 1;
//   string email = 2;
//   repeated string roles = 3;        // Giá trị từ RoleEnum của @repo/common
//   repeated string permissions = 4;  // Giá trị từ PermissionEnum của @repo/common
//   map<string, string> custom_claims = 5;
// }
// ... (các message và service definition khác)
```

**Luồng hoạt động (ví dụ với API Gateway):**

1.  API Gateway nhận request từ client với header `Authorization: Bearer <token>`.
2.  Gateway trích xuất `<token>`.
3.  Gateway gọi RPC `ValidateToken` đến `auth-service` với token này.
4.  `auth-service` thực hiện logic xác thực:
    - Kiểm tra tính hợp lệ của token (chữ ký, thời gian hết hạn, định dạng).
    - Nếu token hợp lệ, trích xuất `user_id`.
    - Truy vấn cơ sở dữ liệu (PostgreSQL) để lấy thông tin `roles` và `permissions` của `user_id`.
    - Kiểm tra xem token có bị thu hồi (trong Redis) hay không.
    - Kiểm tra trạng thái của người dùng (ví dụ: có bị khóa không).
5.  `auth-service` trả về `ValidateTokenResponse` với:
    - `is_valid = true` và `claims` (bao gồm `user_id`, `email`, `roles`, `permissions`) nếu token hợp lệ và người dùng hợp lệ.
    - `is_valid = false` và `error_code` (cùng `error_message`) nếu có lỗi.
6.  Dựa trên `ValidateTokenResponse`, API Gateway (hoặc service gọi) quyết định:
    - Từ chối request nếu `is_valid = false`.
    - Nếu `is_valid = true`, Gateway sử dụng `claims.roles` và `claims.permissions` để thực hiện logic ủy quyền (ví dụ: kiểm tra người dùng có quyền truy cập vào một tài nguyên cụ thể không).
    - Gateway có thể enrich request gửi đến service nội bộ bằng cách thêm `user_id` hoặc các thông tin khác từ `claims` vào headers.

**Triển khai:**

- `auth-service` sẽ cần triển khai một gRPC server (dựa trên mã được tạo từ `@repo/grpc`) song song với HTTP server (Elysia.js).
- Các service khác (Gateway, microservices) sẽ sử dụng gRPC client được tạo từ file `.proto` (thông qua package `@repo/grpc`) để giao tiếp với `auth-service`.

---

## 5. Thiết kế Cơ sở dữ liệu (PostgreSQL với Drizzle ORM)

### 5.1. Lựa chọn Cơ sở dữ liệu

- PostgreSQL: Mạnh mẽ, ổn định, hỗ trợ tốt các kiểu dữ liệu phức tạp.
- Drizzle ORM: Type-safe SQL query builder cho TypeScript, gần gũi với SQL, hiệu năng tốt.

### 5.2. Sơ đồ lược đồ (Schema - Drizzle Kit)

(Sử dụng Drizzle Kit để tạo và quản lý schema, migrations)

**Table: `users`**

- `id`: `uuid` (Primary Key, default: `gen_random_uuid()`)
- `email`: `varchar(255)` (Unique, Not Null)
- `hashed_password`: `varchar(255)` (Not Null)
- `first_name`: `varchar(100)`
- `last_name`: `varchar(100)`
- `avatar_url`: `text`
- `email_verified_ts`: `bigint` (Nullable, Unix timestamp, cho giai đoạn sau)
- `account_status`: `smallint` (Not Null, Default: 0, ví dụ: 0 - active, 1 - inactive, 2 - suspended. Các giá trị này sẽ ánh xạ tới `UserStatusEnum` từ `@repo/common`.)
- `created_ts`: `bigint` (Not Null, Default: current Unix timestamp)
- `updated_ts`: `bigint` (Not Null, Default: current Unix timestamp)
- `deleted_ts`: `bigint` (Nullable, Unix timestamp, cho soft delete)

**Table: `password_reset_otps`** (Đổi tên từ `password_reset_tokens` và điều chỉnh cho OTP)

- `id`: `uuid` (Primary Key, default: `gen_random_uuid()`)
- `user_id`: `uuid` (Foreign Key to `users.id`, Not Null, On Delete Cascade)
- `otp_value`: `varchar(10)` (Not Null, trong MVP có thể lưu "111111", sau này sẽ là OTP thật hoặc hash của OTP)
- `expires_ts`: `bigint` (Not Null, Unix timestamp)
- `created_ts`: `bigint` (Not Null, Default: current Unix timestamp)
- `used_ts`: `bigint` (Nullable, Unix timestamp, để đánh dấu OTP đã được sử dụng)

**Table: `roles`**

- `id`: `serial` (Primary Key, auto-increment) hoặc `uuid`
- `name`: `varchar(50)` (Unique, Not Null, các giá trị tham chiếu `RoleEnum` từ `@repo/common`, ví dụ: 'SYSTEM_ADMIN', 'USER')
- `description`: `text` (Nullable)
- `created_ts`: `bigint` (Not Null, Default: current Unix timestamp)
- `updated_ts`: `bigint` (Not Null, Default: current Unix timestamp)

**Table: `permissions`**

- `id`: `serial` (Primary Key, auto-increment) hoặc `uuid`
- `name`: `varchar(100)` (Unique, Not Null, các giá trị tham chiếu `PermissionEnum` từ `@repo/common`, ví dụ: 'CONTENT_VIEW', 'USER_MANAGE')
- `description`: `text` (Nullable)
- `group_name`: `varchar(50)` (Nullable, để nhóm quyền, ví dụ: 'user_management', 'article_management')
- `created_ts`: `bigint` (Not Null, Default: current Unix timestamp)
- `updated_ts`: `bigint` (Not Null, Default: current Unix timestamp)

**Table: `user_roles` (Mapping Table)**

- `user_id`: `uuid` (Foreign Key to `users.id`, Not Null, On Delete Cascade)
- `role_id`: `integer` (Foreign Key to `roles.id`, Not Null, On Delete Cascade)
- `assigned_ts`: `bigint` (Not Null, Default: current Unix timestamp)
- Primary Key: (`user_id`, `role_id`)

**Table: `role_permissions` (Mapping Table)**

- `role_id`: `integer` (Foreign Key to `roles.id`, Not Null, On Delete Cascade)
- `permission_id`: `integer` (Foreign Key to `permissions.id`, Not Null, On Delete Cascade)
- `assigned_ts`: `bigint` (Not Null, Default: current Unix timestamp)
- Primary Key: (`role_id`, `permission_id`)

_(Các bảng khác như `user_identities`, `mfa_factors`, `audit_logs` sẽ được thêm trong các giai đoạn sau)_

### 5.3. Chỉ mục (Indexes)

- `users`: `email` (unique index tự động tạo), `id`.
- `password_reset_otps`: `user_id`, `otp_value` (nếu cần tìm kiếm theo OTP, nhưng thường là tìm theo user_id và kiểm tra OTP).

---

## 6. Thiết kế Redis

### 6.1. Mục đích sử dụng

- **Quản lý Refresh Tokens:** Lưu trữ hash của Refresh Token (hoặc chính token nếu nó là opaque) cùng với `userId` và thời gian hết hạn.
  - Key: `refresh_token:<hashed_refresh_token_or_id>`
  - Value: `userId`
  - TTL: Thời gian sống của Refresh Token.
- **Danh sách đen JWT (Blacklist - nếu cần):** Lưu trữ `jti` (JWT ID) của các Access Token đã bị vô hiệu hóa (ví dụ khi đổi mật khẩu, đăng xuất toàn bộ) cho đến khi chúng hết hạn tự nhiên. Token này được lưu với `key: jwt_blacklist:<jti>` và `value: 1` (hoặc `true`), `TTL: thời gian sống còn lại của Access Token`.
- **Password Reset OTPs (MVP):**
  - Key: `otp:password_reset:<user_id_or_email>` (ví dụ: `otp:password_reset:user@example.com`)
  - Value: OTP (ví dụ: "111111" trong MVP, hoặc hash của OTP thật sau này)
  - TTL: Ngắn (ví dụ: 5-10 phút).
- **Rate Limiting:**
  - Key: `rate_limit:<endpoint_or_action>:<user_id_or_ip>`
  - Value: `count`
  - TTL: Khoảng thời gian của rate limit (ví dụ: 1 phút, 1 giờ).

---

## 7. Bảo mật (Security Considerations)

- **Mã hóa mật khẩu:** `bcrypt` với cost factor phù hợp (ví dụ: 10-12).
- **JWT Security:**
  - Sử dụng secret mạnh cho JWT, quản lý qua environment variables.
  - Access Token ngắn hạn.
  - Refresh Token dài hạn, được lưu trữ an toàn, và **luôn được xoay vòng (rotated)** sau mỗi lần sử dụng thành công.
- **Input Validation:** Sử dụng `t` của Elysia để validate tất cả đầu vào từ client.
- **Drizzle ORM:** Giúp chống SQL Injection bằng cách sử dụng prepared statements.
- **HTTPS:** Bắt buộc cho tất cả các giao tiếp.
- **Rate Limiting:** Áp dụng cho các endpoint nhạy cảm (login, register, forgot-password) để chống brute-force.
- **CORS:** Cấu hình CORS phù hợp trong Elysia.js.
- **Error Handling:** Tránh lộ thông tin nhạy cảm trong thông báo lỗi.

---

## 8. Triển khai (Deployment Strategy)

- **Containerization:** Docker.
- **Môi trường:** `development`, `staging`, `production`.
- **CI/CD:** GitHub Actions (hoặc tương tự) để build, test, deploy.
- **Configuration:** Sử dụng environment variables (ví dụ: `.env` files, secrets manager).

---

## 9. Giám sát và Logging (Monitoring and Logging)

- **Logging:**
  - Sử dụng Elysia.js logger hoặc tích hợp với Pino.
  - Log request, response, lỗi, và các sự kiện quan trọng.
  - Định dạng log JSON để dễ dàng parse bởi các hệ thống tập trung log.
- **Monitoring:**
  - Theo dõi các chỉ số cơ bản: CPU, memory, disk I/O, network.
  - Theo dõi số lượng request, tỷ lệ lỗi, độ trễ API.
  - (Giai đoạn sau) Tích hợp với Prometheus/Grafana hoặc dịch vụ monitoring cloud.
- **Alerting:** Thiết lập cảnh báo cho các ngưỡng lỗi hoặc hiệu năng bất thường.

---

## 10. Quy ước Code và Cấu trúc Dự án

- Tuân thủ theo `code-rule` đã được cung cấp trong `required_instructions`.
- **Chủ động đóng góp cho Shared Packages:** Khuyến khích việc xác định và chuyển các thành phần có thể tái sử dụng (configurations, types, enums, utilities) vào các package `@repo/common` và `@repo/config` trong suốt quá trình phát triển.
- **Ngôn ngữ:** TypeScript.
- **Framework:** Elysia.js.
- **ORM:** Drizzle ORM.
- **Cấu trúc thư mục:**
  ```
  apps/auth-service/
  ├── src/
  │   ├── constants/         # Hằng số
  │   │   ├── drizzle/       # Cấu hình Drizzle, schema, migrations
  │   │   │   ├── 0000_initial_schema.sql
  │   │   │   └── schema.ts
  │   │   ├── connection.ts  # Kết nối DB
  │   │   └── index.ts
  │   ├── index.ts           # Entry point của Elysia app
  │   ├── middlewares/
  │   │   ├── auth.middleware.ts
  │   │   └── error.middleware.ts
  │   ├── modules/
  │   │   └── v1/
  │   │       ├── auth/
  │   │       │   ├── auth.controller.ts
  │   │       │   ├── auth.service.ts
  │   │       │   ├── auth.validation.ts
  │   │       │   └── auth.types.ts
  │   │       ├── users/
  │   │       │   ├── user.controller.ts
  │   │       │   ├── user.service.ts
  │   │       │   ├── user.repository.ts # Sử dụng Drizzle
  │   │       │   └── user.types.ts
  │   │       └── sessions/
  │   │           ├── session.controller.ts
  │   │           ├── session.service.ts
  │   │           └── session.types.ts
  │   ├── plugins/           # Elysia plugins (jwt, swagger, cookie)
  │   ├── repositories/      # (Có thể gộp vào từng module nếu nhỏ)
  │   │   └── base.repository.ts # (Nếu cần lớp base)
  │   ├── types/             # Types & Enums dùng chung
  │   │   └── index.ts
  │   └── utils/
  │       ├── jwt.util.ts
  │       └── bcrypt.util.ts
  ├── docs/
  │   └── auth-service-design-doc.md
  ├── .env.example
  ├── .gitignore
  ├── package.json
  └── tsconfig.json
  ```

---

## 11. Rủi ro và Giải pháp (MVP)

- **Rủi ro:** Lộ Refresh Token phía client.
  - **Giải pháp:** Nếu là web app, sử dụng HttpOnly, Secure cookies cho Refresh Token. Với mobile, lưu trong Secure Storage. Hướng dẫn client bảo vệ token.
- **Rủi ro:** Tấn công Brute-force vào API login.
  - **Giải pháp:** Implement Rate Limiting dựa trên IP hoặc User ID.
- **Rủi ro:** Quên mật khẩu (MVP) sử dụng OTP hardcoded ("111111") là không an toàn cho môi trường production.
  - **Giải pháp (MVP):** Ghi nhận đây là giải pháp tạm thời chỉ dành cho phát triển/MVP.
  - **Giải pháp (Sau MVP):** Ưu tiên triển khai tích hợp gửi OTP qua email thực tế càng sớm càng tốt. Cơ chế OTP hardcoded phải được loại bỏ hoàn toàn trước khi đưa vào sử dụng chính thức.

---

## 12. Kế hoạch Phát triển (Giai đoạn Tiếp theo)

- Tích hợp gửi email (xác thực tài khoản, quên mật khẩu).
- Triển khai Xác thực Đa yếu tố (MFA).
- Hỗ trợ Đăng nhập bằng Mạng xã hội (Google, Facebook, etc.).
- Xây dựng trang quản trị (Admin UI) để quản lý người dùng.
- Audit logging chi tiết.
