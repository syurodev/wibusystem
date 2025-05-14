# Thiết kế Cơ sở dữ liệu cho Dịch vụ Xác thực (Auth Service)

Tài liệu này mô tả thiết kế chi tiết của cơ sở dữ liệu PostgreSQL cho `auth-service`, tuân thủ các quy tắc đã định nghĩa trong `database-rule.mdc`.

## Quy ước chung

- Tên bảng và tên cột: `snake_case`.
- Kiểu dữ liệu cho timestamp: `bigint` (lưu trữ Unix timestamp - số giây tính từ epoch).
- Kiểu dữ liệu cho các trường trạng thái (status): `smallint`.
- Khóa chính (`id`) luôn là kiểu dữ liệu tự tăng (`serial` hoặc `bigserial`).
- Không sử dụng khóa ngoại (foreign key constraints). Việc quản lý tính nhất quán dữ liệu giữa các bảng sẽ được xử lý ở tầng ứng dụng.
- Các trường `created_ts` và `updated_ts` được sử dụng để theo dõi thời gian tạo và cập nhật bản ghi.

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
| `last_login_ts`   | `bigint`       |                                                 | Unix timestamp của lần đăng nhập cuối cùng.                                                                                         |
| `created_ts`      | `bigint`       | `NOT NULL`, `DEFAULT extract(epoch from now())` | Unix timestamp khi tài khoản được tạo.                                                                                              |
| `updated_ts`      | `bigint`       | `NOT NULL`, `AUTO_UPDATE_ON_CHANGE`             | Unix timestamp được tự động cập nhật mỗi khi thông tin tài khoản thay đổi.                                                          |

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
| `created_ts`  | `bigint`      | `NOT NULL`, `DEFAULT extract(epoch from now())` | Unix timestamp khi vai trò được tạo.                                                      |
| `updated_ts`  | `bigint`      | `NOT NULL`, `AUTO_UPDATE_ON_CHANGE`             | Unix timestamp được tự động cập nhật mỗi khi thông tin vai trò thay đổi.                  |

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
| `created_ts`  | `bigint`       | `NOT NULL`, `DEFAULT extract(epoch from now())` | Unix timestamp khi quyền hạn được tạo.                                                                             |
| `updated_ts`  | `bigint`       | `NOT NULL`, `AUTO_UPDATE_ON_CHANGE`             | Unix timestamp được tự động cập nhật mỗi khi thông tin quyền hạn thay đổi.                                         |

**Indexes:**

- `idx_permissions_name` ON `permissions` (`name`)
- `idx_permissions_group_name` ON `permissions` (`group_name`)

### 4. Bảng `user_roles`

Bảng trung gian để quản lý mối quan hệ many-to-many giữa `users` và `roles`.

| Tên cột       | Kiểu dữ liệu | Ràng buộc                                       | Mô tả                                                |
| ------------- | ------------ | ----------------------------------------------- | ---------------------------------------------------- |
| `user_id`     | `bigint`     | `NOT NULL`                                      | ID của người dùng (tham chiếu logic tới `users.id`). |
| `role_id`     | `integer`    | `NOT NULL`                                      | ID của vai trò (tham chiếu logic tới `roles.id`).    |
| `assigned_ts` | `bigint`     | `NOT NULL`, `DEFAULT extract(epoch from now())` | Unix timestamp khi vai trò được gán cho người dùng.  |
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
| `assigned_ts`   | `bigint`     | `NOT NULL`, `DEFAULT extract(epoch from now())` | Unix timestamp khi quyền hạn được gán cho vai trò.        |
|                 |              | `PRIMARY KEY (role_id, permission_id)`          | Khóa chính kết hợp.                                       |

**Indexes:**

- `idx_role_permissions_role_id` ON `role_permissions` (`role_id`)
- `idx_role_permissions_permission_id` ON `role_permissions` (`permission_id`)

### 6. Bảng `refresh_tokens`

Lưu trữ thông tin về các refresh token đang hoạt động để quản lý phiên đăng nhập và cơ chế xoay vòng token.

| Tên cột       | Kiểu dữ liệu   | Ràng buộc                                       | Mô tả                                                                     |
| ------------- | -------------- | ----------------------------------------------- | ------------------------------------------------------------------------- |
| `id`          | `bigserial`    | `PRIMARY KEY`                                   | ID duy nhất của bản ghi refresh token (tự tăng).                          |
| `user_id`     | `bigint`       | `NOT NULL`                                      | ID của người dùng sở hữu token này (tham chiếu logic tới `users.id`).     |
| `token_hash`  | `varchar(255)` | `UNIQUE`, `NOT NULL`                            | Hash của refresh token (không lưu token gốc).                             |
| `family_id`   | `uuid`         | `NOT NULL`                                      | ID để nhóm các token xoay vòng (token cũ và token mới sau khi xoay vòng). |
| `device_info` | `text`         |                                                 | Thông tin thiết bị (ví dụ: User Agent) (tùy chọn).                        |
| `ip_address`  | `varchar(45)`  |                                                 | Địa chỉ IP khi token được tạo (tùy chọn).                                 |
| `is_active`   | `smallint`     | `NOT NULL`, `DEFAULT 1`                         | Trạng thái token (ví dụ: `1` cho active, `0` cho inactive/revoked).       |
| `expires_ts`  | `bigint`       | `NOT NULL`                                      | Unix timestamp khi token hết hạn.                                         |
| `created_ts`  | `bigint`       | `NOT NULL`, `DEFAULT extract(epoch from now())` | Unix timestamp khi token được tạo.                                        |
| `revoked_ts`  | `bigint`       |                                                 | Unix timestamp khi token bị thu hồi (do logout, xoay vòng, v.v...).       |

**Indexes:**

- `idx_refresh_tokens_user_id` ON `refresh_tokens` (`user_id`)
- `idx_refresh_tokens_token_hash` ON `refresh_tokens` (`token_hash`)
- `idx_refresh_tokens_family_id` ON `refresh_tokens` (`family_id`)
- `idx_refresh_tokens_expires_ts` ON `refresh_tokens` (`expires_ts`)

### 7. Bảng `password_reset_otps`

Lưu trữ mã OTP (One-Time Password) hoặc token dùng cho việc yêu cầu đặt lại mật khẩu.

| Tên cột      | Kiểu dữ liệu   | Ràng buộc                                       | Mô tả                                                                         |
| ------------ | -------------- | ----------------------------------------------- | ----------------------------------------------------------------------------- |
| `id`         | `bigserial`    | `PRIMARY KEY`                                   | ID duy nhất của bản ghi OTP (tự tăng).                                        |
| `user_id`    | `bigint`       | `NOT NULL`                                      | ID của người dùng yêu cầu đặt lại mật khẩu (tham chiếu logic tới `users.id`). |
| `otp_hash`   | `varchar(255)` | `NOT NULL`                                      | Hash của OTP (không lưu OTP gốc).                                             |
| `expires_ts` | `bigint`       | `NOT NULL`                                      | Unix timestamp khi OTP hết hạn.                                               |
| `used_ts`    | `bigint`       |                                                 | Unix timestamp khi OTP được sử dụng (NULL nếu chưa sử dụng).                  |
| `created_ts` | `bigint`       | `NOT NULL`, `DEFAULT extract(epoch from now())` | Unix timestamp khi OTP được tạo.                                              |

**Indexes:**

- `idx_password_reset_otps_user_id` ON `password_reset_otps` (`user_id`)
- `idx_password_reset_otps_otp_hash` ON `password_reset_otps` (`otp_hash`)
- `idx_password_reset_otps_expires_ts` ON `password_reset_otps` (`expires_ts`)

## Enum và Tham chiếu

- **`UserStatusEnum`**: Sẽ được định nghĩa trong `@repo/common`. Các giá trị dự kiến: `PENDING_VERIFICATION`, `ACTIVE`, `SUSPENDED`, `BANNED`.
- **`RoleEnum`**: Sẽ được định nghĩa trong `@repo/common`. Các giá trị dự kiến: `SUPER_ADMIN`, `ADMIN`, `USER`, `GUEST`.
- **`PermissionEnum`**: Sẽ được định nghĩa trong `@repo/common`. Cấu trúc tên quyền ví dụ: `RESOURCE:ACTION` (ví dụ: `USERS:CREATE`, `USERS:READ_ALL`, `PROFILE:UPDATE_OWN`).

## Lưu ý thêm

- Cân nhắc thêm cơ chế dọn dẹp (cleanup) cho các bảng như `refresh_tokens` (xóa token hết hạn) và `password_reset_otps` (xóa OTP hết hạn và đã sử dụng).
- `DEFAULT extract(epoch from now())` được sử dụng để lấy Unix timestamp hiện tại (số giây).
- Việc không sử dụng khóa ngoại đòi hỏi tầng ứng dụng phải đảm bảo tính toàn vẹn và nhất quán của dữ liệu khi thực hiện các thao tác CUD (Create, Update, Delete) liên quan đến các thực thể logic. Ví dụ, khi xóa một user, ứng dụng cần xóa các bản ghi liên quan trong `user_roles`, `refresh_tokens`, `password_reset_otps`.
- Đối với `account_status` trong bảng `users`, `DEFAULT 0` giả định `0` là một trạng thái khởi tạo hợp lệ (ví dụ `PENDING_VERIFICATION` hoặc `ACTIVE` nếu không có bước xác minh). Điều này cần khớp với định nghĩa của `UserStatusEnum`.
- Cột `family_id` trong `refresh_tokens` (vẫn giữ kiểu `uuid` để đảm bảo tính duy nhất toàn cục và khó đoán) giúp phát hiện việc sử dụng lại một refresh token đã bị xoay vòng. Khi một refresh token được sử dụng, nó sẽ bị vô hiệu hóa và một cặp token mới (access + refresh) được tạo ra với cùng `family_id`. Refresh token mới sẽ được lưu, token cũ bị đánh dấu `revoked_ts`.

Tài liệu này sẽ được cập nhật khi có thay đổi hoặc yêu cầu mới.
