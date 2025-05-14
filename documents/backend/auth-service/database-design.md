# Tài liệu Thiết kế Cơ sở dữ liệu: Auth Service

**Phiên bản:** 1.1
**Ngày tạo:** {{CURRENT_DATE}}
**Ngày cập nhật:** {{CURRENT_DATE}}

---

## 1. Giới thiệu

Tài liệu này mô tả chi tiết thiết kế cơ sở dữ liệu cho Dịch vụ Xác thực và Quản lý Người dùng (Auth Service). Cơ sở dữ liệu được sử dụng là PostgreSQL, và việc tương tác với cơ sở dữ liệu sẽ thông qua Drizzle ORM.

Thiết kế này tuân thủ các quy tắc đã được định nghĩa trong `database-rule.mdc`:

- Tên bảng và tên cột luôn được đặt dạng `snake_case`.
- Không sử dụng relationship ở mức ORM/logic (sử dụng bảng map cho quan hệ nhiều-nhiều và truy vấn riêng). Khóa ngoại (Foreign Keys) vẫn được sử dụng ở mức cơ sở dữ liệu để đảm bảo tính toàn vẹn dữ liệu. Điều này áp dụng cho cả các mối quan hệ 1-1 (nếu có), dữ liệu sẽ được truy vấn riêng biệt.
- Các trường dữ liệu chứa trạng thái (ví dụ: `account_status`) sẽ được lưu dạng số (ví dụ: `smallint`).
- Các trường thời gian phải được lưu dưới dạng Unix timestamp (`bigint`).
- Các trường `id` chính của bảng sẽ là kiểu `serial` (integer tự tăng).

## 2. Định nghĩa Lược đồ (Schema)

Dưới đây là định nghĩa chi tiết cho từng bảng trong cơ sở dữ liệu của `auth-service`.

### 2.1. Bảng: `users`

Lưu trữ thông tin người dùng.

| Tên cột             | Kiểu dữ liệu   | Ràng buộc                                 | Mô tả                                                                                                       |
| ------------------- | -------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `id`                | `serial`       | Primary Key                               | ID tự tăng duy nhất của người dùng.                                                                         |
| `username`          | `varchar(50)`  | Unique, Not Null                          | Tên định danh duy nhất của người dùng.                                                                      |
| `display_name`      | `varchar(200)` | Nullable                                  | Tên hiển thị của người dùng.                                                                                |
| `email`             | `varchar(255)` | Unique, Not Null                          | Địa chỉ email của người dùng, dùng để đăng nhập.                                                            |
| `hashed_password`   | `varchar(255)` | Not Null                                  | Mật khẩu đã được hash an toàn của người dùng.                                                               |
| `avatar_url`        | `text`         | Nullable                                  | URL ảnh đại diện của người dùng.                                                                            |
| `email_verified_ts` | `bigint`       | Nullable                                  | Unix timestamp thời điểm email được xác thực (cho giai đoạn sau).                                           |
| `account_status`    | `smallint`     | Not Null, Default: 0                      | Trạng thái tài khoản (0: active, 1: inactive, 2: suspended). Ánh xạ tới `UserStatusEnum` từ `@repo/common`. |
| `created_ts`        | `bigint`       | Not Null, Default: current Unix timestamp | Unix timestamp thời điểm tạo tài khoản.                                                                     |
| `updated_ts`        | `bigint`       | Not Null, Default: current Unix timestamp | Unix timestamp thời điểm cập nhật tài khoản lần cuối.                                                       |
| `deleted_ts`        | `bigint`       | Nullable                                  | Unix timestamp thời điểm xoá mềm tài khoản.                                                                 |

### 2.2. Bảng: `password_reset_otps`

Lưu trữ thông tin OTP (One-Time Password) cho việc đặt lại mật khẩu.

| Tên cột      | Kiểu dữ liệu  | Ràng buộc                                 | Mô tả                                                               |
| ------------ | ------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| `id`         | `serial`      | Primary Key                               | ID tự tăng duy nhất của bản ghi OTP.                                |
| `user_id`    | `integer`     | Not Null, Foreign Key (`users.id`)        | ID của người dùng yêu cầu đặt lại mật khẩu.                         |
| `otp_value`  | `varchar(10)` | Not Null                                  | Giá trị OTP (MVP: "111111", sau này là OTP thật hoặc hash của OTP). |
| `expires_ts` | `bigint`      | Not Null                                  | Unix timestamp thời điểm OTP hết hạn.                               |
| `created_ts` | `bigint`      | Not Null, Default: current Unix timestamp | Unix timestamp thời điểm tạo OTP.                                   |
| `used_ts`    | `bigint`      | Nullable                                  | Unix timestamp thời điểm OTP được sử dụng.                          |

### 2.3. Bảng: `roles`

Lưu trữ thông tin về các vai trò trong hệ thống.

| Tên cột       | Kiểu dữ liệu  | Ràng buộc                                 | Mô tả                                                                                 |
| ------------- | ------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- |
| `id`          | `serial`      | Primary Key                               | ID tự tăng duy nhất của vai trò.                                                      |
| `name`        | `varchar(50)` | Unique, Not Null                          | Tên vai trò (ví dụ: 'SYSTEM_ADMIN', 'USER'). Ánh xạ tới `RoleEnum` từ `@repo/common`. |
| `description` | `text`        | Nullable                                  | Mô tả chi tiết về vai trò.                                                            |
| `created_ts`  | `bigint`      | Not Null, Default: current Unix timestamp | Unix timestamp thời điểm tạo vai trò.                                                 |
| `updated_ts`  | `bigint`      | Not Null, Default: current Unix timestamp | Unix timestamp thời điểm cập nhật vai trò lần cuối.                                   |

### 2.4. Bảng: `permissions`

Lưu trữ thông tin về các quyền hạn trong hệ thống.

| Tên cột       | Kiểu dữ liệu   | Ràng buộc                                 | Mô tả                                                                                            |
| ------------- | -------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `id`          | `serial`       | Primary Key                               | ID tự tăng duy nhất của quyền.                                                                   |
| `name`        | `varchar(100)` | Unique, Not Null                          | Tên quyền (ví dụ: 'CONTENT_VIEW', 'USER_MANAGE'). Ánh xạ tới `PermissionEnum` từ `@repo/common`. |
| `description` | `text`         | Nullable                                  | Mô tả chi tiết về quyền.                                                                         |
| `group_name`  | `varchar(50)`  | Nullable                                  | Tên nhóm quyền (ví dụ: 'user_management', 'article_management').                                 |
| `created_ts`  | `bigint`       | Not Null, Default: current Unix timestamp | Unix timestamp thời điểm tạo quyền.                                                              |
| `updated_ts`  | `bigint`       | Not Null, Default: current Unix timestamp | Unix timestamp thời điểm cập nhật quyền lần cuối.                                                |

### 2.5. Bảng: `user_roles` (Bảng map)

Bảng trung gian để map mối quan hệ nhiều-nhiều giữa người dùng và vai trò.

| Tên cột         | Kiểu dữ liệu | Ràng buộc                                 | Mô tả                                                |
| --------------- | ------------ | ----------------------------------------- | ---------------------------------------------------- |
| `user_id`       | `integer`    | Not Null, Foreign Key (`users.id`)        | ID của người dùng.                                   |
| `role_id`       | `integer`    | Not Null, Foreign Key (`roles.id`)        | ID của vai trò.                                      |
| `assigned_ts`   | `bigint`     | Not Null, Default: current Unix timestamp | Unix timestamp thời điểm gán vai trò cho người dùng. |
| **Primary Key** |              | (`user_id`, `role_id`)                    |                                                      |

### 2.6. Bảng: `role_permissions` (Bảng map)

Bảng trung gian để map mối quan hệ nhiều-nhiều giữa vai trò và quyền hạn.

| Tên cột         | Kiểu dữ liệu | Ràng buộc                                 | Mô tả                                           |
| --------------- | ------------ | ----------------------------------------- | ----------------------------------------------- |
| `role_id`       | `integer`    | Not Null, Foreign Key (`roles.id`)        | ID của vai trò.                                 |
| `permission_id` | `integer`    | Not Null, Foreign Key (`permissions.id`)  | ID của quyền.                                   |
| `assigned_ts`   | `bigint`     | Not Null, Default: current Unix timestamp | Unix timestamp thời điểm gán quyền cho vai trò. |
| **Primary Key** |              | (`role_id`, `permission_id`)              |                                                 |

## 3. Chỉ mục (Indexes)

### 3.1. Chỉ mục B-Tree (Standard Indexes)

Các chỉ mục sau được đề xuất để cải thiện hiệu năng truy vấn:

- **Bảng `users`:**
  - `idx_users_email`: Trên cột `email` (unique index được tạo tự động).
  - `idx_users_username`: Trên cột `username` (unique index được tạo tự động).
  - `idx_users_id`: Trên cột `id` (tự động tạo cho Primary Key).
- **Bảng `password_reset_otps`:**
  - `idx_password_reset_otps_user_id`: Trên cột `user_id`.
- **Bảng `roles`:**
  - `idx_roles_name`: Trên cột `name` (unique index được tạo tự động).
- **Bảng `permissions`:**
  - `idx_permissions_name`: Trên cột `name` (unique index được tạo tự động).
- **Bảng `user_roles`:**
  - `idx_user_roles_user_id`: Trên cột `user_id`.
  - `idx_user_roles_role_id`: Trên cột `role_id`.
- **Bảng `role_permissions`:**
  - `idx_role_permissions_role_id`: Trên cột `role_id`.
  - `idx_role_permissions_permission_id`: Trên cột `permission_id`.

### 3.2. Chỉ mục cho Full-Text Search (FTS)

Để hỗ trợ tìm kiếm toàn văn bản hiệu quả trên các trường tên, cần tạo các chỉ mục GIN hoặc GiST trên cột `tsvector`.

- **Bảng `users`:**
  - Cho `username`: Tạo một cột `tsvector` từ `username` và đánh index GIN/GiST trên đó.
  - Cho `display_name`: Tạo một cột `tsvector` từ `display_name` và đánh index GIN/GiST trên đó.

**Ví dụ (PostgreSQL):**

```sql
-- Đối với bảng users, cột username
ALTER TABLE users ADD COLUMN username_tsv tsvector;
UPDATE users SET username_tsv = to_tsvector('simple', username); -- Hoặc ngôn ngữ khác
CREATE INDEX users_username_tsv_idx ON users USING gin(username_tsv);
-- Cần có trigger để tự động cập nhật cột tsv khi username thay đổi.

-- Tương tự cho display_name.
```

Lưu ý: Việc chọn 'simple' hay một cấu hình ngôn ngữ cụ thể (ví dụ: 'english') cho `to_tsvector` phụ thuộc vào yêu cầu của ngôn ngữ tìm kiếm. Cần thiết lập trigger để tự động cập nhật các cột `tsvector` khi dữ liệu gốc thay đổi.

## 4. Lưu ý về "Relationships" và Khóa ngoại

Theo `database-rule.mdc`, chúng ta "không sử dụng relationship trong bất kỳ tình huống nào (sử dụng bảng map thay thế)". Điều này được hiểu là:

- **Quan hệ Nhiều-Nhiều (Many-to-Many):** Luôn sử dụng bảng map (ví dụ: `user_roles`, `role_permissions`) như đã thiết kế. Khóa ngoại (Foreign Key constraints) VẪN được sử dụng trong các bảng map này để đảm bảo tính toàn vẹn dữ liệu.
- **Quan hệ Một-Nhiều (One-to-Many):**
  - Ở mức cơ sở dữ liệu, khóa ngoại (Foreign Key constraints) VẪN được sử dụng (ví dụ: `password_reset_otps.user_id` tham chiếu đến `users.id`) để đảm bảo tính toàn vẹn và nhất quán của dữ liệu.
- **Quan hệ Một-Một (One-to-One):**
  - Sẽ KHÔNG sử dụng khóa ngoại (Foreign Key constraints) ở mức cơ sở dữ liệu cho các mối quan hệ 1-1. Việc đảm bảo tính toàn vẹn dữ liệu cho các mối quan hệ này sẽ được xử lý ở tầng ứng dụng. Quyết định này được đưa ra nhằm mục đích tối ưu hóa hiệu suất cho các tác vụ chèn (insert) và cho phép kiểm soát logic toàn vẹn dữ liệu một cách linh hoạt ở tầng ứng dụng.
- **Truy vấn dữ liệu liên quan:**
  - Ở mức ORM (Drizzle) hoặc logic ứng dụng, chúng ta sẽ không định nghĩa các "relations" lồng nhau để tự động join và lấy dữ liệu liên quan cho bất kỳ loại quan hệ nào (1-1, 1-N, M-N). Thay vào đó, các truy vấn sẽ được thực hiện riêng biệt cho từng bảng khi cần. Ví dụ, để lấy thông tin OTP của một user, sẽ có một truy vấn đến bảng `password_reset_otps` với `user_id` cụ thể. Tương tự, nếu có một bảng profile (quan hệ 1-1 với user), chúng ta sẽ truy vấn bảng profile đó riêng biệt bằng `user_id`.

Cách tiếp cận này giúp giữ cho các truy vấn đơn giản, dễ kiểm soát và tuân thủ quy tắc đã đặt ra, đồng thời cân bằng giữa việc đảm bảo tính toàn vẹn dữ liệu (thông qua khóa ngoại ở những nơi cần thiết và logic ứng dụng) và hiệu suất hệ thống.
