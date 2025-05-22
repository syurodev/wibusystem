# Thiết kế Cơ sở dữ liệu cho Dịch vụ Xác thực (Auth Service)

Tài liệu này mô tả thiết kế chi tiết của cơ sở dữ liệu PostgreSQL cho `auth-service`, tuân thủ các quy tắc đã định nghĩa trong `database-rule.mdc`.

## Quy ước chung

- Tên bảng và tên cột: `snake_case`.
- Kiểu dữ liệu cho timestamp: `bigint` (lưu trữ Unix timestamp - số giây tính từ epoch).
- Kiểu dữ liệu cho các trường trạng thái (status): `smallint`.
- Khóa chính (`id`) luôn là kiểu dữ liệu tự tăng (`serial` hoặc `bigserial`).
- Không sử dụng khóa ngoại (foreign key constraints). Việc quản lý tính nhất quán dữ liệu giữa các bảng sẽ được xử lý ở tầng ứng dụng.
- Các trường `created_at` và `updated_at` được sử dụng để theo dõi thời gian tạo và cập nhật bản ghi.

## Sơ đồ Quan hệ Thực thể (ERD) - Văn bản (Logic)

```
+-------------+       +------------------+       +---------------+
|    users    |       |    user_roles    |       |     roles     |
+-------------+       +------------------+       +---------------+
      |                       |  (references users.id) |
      |                       |  (references roles.id) |
      |
+---------------------+
| password_reset_otps |
| (references users.id) |
+---------------------+
      |
+---------------------+
|   refresh_tokens  |
| (references users.id) |
+---------------------+

                                       +---------------------+       +---------------------+
                                       |  role_permissions   |       |    permissions    |
                                       +---------------------+       +---------------------+
                                         (references roles.id)
                                         (references permissions.id)
```

**Ghi chú:**

- Các bảng liên kết logic với nhau thông qua các cột `id` (ví dụ: `user_roles.user_id` tham chiếu logic tới `users.id`).
- `users` có thể có nhiều `refresh_tokens`.
- `users` có thể có nhiều `password_reset_otps`.

## Chi tiết các bảng

### 1. Bảng `users`

Lưu trữ thông tin cơ bản của người dùng.

| Tên cột           | Kiểu dữ liệu   | Ràng buộc                                       | Mô tả                                                                                                                               |
| ----------------- | -------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `id`              | `bigserial`    | `PRIMARY KEY`                                   | ID duy nhất của người dùng (tự tăng).                                                                                               |
| `email`           | `varchar(255)` | `UNIQUE`, `NOT NULL`                            | Địa chỉ email của người dùng (dùng để đăng nhập).                                                                                   |
| `hashed_password` | `varchar(255)` | `NOT NULL`                                      | Mật khẩu đã được hash của người dùng.                                                                                               |
| `account_status`  | `smallint`     | `NOT NULL`, `DEFAULT 0`                         | Trạng thái tài khoản (ví dụ: 0: Pending, 1: Active, 2: Suspended, 3: Banned). Tham chiếu đến `UserStatusEnum` trong `@repo/common`. |
| `full_name`       | `varchar(255)` |                                                 | Tên đầy đủ của người dùng (tùy chọn).                                                                                               |
| `avatar_url`      | `text`         |                                                 | URL ảnh đại diện của người dùng (tùy chọn).                                                                                         |
| `last_login_at`   | `bigint`       |                                                 | Unix timestamp của lần đăng nhập cuối cùng.                                                                                         |
| `created_at`      | `bigint`       | `NOT NULL`, `DEFAULT extract(epoch from now())` | Unix timestamp khi tài khoản được tạo.                                                                                              |
| `updated_at`      | `bigint`       | `NOT NULL`, `AUTO_UPDATE_ON_CHANGE`             | Unix timestamp được tự động cập nhật mỗi khi thông tin tài khoản thay đổi.                                                          |

**Indexes:**

- `idx_users_email` ON `users` (`email`)
- `idx_users_account_status` ON `users` (`account_status`)

### 2. Bảng `roles`

Định nghĩa các vai trò trong hệ thống (ví dụ: admin, user, editor).

| Tên cột       | Kiểu dữ liệu  | Ràng buộc                                       | Mô tả                                                                                     |
| ------------- | ------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `id`          | `serial`      | `PRIMARY KEY`                                   | ID duy nhất của vai trò (tự tăng).                                                        |
| `name`        | `varchar(50)` | `UNIQUE`, `NOT NULL`                            | Tên của vai trò (ví dụ: "ADMIN", "USER"). Tham chiếu đến `RoleEnum` trong `@repo/common`. |
| `description` | `text`        |                                                 | Mô tả chi tiết về vai trò (tùy chọn).                                                     |
| `created_at`  | `bigint`      | `NOT NULL`, `DEFAULT extract(epoch from now())` | Unix timestamp khi vai trò được tạo.                                                      |
| `updated_at`  | `bigint`      | `NOT NULL`, `AUTO_UPDATE_ON_CHANGE`             | Unix timestamp được tự động cập nhật mỗi khi thông tin vai trò thay đổi.                  |

**Indexes:**

- `idx_roles_name` ON `roles` (`name`)

### 3. Bảng `permissions`

Định nghĩa các quyền hạn chi tiết trong hệ thống (ví dụ: create_user, delete_post).

| Tên cột       | Kiểu dữ liệu   | Ràng buộc                                       | Mô tả                                                                                                              |
| ------------- | -------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `id`          | `serial`       | `PRIMARY KEY`                                   | ID duy nhất của quyền hạn (tự tăng).                                                                               |
| `name`        | `varchar(100)` | `UNIQUE`, `NOT NULL`                            | Tên của quyền hạn (ví dụ: "users:create", "posts:read_all"). Tham chiếu đến `PermissionEnum` trong `@repo/common`. |
| `description` | `text`         |                                                 | Mô tả chi tiết về quyền hạn (tùy chọn).                                                                            |
| `group_name`  | `varchar(50)`  | `NOT NULL`                                      | Tên nhóm quyền hạn (ví dụ: "User Management", "Content Management").                                               |
| `created_at`  | `bigint`       | `NOT NULL`, `DEFAULT extract(epoch from now())` | Unix timestamp khi quyền hạn được tạo.                                                                             |
| `updated_at`  | `bigint`       | `NOT NULL`, `AUTO_UPDATE_ON_CHANGE`             | Unix timestamp được tự động cập nhật mỗi khi thông tin quyền hạn thay đổi.                                         |

**Indexes:**

- `idx_permissions_name` ON `permissions` (`name`)
- `idx_permissions_group_name` ON `permissions` (`group_name`)

### 4. Bảng `user_roles`

Bảng trung gian để quản lý mối quan hệ many-to-many giữa `users` và `roles`.

| Tên cột       | Kiểu dữ liệu | Ràng buộc                                       | Mô tả                                                |
| ------------- | ------------ | ----------------------------------------------- | ---------------------------------------------------- |
| `user_id`     | `bigint`     | `NOT NULL`                                      | ID của người dùng (tham chiếu logic tới `users.id`). |
| `role_id`     | `integer`    | `NOT NULL`                                      | ID của vai trò (tham chiếu logic tới `roles.id`).    |
| `assigned_at` | `bigint`     | `NOT NULL`, `DEFAULT extract(epoch from now())` | Unix timestamp khi vai trò được gán cho người dùng.  |
|               |              | `PRIMARY KEY (user_id, role_id)`                | Khóa chính kết hợp.                                  |

**Indexes:**

- `idx_user_roles_user_id` ON `user_roles` (`user_id`)
- `idx_user_roles_role_id` ON `user_roles` (`role_id`)

### 5. Bảng `role_permissions`

Bảng trung gian để quản lý mối quan hệ many-to-many giữa `roles` và `permissions`.

| Tên cột         | Kiểu dữ liệu | Ràng buộc                                       | Mô tả                                                     |
| --------------- | ------------ | ----------------------------------------------- | --------------------------------------------------------- |
| `role_id`       | `integer`    | `NOT NULL`                                      | ID của vai trò (tham chiếu logic tới `roles.id`).         |
| `permission_id` | `integer`    | `NOT NULL`                                      | ID của quyền hạn (tham chiếu logic tới `permissions.id`). |
| `assigned_at`   | `bigint`     | `NOT NULL`, `DEFAULT extract(epoch from now())` | Unix timestamp khi quyền hạn được gán cho vai trò.        |
|                 |              | `PRIMARY KEY (role_id, permission_id)`          | Khóa chính kết hợp.                                       |

**Indexes:**

- `idx_role_permissions_role_id` ON `role_permissions` (`role_id`)
- `idx_role_permissions_permission_id` ON `role_permissions` (`permission_id`)

### 6. Bảng `refresh_tokens`

Lưu trữ thông tin về các refresh token đang hoạt động để quản lý phiên đăng nhập và cơ chế xoay vòng token.

| Tên cột          | Kiểu dữ liệu   | Ràng buộc                                       | Mô tả                                                                                                                                        |
| ---------------- | -------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`             | `bigserial`    | `PRIMARY KEY`                                   | ID duy nhất của bản ghi refresh token (tự tăng).                                                                                             |
| `user_id`        | `bigint`       | `NOT NULL`                                      | ID của người dùng sở hữu token này (tham chiếu logic tới `users.id`).                                                                        |
| `user_device_id` | `bigint`       |                                                 | ID của thiết bị liên quan đến token này (tham chiếu logic tới `user_devices.id`). Có thể NULL nếu không gắn với thiết bị cụ thể.             |
| `token_hash`     | `varchar(255)` | `UNIQUE`, `NOT NULL`                            | Hash của refresh token (không lưu token gốc).                                                                                                |
| `family_id`      | `uuid`         | `NOT NULL`                                      | ID để nhóm các token xoay vòng (token cũ và token mới sau khi xoay vòng).                                                                    |
| `device_info`    | `text`         |                                                 | Thông tin thiết bị (ví dụ: User Agent) được ghi nhận tại thời điểm tạo token (tùy chọn, có thể dùng làm fallback nếu `user_device_id` NULL). |
| `ip_address`     | `varchar(45)`  |                                                 | Địa chỉ IP khi token được tạo (tùy chọn).                                                                                                    |
| `is_active`      | `smallint`     | `NOT NULL`, `DEFAULT 1`                         | Trạng thái token (ví dụ: `1` cho active, `0` cho inactive/revoked).                                                                          |
| `expires_at`     | `bigint`       | `NOT NULL`                                      | Unix timestamp khi token hết hạn.                                                                                                            |
| `created_at`     | `bigint`       | `NOT NULL`, `DEFAULT extract(epoch from now())` | Unix timestamp khi token được tạo.                                                                                                           |
| `revoked_at`     | `bigint`       |                                                 | Unix timestamp khi token bị thu hồi (do logout, xoay vòng, v.v...).                                                                          |

**Indexes:**

- `idx_refresh_tokens_user_id` ON `refresh_tokens` (`user_id`)
- `idx_refresh_tokens_user_device_id` ON `refresh_tokens` (`user_device_id`)
- `idx_refresh_tokens_token_hash` ON `refresh_tokens` (`token_hash`)
- `idx_refresh_tokens_family_id` ON `refresh_tokens` (`family_id`)
- `idx_refresh_tokens_expires_at` ON `refresh_tokens` (`expires_at`)

### 7. Bảng `password_reset_otps`

Lưu trữ mã OTP (One-Time Password) hoặc token dùng cho việc yêu cầu đặt lại mật khẩu.

| Tên cột      | Kiểu dữ liệu   | Ràng buộc                                       | Mô tả                                                                         |
| ------------ | -------------- | ----------------------------------------------- | ----------------------------------------------------------------------------- |
| `id`         | `bigserial`    | `PRIMARY KEY`                                   | ID duy nhất của bản ghi OTP (tự tăng).                                        |
| `user_id`    | `bigint`       | `NOT NULL`                                      | ID của người dùng yêu cầu đặt lại mật khẩu (tham chiếu logic tới `users.id`). |
| `otp_hash`   | `varchar(255)` | `NOT NULL`                                      | Hash của OTP (không lưu OTP gốc).                                             |
| `expires_at` | `bigint`       | `NOT NULL`                                      | Unix timestamp khi OTP hết hạn.                                               |
| `used_at`    | `bigint`       |                                                 | Unix timestamp khi OTP được sử dụng (NULL nếu chưa sử dụng).                  |
| `created_at` | `bigint`       | `NOT NULL`, `DEFAULT extract(epoch from now())` | Unix timestamp khi OTP được tạo.                                              |

**Indexes:**

- `idx_password_reset_otps_user_id` ON `password_reset_otps` (`user_id`)
- `idx_password_reset_otps_otp_hash` ON `password_reset_otps` (`otp_hash`)
- `idx_password_reset_otps_expires_at` ON `password_reset_otps` (`expires_at`)

### 8. Bảng `user_devices`

Lưu trữ thông tin về các thiết bị mà người dùng đã sử dụng để đăng nhập. Mỗi thiết bị được xác định bởi một fingerprint duy nhất cho mỗi người dùng, giúp quản lý và tăng cường bảo mật.

| Tên cột           | Kiểu dữ liệu   | Ràng buộc                                       | Mô tả                                                                                                                           |
| ----------------- | -------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `id`              | `bigserial`    | `PRIMARY KEY`                                   | ID duy nhất của bản ghi thiết bị (tự tăng).                                                                                     |
| `user_id`         | `bigint`       | `NOT NULL`                                      | ID của người dùng sở hữu thiết bị này (tham chiếu logic tới `users.id`).                                                        |
| `fingerprint`     | `varchar(255)` | `NOT NULL`                                      | Một định danh duy nhất cho thiết bị, có thể do client tạo ra hoặc suy ra từ các thuộc tính ổn định. Duy nhất cho mỗi `user_id`. |
| `name`            | `varchar(100)` |                                                 | Tên do người dùng đặt cho thiết bị (ví dụ: "iPhone X của An", "Máy tính làm việc") (tùy chọn).                                  |
| `type`            | `smallint`     | `NOT NULL`, `DEFAULT 0`                         | Loại thiết bị (ví dụ: 0: UNKNOWN, 1: DESKTOP, 2: MOBILE, 3: TABLET, 4: WEB_BROWSER). Tham chiếu đến `DeviceTypeEnum`.           |
| `model`           | `varchar(100)` |                                                 | Model của thiết bị (ví dụ: "iPhone 15 Pro", "Galaxy Note 10") (tùy chọn).                                                       |
| `os_name`         | `varchar(50)`  |                                                 | Tên hệ điều hành (ví dụ: "iOS", "Android", "Windows") (tùy chọn).                                                               |
| `os_version`      | `varchar(50)`  |                                                 | Phiên bản hệ điều hành (tùy chọn).                                                                                              |
| `browser_name`    | `varchar(50)`  |                                                 | Tên trình duyệt nếu là thiết bị web (tùy chọn).                                                                                 |
| `browser_version` | `varchar(50)`  |                                                 | Phiên bản trình duyệt nếu là thiết bị web (tùy chọn).                                                                           |
| `last_known_ip`   | `varchar(45)`  |                                                 | Địa chỉ IP cuối cùng được ghi nhận từ thiết bị này (tùy chọn).                                                                  |
| `last_user_agent` | `text`         |                                                 | Chuỗi User Agent cuối cùng được ghi nhận từ thiết bị này (tùy chọn).                                                            |
| `is_trusted`      | `smallint`     | `NOT NULL`, `DEFAULT 0`                         | Thiết bị này có được người dùng đánh dấu là tin cậy không? (0: Không, 1: Có).                                                   |
| `last_seen_at`    | `bigint`       | `NOT NULL`, `DEFAULT extract(epoch from now())` | Unix timestamp lần cuối thiết bị này được ghi nhận hoạt động.                                                                   |
| `created_at`      | `bigint`       | `NOT NULL`, `DEFAULT extract(epoch from now())` | Unix timestamp khi bản ghi thiết bị được tạo.                                                                                   |
| `updated_at`      | `bigint`       | `NOT NULL`, `AUTO_UPDATE_ON_CHANGE`             | Unix timestamp được tự động cập nhật mỗi khi thông tin thiết bị thay đổi.                                                       |
| `revoked_at`      | `bigint`       |                                                 | Unix timestamp khi thiết bị bị thu hồi quyền truy cập (ví dụ: người dùng logout từ xa) (tùy chọn, NULL nếu chưa bị thu hồi).    |

**Indexes:**

- `idx_user_devices_user_id` ON `user_devices` (`user_id`)
- `idx_user_devices_user_fingerprint` ON `user_devices` (`user_id`, `fingerprint`) (UNIQUE)
- `idx_user_devices_type` ON `user_devices` (`type`)
- `idx_user_devices_is_trusted` ON `user_devices` (`is_trusted`)
- `idx_user_devices_last_seen_at` ON `user_devices` (`last_seen_at`)

### 9. Bảng `user_mfa_settings`

Lưu trữ cài đặt xác thực đa yếu tố (MFA) cho người dùng. Mỗi người dùng có thể có nhiều phương thức MFA được kích hoạt (ví dụ: TOTP, SMS).

| Tên cột       | Kiểu dữ liệu | Ràng buộc                                       | Mô tả                                                                                              |
| ------------- | ------------ | ----------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `id`          | `bigserial`  | `PRIMARY KEY`                                   | ID duy nhất của cài đặt MFA (tự tăng).                                                             |
| `user_id`     | `bigint`     | `NOT NULL`                                      | ID của người dùng (tham chiếu logic tới `users.id`).                                               |
| `method_type` | `smallint`   | `NOT NULL`                                      | Loại phương thức MFA (ví dụ: 0 cho TOTP, 1 cho SMS). Tham chiếu đến `MfaMethodTypeEnum`.           |
| `secret_key`  | `text`       | `NOT NULL`                                      | Khóa bí mật cho phương thức MFA (ví dụ: secret TOTP đã mã hóa, hoặc thông tin định danh cho SMS).  |
| `is_enabled`  | `smallint`   | `NOT NULL`, `DEFAULT 0`                         | Trạng thái kích hoạt của phương thức MFA này (0: Vô hiệu hóa, 1: Kích hoạt).                       |
| `verified_at` | `bigint`     |                                                 | Unix timestamp khi phương thức này được xác minh và kích hoạt thành công (NULL nếu chưa xác minh). |
| `created_at`  | `bigint`     | `NOT NULL`, `DEFAULT extract(epoch from now())` | Unix timestamp khi cài đặt MFA được tạo.                                                           |
| `updated_at`  | `bigint`     | `NOT NULL`, `AUTO_UPDATE_ON_CHANGE`             | Unix timestamp được tự động cập nhật mỗi khi thông tin cài đặt MFA thay đổi.                       |

**Indexes:**

- `idx_user_mfa_settings_user_id` ON `user_mfa_settings` (`user_id`)
- `idx_user_mfa_user_method` ON `user_mfa_settings` (`user_id`, `method_type`) (UNIQUE)
- `idx_user_mfa_settings_method_type` ON `user_mfa_settings` (`method_type`)
- `idx_user_mfa_settings_is_enabled` ON `user_mfa_settings` (`is_enabled`)

### 10. Bảng `user_mfa_backup_codes`

Lưu trữ các mã khôi phục (backup codes) cho một cài đặt MFA cụ thể của người dùng. Mỗi mã chỉ có thể được sử dụng một lần.

| Tên cột               | Kiểu dữ liệu   | Ràng buộc                                       | Mô tả                                                                                |
| --------------------- | -------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------ |
| `id`                  | `bigserial`    | `PRIMARY KEY`                                   | ID duy nhất của mã khôi phục (tự tăng).                                              |
| `user_mfa_setting_id` | `bigint`       | `NOT NULL`                                      | ID của cài đặt MFA mà mã này thuộc về (tham chiếu logic tới `user_mfa_settings.id`). |
| `code_hash`           | `varchar(255)` | `NOT NULL`                                      | Hash của mã khôi phục (không lưu mã gốc).                                            |
| `is_used`             | `smallint`     | `NOT NULL`, `DEFAULT 0`                         | Trạng thái sử dụng của mã (0: Chưa sử dụng, 1: Đã sử dụng).                          |
| `used_at`             | `bigint`       |                                                 | Unix timestamp khi mã được sử dụng (NULL nếu chưa sử dụng).                          |
| `created_at`          | `bigint`       | `NOT NULL`, `DEFAULT extract(epoch from now())` | Unix timestamp khi mã khôi phục được tạo.                                            |

**Indexes:**

- `idx_user_mfa_backup_codes_setting_id` ON `user_mfa_backup_codes` (`user_mfa_setting_id`)
- `idx_user_mfa_backup_codes_is_used` ON `user_mfa_backup_codes` (`is_used`)

### 11. Bảng `user_social_accounts`

Lưu trữ thông tin liên kết tài khoản người dùng với các nhà cung cấp OAuth bên ngoài (ví dụ: Google, Facebook, GitHub).

| Tên cột              | Kiểu dữ liệu   | Ràng buộc                                       | Mô tả                                                                                                                    |
| -------------------- | -------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `id`                 | `bigserial`    | `PRIMARY KEY`                                   | ID duy nhất của bản ghi liên kết (tự tăng).                                                                              |
| `user_id`            | `bigint`       | `NOT NULL`                                      | ID của người dùng trong hệ thống (tham chiếu logic tới `users.id`).                                                      |
| `provider_name`      | `varchar(50)`  | `NOT NULL`                                      | Tên nhà cung cấp OAuth (ví dụ: "google", "facebook", "github").                                                          |
| `provider_user_id`   | `varchar(255)` | `NOT NULL`                                      | ID của người dùng tại nhà cung cấp OAuth.                                                                                |
| `email`              | `varchar(255)` |                                                 | Địa chỉ email được trả về từ nhà cung cấp (tùy chọn, có thể dùng để liên kết hoặc tạo tài khoản mới).                    |
| `display_name`       | `varchar(255)` |                                                 | Tên hiển thị được trả về từ nhà cung cấp (tùy chọn).                                                                     |
| `avatar_url`         | `text`         |                                                 | URL ảnh đại diện được trả về từ nhà cung cấp (tùy chọn).                                                                 |
| `access_token_hash`  | `text`         |                                                 | Hash của access token từ nhà cung cấp (tùy chọn, lưu trữ nếu cần thiết cho các API call phía server và đảm bảo an toàn). |
| `refresh_token_hash` | `text`         |                                                 | Hash của refresh token từ nhà cung cấp (tùy chọn, tương tự access_token_hash).                                           |
| `scopes`             | `text`         |                                                 | Các scope được cấp phép bởi người dùng (ví dụ: "email,profile", dạng chuỗi, tùy chọn).                                   |
| `linked_at`          | `bigint`       | `NOT NULL`, `DEFAULT extract(epoch from now())` | Unix timestamp khi tài khoản được liên kết.                                                                              |
| `updated_at`         | `bigint`       | `NOT NULL`, `AUTO_UPDATE_ON_CHANGE`             | Unix timestamp được tự động cập nhật mỗi khi thông tin liên kết thay đổi.                                                |

**Indexes:**

- `idx_user_social_accounts_user_id` ON `user_social_accounts` (`user_id`)
- `idx_user_social_provider_user` ON `user_social_accounts` (`provider_name`, `provider_user_id`) (UNIQUE)
- `idx_user_social_accounts_email` ON `user_social_accounts` (`email`)

### 12. Bảng `verification_tokens`

Lưu trữ các token dùng cho các mục đích xác thực khác nhau như xác thực email, xác thực số điện thoại. Các token này thường có thời hạn sử dụng ngắn.

| Tên cột      | Kiểu dữ liệu   | Ràng buộc                                       | Mô tả                                                                                                         |
| ------------ | -------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `id`         | `bigserial`    | `PRIMARY KEY`                                   | ID duy nhất của token xác thực (tự tăng).                                                                     |
| `user_id`    | `bigint`       | `NOT NULL`                                      | ID của người dùng liên quan đến token này (tham chiếu logic tới `users.id`).                                  |
| `token_type` | `smallint`     | `NOT NULL`                                      | Loại token (ví dụ: 0: EMAIL_VERIFICATION, 1: PHONE_VERIFICATION). Tham chiếu đến `VerificationTokenTypeEnum`. |
| `token_hash` | `varchar(255)` | `UNIQUE`, `NOT NULL`                            | Hash của token (không lưu token gốc).                                                                         |
| `target`     | `varchar(255)` | `NOT NULL`                                      | Mục tiêu xác thực (ví dụ: địa chỉ email `john.doe@example.com`, số điện thoại `+1234567890`).                 |
| `expires_at` | `bigint`       | `NOT NULL`                                      | Unix timestamp khi token hết hạn.                                                                             |
| `is_used`    | `smallint`     | `NOT NULL`, `DEFAULT 0`                         | Trạng thái sử dụng của token (0: Chưa sử dụng, 1: Đã sử dụng).                                                |
| `used_at`    | `bigint`       |                                                 | Unix timestamp khi token được sử dụng (NULL nếu chưa sử dụng).                                                |
| `created_at` | `bigint`       | `NOT NULL`, `DEFAULT extract(epoch from now())` | Unix timestamp khi token được tạo.                                                                            |

**Indexes:**

- `idx_verification_tokens_user_id` ON `verification_tokens` (`user_id`)
- `idx_verification_tokens_hash` ON `verification_tokens` (`token_hash`)
- `idx_verification_tokens_type_target` ON `verification_tokens` (`token_type`, `target`)
- `idx_verification_tokens_expires_at` ON `verification_tokens` (`expires_at`)

## Enum và Tham chiếu

- **`UserStatusEnum`**: Sẽ được định nghĩa trong `@repo/common`. Các giá trị dự kiến: `PENDING_VERIFICATION`, `ACTIVE`, `SUSPENDED`, `BANNED`.
- **`RoleEnum`**: Sẽ được định nghĩa trong `@repo/common`. Các giá trị dự kiến: `SUPER_ADMIN`, `ADMIN`, `USER`, `GUEST`.
- **`PermissionEnum`**: Sẽ được định nghĩa trong `@repo/common`. Cấu trúc tên quyền ví dụ: `RESOURCE:ACTION` (ví dụ: `USERS:CREATE`, `USERS:READ_ALL`, `PROFILE:UPDATE_OWN`).
- **`DeviceTypeEnum`**: Sẽ được định nghĩa trong `@repo/common`. Các giá trị dự kiến: `UNKNOWN`, `DESKTOP`, `MOBILE`, `TABLET`, `WEB_BROWSER`.
- **`MfaMethodTypeEnum`**: Sẽ được định nghĩa trong `@repo/common`. Các giá trị dự kiến: `TOTP`, `SMS`.
- **`VerificationTokenTypeEnum`**: Sẽ được định nghĩa trong `@repo/common`. Các giá trị dự kiến: `EMAIL_VERIFICATION`, `PHONE_VERIFICATION`.

## Lưu ý thêm

- Cân nhắc thêm cơ chế dọn dẹp (cleanup) cho các bảng như `refresh_tokens` (xóa token hết hạn) và `password_reset_otps` (xóa OTP hết hạn và đã sử dụng).
- `DEFAULT extract(epoch from now())` được sử dụng để lấy Unix timestamp hiện tại (số giây).
- Việc không sử dụng khóa ngoại đòi hỏi tầng ứng dụng phải đảm bảo tính toàn vẹn và nhất quán của dữ liệu khi thực hiện các thao tác CUD (Create, Update, Delete) liên quan đến các thực thể logic. Ví dụ, khi xóa một user, ứng dụng cần xóa các bản ghi liên quan trong `user_roles`, `refresh_tokens`, `password_reset_otps`.
- Đối với `account_status` trong bảng `users`, `DEFAULT 0` giả định `0` là một trạng thái khởi tạo hợp lệ (ví dụ `PENDING_VERIFICATION` hoặc `ACTIVE` nếu không có bước xác minh). Điều này cần khớp với định nghĩa của `UserStatusEnum`.
- Cột `family_id` trong `refresh_tokens` (vẫn giữ kiểu `uuid` để đảm bảo tính duy nhất toàn cục và khó đoán) giúp phát hiện việc sử dụng lại một refresh token đã bị xoay vòng. Khi một refresh token được sử dụng, nó sẽ bị vô hiệu hóa và một cặp token mới (access + refresh) được tạo ra với cùng `family_id`. Refresh token mới sẽ được lưu, token cũ bị đánh dấu `revoked_at`.

Tài liệu này sẽ được cập nhật khi có thay đổi hoặc yêu cầu mới.
