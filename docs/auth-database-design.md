# Tài Liệu Thiết Kế Database - Hệ Thống Xác Thực (Auth System)

## 1. Tổng Quan

### 1.1. Mục Đích

Tài liệu này mô tả thiết kế database cho hệ thống xác thực (authentication) và ủy quyền (authorization) của WibuSystem. Hệ thống hỗ trợ đa dạng các phương thức xác thực và quản lý người dùng một cách linh hoạt.

### 1.2. Phạm Vi

- Quản lý người dùng và thông tin cá nhân
- Xác thực đa phương thức (email, phone, OAuth)
- Phân quyền theo vai trò (Role-Based Access Control)
- Quản lý tổ chức và thành viên
- Quản lý phiên đăng nhập và thiết bị
- Hệ thống nhóm dịch (Translation Groups)
- Quản lý subscription và thanh toán

### 1.3. Công Nghệ Sử Dụng

- **Database**: PostgreSQL
- **Ngôn ngữ**: TypeScript
- **Index**: B-tree, GIN (Full-text search)

## 2. Kiến Trúc Database

### 2.1. Nguyên Tắc Thiết Kế

- **Bảo mật**: Mọi thông tin nhạy cảm đều được mã hóa
- **Hiệu suất**: Sử dụng index phù hợp cho các truy vấn thường xuyên
- **Mở rộng**: Thiết kế linh hoạt để dễ dàng thêm tính năng mới
- **Tính toàn vẹn**: Sử dụng constraints và foreign keys
- **Audit trail**: Lưu trữ thời gian tạo và cập nhật

### 2.2. Quy Ước Đặt Tên

- **Bảng**: Snake_case, số nhiều (users, user_roles)
- **Cột**: Snake_case (user_id, created_at)
- **Index**: Tên bảng + cột + "idx" (users_email_idx)
- **Unique Index**: Tên bảng + "unique_idx"

## 3. Sơ Đồ Mối Quan Hệ (ERD)

```
users ||--o{ user_profiles : "1:1"
users ||--o{ user_identity : "1:n"
users ||--o{ user_addresses : "1:n"
users ||--o{ user_follows : "1:n (follower)"
users ||--o{ user_follows : "1:n (following)"
users ||--o{ user_subscriptions : "1:n"
users ||--o{ sessions : "1:n"
users ||--o{ api_key : "1:n"
users ||--o{ verification_code : "1:n"
users ||--o{ password_resets : "1:n"
users ||--o{ mfa : "1:n"
users ||--o{ user_role : "1:n"
users ||--o{ organization_membership : "1:n"

roles ||--o{ role_permission : "1:n"
roles ||--o{ user_role : "1:n"
permissions ||--o{ role_permission : "1:n"

organizations ||--o{ organization_membership : "1:n"
organizations ||--o{ organization_invitations : "1:n"

webhooks (standalone table)
```

## 4. Danh Sách Các Bảng

### 4.1. Nhóm Quản Lý Người Dùng

- `users` - Thông tin người dùng chính
- `user_profiles` - Thông tin mở rộng của người dùng
- `user_identity` - Các phương thức xác thực
- `user_addresses` - Địa chỉ của người dùng
- `user_follows` - Quan hệ theo dõi giữa người dùng
- `user_subscriptions` - Gói subscription của người dùng

### 4.2. Nhóm Xác Thực & Phiên

- `sessions` - Phiên đăng nhập
- `api_key` - API keys cho developers
- `verification_code` - Mã xác thực
- `password_resets` - Token đặt lại mật khẩu
- `mfa` - Cấu hình xác thực đa yếu tố

### 4.3. Nhóm Phân Quyền

- `roles` - Các vai trò trong hệ thống
- `permissions` - Quyền hạn cụ thể
- `role_permission` - Liên kết vai trò với quyền hạn
- `user_role` - Vai trò của người dùng

### 4.4. Nhóm Tổ Chức

- `organizations` - Thông tin tổ chức
- `organization_membership` - Thành viên tổ chức
- `organization_invitations` - Lời mời tham gia tổ chức

### 4.5. Nhóm Dịch Thuật

- Đã được tích hợp vào `organizations` với `type = 1` (translation_group)
- Membership được quản lý thông qua `organization_membership`

### 4.6. Nhóm Hệ Thống

- `webhooks` - Cấu hình webhook

## 5. Chi Tiết Schema

### 5.1. Bảng Users - Thông tin người dùng chính

**Mục đích**: Lưu trữ thông tin cơ bản của người dùng.

#### SQL DDL

```sql
-- Tạo bảng users
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,                                   -- ID người dùng, khóa chính
    user_name VARCHAR(255) NOT NULL DEFAULT '',                -- Tên đăng nhập, dùng để đăng nhập và hiển thị
    email VARCHAR(255) NOT NULL DEFAULT '' UNIQUE,             -- Email người dùng, dùng để đăng nhập và liên hệ
    password VARCHAR(500) NOT NULL DEFAULT '',                 -- Mật khẩu đã được hash
    phone_number VARCHAR(20) NOT NULL DEFAULT '',              -- Số điện thoại, có thể dùng để đăng nhập và xác thực
    display_name VARCHAR(255) NOT NULL DEFAULT '',             -- Tên hiển thị, dùng để hiển thị trên UI
    avatar_url TEXT NOT NULL DEFAULT '',                       -- URL ảnh đại diện
    cover_url TEXT NOT NULL DEFAULT '',                        -- URL ảnh bìa
    bio JSONB NOT NULL DEFAULT {},                              -- Tiểu sử, giới thiệu ngắn về người dùng
    gender SMALLINT NOT NULL DEFAULT 0,                        -- Giới tính: 0: khác, 1: nam, 2: nữ
    date_of_birth BIGINT NOT NULL DEFAULT 0,                   -- Ngày sinh, lưu dạng timestamp (unix time)
    metadata JSONB NOT NULL DEFAULT '{}',                      -- Dữ liệu mở rộng, lưu các thông tin bổ sung
    is_email_verified BOOLEAN NOT NULL DEFAULT false,          -- Trạng thái xác thực email
    is_phone_verified BOOLEAN NOT NULL DEFAULT false,          -- Trạng thái xác thực số điện thoại
    is_active BOOLEAN NOT NULL DEFAULT false,                  -- Trạng thái hoạt động của tài khoản
    is_deleted BOOLEAN NOT NULL DEFAULT false,                 -- Trạng thái xóa (soft delete)
    versions INTEGER NOT NULL DEFAULT 0,                       -- Phiên bản update
    created_at BIGINT NOT NULL DEFAULT 0,                      -- Thời gian tạo, dạng unix time
    updated_at BIGINT NOT NULL DEFAULT 0                       -- Thời gian cập nhật gần nhất, dạng unix time
);

-- Tạo các index
CREATE INDEX users_email_idx ON users(email);                  -- Index cho email để tìm kiếm nhanh
CREATE INDEX users_username_idx ON users(user_name);           -- Index cho username để tìm kiếm nhanh
CREATE INDEX users_phone_idx ON users(phone_number);           -- Index cho số điện thoại để tìm kiếm nhanh
CREATE INDEX users_display_name_fts_idx ON users USING gin(to_tsvector('simple', display_name)); -- GIN index cho FTS không phân biệt ngôn ngữ

-- Thêm check constraints
ALTER TABLE users ADD CONSTRAINT chk_users_gender CHECK (gender >= 0 AND gender <= 2);
```

**Business Rules**:

- Email phải duy nhất trong hệ thống
- Password được hash trước khi lưu trữ
- Soft delete thông qua trường `is_deleted`
- Gender values: 0=Khác, 1=Nam, 2=Nữ

---

### 5.2. Bảng API Key - API keys cho developers

**Mục đích**: Quản lý API keys cho các ứng dụng third-party và developer tools.

#### SQL DDL

```sql
-- Tạo bảng api_key
CREATE TABLE api_key (
    id BIGSERIAL PRIMARY KEY,                                    -- ID của API key, khóa chính
    user_id BIGINT NOT NULL DEFAULT 0,                         -- Liên kết đến bảng User
    api_key VARCHAR(255) NOT NULL DEFAULT '' UNIQUE,            -- API key, mã duy nhất để xác thực
    description VARCHAR(255) NOT NULL DEFAULT '',               -- Mô tả về API key, giúp người dùng nhận biết
    is_active BOOLEAN NOT NULL DEFAULT true,                    -- Trạng thái kích hoạt của API key
    versions INTEGER NOT NULL DEFAULT 0,                        -- Phiên bản update
    created_at BIGINT NOT NULL DEFAULT 0,                       -- Thời gian tạo, dạng unix time
    updated_at BIGINT NOT NULL DEFAULT 0                        -- Thời gian cập nhật gần nhất, dạng unix time
);

-- Tạo các index
CREATE INDEX api_key_user_id_idx ON api_key(user_id);          -- Index cho user_id để tìm kiếm nhanh
CREATE INDEX api_key_api_key_idx ON api_key(api_key);          -- Index cho api_key để tìm kiếm nhanh
CREATE INDEX api_key_is_active_idx ON api_key(is_active);      -- Index cho is_active để lọc API key đang hoạt động

-- Thêm foreign key constraint (nếu cần)
-- ALTER TABLE api_key ADD CONSTRAINT fk_api_key_user_id FOREIGN KEY (user_id) REFERENCES users(id);
```

**Mối quan hệ**:

- `user_id` → `users.id` (Many-to-One)

**Business Rules**:

- Mỗi user có thể có nhiều API keys
- API key phải là duy nhất trong toàn hệ thống
- API key có thể bị vô hiệu hóa mà không cần xóa
- API key được generate bằng cryptographically secure random
- Mặc định API key được kích hoạt khi tạo

---

### 5.3. Bảng Sessions - Phiên đăng nhập và quản lý thiết bị

**Mục đích**: Quản lý phiên đăng nhập của người dùng với đầy đủ thông tin thiết bị và bảo mật.

#### SQL DDL

```sql
-- Tạo bảng sessions (gộp device_tokens và sessions)
CREATE TABLE sessions (
    id BIGSERIAL PRIMARY KEY,                                    -- ID của phiên, khóa chính
    user_id BIGINT NOT NULL DEFAULT 0,                         -- Liên kết đến bảng User

    -- Token management
    access_token TEXT NOT NULL UNIQUE,                          -- JWT access token
    refresh_token TEXT NOT NULL DEFAULT '',                     -- Token để làm mới access token

    -- Device information
    device_id VARCHAR(255) NOT NULL DEFAULT '',                 -- UUID thiết bị do client tạo
    device_fingerprint TEXT NOT NULL DEFAULT '',               -- Fingerprint để phát hiện duplicate
    device_token TEXT NOT NULL DEFAULT '',
    device_name VARCHAR(255) NOT NULL DEFAULT '',              -- Tên thiết bị
    device_type VARCHAR(50) NOT NULL DEFAULT '',               -- mobile, tablet, desktop
    device_os VARCHAR(255) NOT NULL DEFAULT '',                -- Hệ điều hành
    device_browser VARCHAR(255) NOT NULL DEFAULT '',           -- Trình duyệt

    -- Network information
    user_agent VARCHAR(500) NOT NULL DEFAULT '',               -- User agent đầy đủ
    ip_address VARCHAR(64) NOT NULL DEFAULT '',                -- Địa chỉ IP đăng nhập
    location VARCHAR(255) NOT NULL DEFAULT '',                 -- Vị trí địa lý ước tính

    -- Security and permissions
    roles JSONB NOT NULL DEFAULT '[]',                         -- Roles
    permissions JSONB NOT NULL DEFAULT '[]',                   -- Quyền cho phép của session
    metadata JSONB NOT NULL DEFAULT '{}',                      -- Thông tin bổ sung
    risk_score SMALLINT NOT NULL DEFAULT 0,                    -- Điểm rủi ro (0-100)

    -- Usage tracking
    request_count BIGINT NOT NULL DEFAULT 0,                   -- Số lượng request đã thực hiện
    last_used_at BIGINT NOT NULL DEFAULT 0,                    -- Lần sử dụng cuối

    -- Status management
    is_active BOOLEAN NOT NULL DEFAULT true,                   -- Trạng thái hoạt động của phiên
    is_blocked BOOLEAN NOT NULL DEFAULT false,                 -- Trạng thái block
    blocked_reason VARCHAR(255) NOT NULL DEFAULT '',           -- Lý do block

    -- Time management
    lasted_user_modified BIGINT NOT NULL DEFAULT 0,
    expires_at BIGINT NOT NULL DEFAULT 0,                      -- Thời gian hết hạn phiên
    revoked_at BIGINT NOT NULL DEFAULT 0,                      -- Thời gian thu hồi phiên
    versions INTEGER NOT NULL DEFAULT 0,                       -- Phiên bản update
    created_at BIGINT NOT NULL DEFAULT 0,                      -- Thời gian tạo phiên
    updated_at BIGINT NOT NULL DEFAULT 0                       -- Thời gian cập nhật
);

-- Tạo các index
CREATE INDEX sessions_user_id_idx ON sessions(user_id);                    -- Index cho user_id để tìm kiếm nhanh
CREATE INDEX sessions_access_token_idx ON sessions(access_token);          -- Index cho access_token để xác thực nhanh
CREATE INDEX sessions_device_id_idx ON sessions(device_id);                -- Index cho device_id để tìm kiếm nhanh
CREATE INDEX sessions_device_fingerprint_idx ON sessions(device_fingerprint); -- Index cho fingerprint để phát hiện duplicate
CREATE INDEX sessions_ip_address_idx ON sessions(ip_address);              -- Index cho IP tracking
CREATE INDEX sessions_is_active_idx ON sessions(is_active);                -- Index cho is_active để lọc phiên đang hoạt động
CREATE INDEX sessions_is_blocked_idx ON sessions(is_blocked);              -- Index cho is_blocked để lọc phiên bị block
CREATE INDEX sessions_expires_at_idx ON sessions(expires_at);              -- Index cho expires_at để lọc phiên hết hạn
CREATE INDEX sessions_last_used_idx ON sessions(last_used_at);             -- Index cho last_used_at để cleanup

-- Thêm foreign key constraint (nếu cần)
-- ALTER TABLE sessions ADD CONSTRAINT fk_sessions_user_id FOREIGN KEY (user_id) REFERENCES users(id);

-- Thêm check constraints
ALTER TABLE sessions ADD CONSTRAINT chk_sessions_risk_score CHECK (risk_score >= 0 AND risk_score <= 100);
```

**Mối quan hệ**:

- `user_id` → `users.id` (Many-to-One)

**Business Rules**:

- Mỗi user có thể có nhiều sessions đồng thời
- Access token phải là duy nhất trong toàn hệ thống
- Session có thể bị block hoặc revoke mà không cần xóa
- Risk score từ 0-100 để đánh giá mức độ rủi ro
- Session tự động expire sau thời gian định trước
- Device fingerprint giúp phát hiện thiết bị trùng lặp

---

### 5.4. Bảng MFA - Xác thực đa yếu tố

**Mục đích**: Quản lý cấu hình xác thực đa yếu tố (Multi-Factor Authentication) cho người dùng.

#### SQL DDL

```sql
-- Tạo bảng mfa
CREATE TABLE mfa (
    id SERIAL PRIMARY KEY,                                       -- ID của cấu hình MFA, khóa chính
    user_id BIGINT NOT NULL DEFAULT 0,                         -- Liên kết đến bảng User
    secret VARCHAR(64) NOT NULL DEFAULT '',                     -- Khóa bí mật dùng để tạo mã MFA
    type SMALLINT NOT NULL DEFAULT 0,                          -- Loại MFA: 0: TOTP (Google Authenticator), 1: SMS, 2: Email, 3: Hardware Token
    is_active BOOLEAN NOT NULL DEFAULT true,                   -- Trạng thái kích hoạt của MFA
    versions INTEGER NOT NULL DEFAULT 0,                       -- Phiên bản update
    created_at BIGINT NOT NULL DEFAULT 0                       -- Thời gian tạo, dạng unix time
);

-- Tạo các index
CREATE INDEX mfa_user_id_idx ON mfa(user_id);                  -- Index cho user_id để tìm kiếm nhanh
CREATE INDEX mfa_type_idx ON mfa(type);                        -- Index cho type để lọc theo loại
CREATE INDEX mfa_is_active_idx ON mfa(is_active);              -- Index cho is_active để lọc MFA đang hoạt động

-- Thêm foreign key constraint (nếu cần)
-- ALTER TABLE mfa ADD CONSTRAINT fk_mfa_user_id FOREIGN KEY (user_id) REFERENCES users(id);

-- Thêm check constraints
ALTER TABLE mfa ADD CONSTRAINT chk_mfa_type CHECK (type >= 0 AND type <= 3);
```

**Mối quan hệ**:

- `user_id` → `users.id` (Many-to-One)

**Business Rules**:

- Mỗi user có thể có nhiều phương thức MFA
- Secret được mã hóa trước khi lưu trữ
- Chỉ có thể có một MFA method active cùng lúc cho mỗi type
- Type values: 0=TOTP, 1=SMS, 2=Email, 3=Hardware Token

**Bảo mật**:

- Secret phải được encrypt trước khi lưu database
- Backup codes nên được lưu trong bảng riêng
- Log tất cả MFA setup và usage events

---

### 5.5. Bảng Organizations - Quản lý tổ chức

**Mục đích**: Lưu trữ thông tin các tổ chức trong hệ thống.

#### SQL DDL

```sql
-- Tạo bảng organizations (gộp với translation groups)
CREATE TABLE organizations (
    id BIGSERIAL PRIMARY KEY,                                   -- ID của tổ chức, khóa chính
    name VARCHAR(255) NOT NULL DEFAULT '',                      -- Tên tổ chức
    slug VARCHAR(255) NOT NULL DEFAULT '' UNIQUE,               -- URL slug của tổ chức, dùng trong URL
    description TEXT NOT NULL DEFAULT '',                       -- Mô tả về tổ chức

    -- Branding & Visual
    logo_url TEXT NOT NULL DEFAULT '',                          -- URL logo của tổ chức
    cover_url TEXT NOT NULL DEFAULT '',                         -- URL ảnh bìa của tổ chức

    -- Organization Type & Category
    type SMALLINT NOT NULL DEFAULT 0,                          -- Loại tổ chức: 0: company, 1: translation_group, 2: community, 3: non_profit
    category VARCHAR(100) NOT NULL DEFAULT '',                 -- Danh mục: "business", "translation", "education", etc.

    -- Contact & External Links
    domain VARCHAR(255) NOT NULL DEFAULT '',                    -- Tên miền của tổ chức, dùng cho single sign-on
    website_url TEXT NOT NULL DEFAULT '',                       -- Website chính thức
    discord_url TEXT NOT NULL DEFAULT '',                       -- Discord server
    contact_email VARCHAR(255) NOT NULL DEFAULT '',             -- Email liên hệ
    contact_person_id BIGINT NOT NULL DEFAULT 0,               -- ID người liên hệ chính

    -- Translation Group Specific Fields
    specialties JSONB NOT NULL DEFAULT '[]',                   -- Chuyên môn: ["anime", "manga", "novel", "game"]
    supported_languages JSONB NOT NULL DEFAULT '[]',           -- Ngôn ngữ hỗ trợ: ["vi", "en", "ja", "ko"]
    recruitment_status SMALLINT NOT NULL DEFAULT 0,            -- Trạng thái tuyển dụng: 0: đóng, 1: mở, 2: có điều kiện
    quality_level SMALLINT NOT NULL DEFAULT 1,                 -- Mức chất lượng: 1-5 sao

    -- Statistics & Metrics
    total_projects INTEGER NOT NULL DEFAULT 0,                 -- Tổng số dự án đã hoàn thành
    total_members INTEGER NOT NULL DEFAULT 0,                  -- Tổng số thành viên
    rating INTEGER NOT NULL DEFAULT 0,                         -- Đánh giá từ cộng đồng (0-100)

    -- Status & Verification
    status SMALLINT NOT NULL DEFAULT 1,                        -- Trạng thái: 0: không hoạt động, 1: hoạt động, 2: tạm dừng, 3: đã đóng
    is_active BOOLEAN NOT NULL DEFAULT true,                   -- Trạng thái hoạt động (legacy support)
    is_verified BOOLEAN NOT NULL DEFAULT false,                -- Tổ chức đã được xác minh
    is_recruiting BOOLEAN NOT NULL DEFAULT false,              -- Đang tuyển thành viên

    -- Extended Data & Versioning
    metadata JSONB NOT NULL DEFAULT '{}',                      -- Dữ liệu mở rộng, settings, preferences
    lasted_user_update BIGINT NOT NULL DEFAULT 0,              -- User update cuối cùng
    versions INTEGER NOT NULL DEFAULT 0,                       -- Phiên bản update

    -- Timestamps
    created_at BIGINT NOT NULL DEFAULT 0,                      -- Thời gian tạo, dạng unix time
    updated_at BIGINT NOT NULL DEFAULT 0                       -- Thời gian cập nhật gần nhất, dạng unix time
);

-- Tạo các index
CREATE INDEX organizations_slug_idx ON organizations(slug);                    -- Index cho slug để tìm kiếm nhanh
CREATE INDEX organizations_type_idx ON organizations(type);                    -- Index cho type để lọc theo loại tổ chức
CREATE INDEX organizations_category_idx ON organizations(category);            -- Index cho category
CREATE INDEX organizations_domain_idx ON organizations(domain);                -- Index cho domain để tìm kiếm nhanh
CREATE INDEX organizations_status_idx ON organizations(status);                -- Index cho status
CREATE INDEX organizations_is_recruiting_idx ON organizations(is_recruiting); -- Index cho recruitment status
CREATE INDEX organizations_is_verified_idx ON organizations(is_verified);     -- Index cho verified organizations
CREATE INDEX organizations_quality_level_idx ON organizations(quality_level); -- Index cho quality level
CREATE INDEX organizations_name_fts_idx ON organizations USING gin(to_tsvector('simple', name)); -- GIN index cho FTS
CREATE INDEX organizations_description_fts_idx ON organizations USING gin(to_tsvector('simple', description)); -- FTS cho description
CREATE INDEX organizations_specialties_idx ON organizations USING gin(specialties); -- GIN index cho specialties JSON
CREATE INDEX organizations_supported_languages_idx ON organizations USING gin(supported_languages); -- GIN index cho languages
```

**Organization Types**:

- **0: Company** - Doanh nghiệp, công ty thương mại
- **1: Translation Group** - Nhóm dịch anime/manga/novel
- **2: Community** - Cộng đồng, forum, fan groups
- **3: Non-profit** - Tổ chức phi lợi nhuận

**Business Rules**:

- Slug phải duy nhất trong toàn hệ thống
- Domain có thể được sử dụng cho SSO integration
- Translation groups có thêm fields: specialties, supported_languages, quality_level
- Rating được tính từ feedback của community (0-100)
- Total members được update tự động từ organization_membership
- Recruitment status chỉ áp dụng cho translation groups và communities

---

### 5.6. Bảng Organization Membership - Thành viên tổ chức

**Mục đích**: Quản lý mối quan hệ giữa users và organizations.

#### SQL DDL

```sql
-- Tạo bảng organization_membership (mở rộng cho translation groups)
CREATE TABLE organization_membership (
    id BIGSERIAL PRIMARY KEY,                                  -- ID của thành viên, khóa chính
    organization_id BIGINT NOT NULL DEFAULT 0,                 -- Liên kết đến bảng Organization
    user_id BIGINT NOT NULL DEFAULT 0,                         -- Liên kết đến bảng User

    -- Role & Permissions
    role SMALLINT NOT NULL DEFAULT 0,                          -- Vai trò: 0: member, 1: translator, 2: editor, 3: proofreader, 4: admin, 5: owner
    specializations JSONB NOT NULL DEFAULT '[]',               -- Chuyên môn: ["translate", "edit", "proofread", "typeset", "encode"]
    languages JSONB NOT NULL DEFAULT '[]',                     -- Ngôn ngữ có thể dịch: ["vi", "en", "ja", "ko"]

    -- Member Information (for translation groups)
    join_reason VARCHAR(500) NOT NULL DEFAULT '',              -- Lý do tham gia
    experience_level SMALLINT NOT NULL DEFAULT 0,              -- Mức kinh nghiệm: 0: mới, 1: trung bình, 2: giỏi, 3: chuyên nghiệp

    -- Statistics & Performance
    completed_projects INTEGER NOT NULL DEFAULT 0,             -- Số dự án đã hoàn thành
    total_contributions INTEGER NOT NULL DEFAULT 0,            -- Tổng đóng góp
    rating INTEGER NOT NULL DEFAULT 0,                         -- Đánh giá từ nhóm (0-100)

    -- Status & Visibility
    status SMALLINT NOT NULL DEFAULT 1,                        -- Trạng thái: 0: pending, 1: active, 2: inactive, 3: banned
    is_public BOOLEAN NOT NULL DEFAULT true,                   -- Hiển thị công khai trong nhóm
    can_recruit BOOLEAN NOT NULL DEFAULT false,                -- Có thể tuyển thành viên mới

    -- Timestamps
    joined_at BIGINT NOT NULL DEFAULT 0,                       -- Thời gian tham gia
    last_active_at BIGINT NOT NULL DEFAULT 0,                  -- Lần hoạt động cuối
    versions INTEGER NOT NULL DEFAULT 0,                       -- Phiên bản update
    created_at BIGINT NOT NULL DEFAULT 0,                      -- Thời gian tạo, dạng unix time
    updated_at BIGINT NOT NULL DEFAULT 0                       -- Thời gian cập nhật gần nhất, dạng unix time
);

-- Tạo các index
CREATE INDEX org_membership_org_id_idx ON organization_membership(organization_id);     -- Index cho organization_id
CREATE INDEX org_membership_user_id_idx ON organization_membership(user_id);           -- Index cho user_id
CREATE INDEX org_membership_role_idx ON organization_membership(role);                 -- Index cho role
CREATE INDEX org_membership_status_idx ON organization_membership(status);             -- Index cho status
CREATE INDEX org_membership_experience_level_idx ON organization_membership(experience_level); -- Index cho experience level
CREATE INDEX org_membership_last_active_idx ON organization_membership(last_active_at); -- Index cho last active
CREATE INDEX org_membership_specializations_idx ON organization_membership USING gin(specializations); -- GIN index cho specializations
CREATE INDEX org_membership_languages_idx ON organization_membership USING gin(languages); -- GIN index cho languages
CREATE UNIQUE INDEX org_membership_unique_idx ON organization_membership(organization_id, user_id); -- Unique constraint

-- Thêm foreign key constraints (nếu cần)
-- ALTER TABLE organization_membership ADD CONSTRAINT fk_org_membership_org_id FOREIGN KEY (organization_id) REFERENCES organizations(id);
-- ALTER TABLE organization_membership ADD CONSTRAINT fk_org_membership_user_id FOREIGN KEY (user_id) REFERENCES users(id);

-- Thêm check constraints
ALTER TABLE organization_membership ADD CONSTRAINT chk_org_membership_role CHECK (role >= 0 AND role <= 5);
ALTER TABLE organization_membership ADD CONSTRAINT chk_org_membership_status CHECK (status >= 0 AND status <= 3);
ALTER TABLE organization_membership ADD CONSTRAINT chk_org_membership_experience_level CHECK (experience_level >= 0 AND experience_level <= 3);
ALTER TABLE organization_membership ADD CONSTRAINT chk_org_membership_rating CHECK (rating >= 0 AND rating <= 100);
```

**Mối quan hệ**:

- `organization_id` → `organizations.id` (Many-to-One)
- `user_id` → `users.id` (Many-to-One)

**Extended Role System**:

- **0: Member** - Thành viên cơ bản
- **1: Translator** - Người dịch (translation groups)
- **2: Editor** - Biên tập viên (translation groups)
- **3: Proofreader** - Người hiệu đính (translation groups)
- **4: Admin** - Quản trị viên
- **5: Owner** - Chủ sở hữu

**Business Rules**:

- Một user chỉ có thể có một membership trong một organization
- Translation group members có thêm: specializations, languages, experience_level
- Rating system cho performance tracking (0-100)
- Status workflow: pending → active → inactive/banned
- Statistics được update tự động (completed_projects, total_contributions)
- Public visibility có thể được control per member

---

### 5.7. Bảng Organization Invitations - Lời mời tham gia tổ chức

**Mục đích**: Quản lý lời mời tham gia tổ chức được gửi qua email.

#### SQL DDL

```sql
-- Tạo bảng organization_invitations
CREATE TABLE organization_invitations (
    id BIGSERIAL PRIMARY KEY,                                  -- ID của lời mời, khóa chính
    organization_id BIGINT NOT NULL DEFAULT 0,                 -- Liên kết đến bảng Organization
    email VARCHAR(255) NOT NULL DEFAULT '',                    -- Email của người được mời
    token VARCHAR(255) NOT NULL DEFAULT '' UNIQUE,             -- Token xác thực lời mời, dùng trong URL
    role SMALLINT NOT NULL DEFAULT 0,                          -- Vai trò được mời: 0: thành viên, 1: quản trị viên, 2: chủ sở hữu
    expires_at BIGINT NOT NULL DEFAULT 0,                      -- Thời gian hết hạn lời mời, dạng unix time
    status SMALLINT NOT NULL DEFAULT 0,                        -- Trạng thái lời mời: 0: đang chờ, 1: đã chấp nhận, 2: đã từ chối
    versions INTEGER NOT NULL DEFAULT 0,                       -- Phiên bản update
    created_at BIGINT NOT NULL DEFAULT 0                       -- Thời gian tạo, dạng unix time
);

-- Tạo các index
CREATE INDEX org_invitation_org_id_idx ON organization_invitations(organization_id);   -- Index cho organization_id để tìm kiếm nhanh
CREATE INDEX org_invitation_email_idx ON organization_invitations(email);             -- Index cho email để tìm kiếm nhanh
CREATE INDEX org_invitation_token_idx ON organization_invitations(token);             -- Index cho token để tìm kiếm nhanh
CREATE INDEX org_invitation_status_idx ON organization_invitations(status);           -- Index cho status để lọc theo trạng thái
CREATE INDEX org_invitation_expires_at_idx ON organization_invitations(expires_at);   -- Index cho expires_at để cleanup expired invitations

-- Thêm foreign key constraint (nếu cần)
-- ALTER TABLE organization_invitations ADD CONSTRAINT fk_org_invitation_org_id FOREIGN KEY (organization_id) REFERENCES organizations(id);

-- Thêm check constraints
ALTER TABLE organization_invitations ADD CONSTRAINT chk_org_invitation_role CHECK (role >= 0 AND role <= 2);
ALTER TABLE organization_invitations ADD CONSTRAINT chk_org_invitation_status CHECK (status >= 0 AND status <= 2);
```

**Mối quan hệ**:

- `organization_id` → `organizations.id` (Many-to-One)

**Business Rules**:

- Token phải unique và cryptographically secure
- Invitation tự động expire sau 7 ngày (configurable)
- Status values: 0=Pending, 1=Accepted, 2=Declined
- Chỉ Admin và Owner mới có thể invite members
- Không thể invite email đã là member của organization

**Workflow**:

1. Admin/Owner tạo invitation với email và role
2. System generate unique token và gửi email
3. User click link trong email để accept/decline
4. Nếu accept, tạo organization_membership record
5. Cleanup expired invitations định kỳ

---

### 5.8. Bảng Password Resets - Đặt lại mật khẩu

**Mục đích**: Quản lý token để đặt lại mật khẩu khi người dùng quên mật khẩu.

#### SQL DDL

```sql
-- Tạo bảng password_resets
CREATE TABLE password_resets (
    id BIGSERIAL PRIMARY KEY,                                   -- ID của token đặt lại mật khẩu, khóa chính
    user_id BIGINT NOT NULL DEFAULT 0,                         -- Liên kết đến bảng User
    token VARCHAR(255) NOT NULL DEFAULT '' UNIQUE,             -- Token duy nhất dùng trong URL đặt lại mật khẩu
    expires_at BIGINT NOT NULL DEFAULT 0,                      -- Thời gian hết hạn token, dạng unix time
    is_used BOOLEAN NOT NULL DEFAULT false,                    -- Trạng thái sử dụng của token
    versions INTEGER NOT NULL DEFAULT 0,                       -- Phiên bản update
    created_at BIGINT NOT NULL DEFAULT 0                       -- Thời gian tạo, dạng unix time
);

-- Tạo các index
CREATE INDEX password_reset_user_id_idx ON password_resets(user_id);       -- Index cho user_id để tìm kiếm nhanh
CREATE INDEX password_reset_token_idx ON password_resets(token);           -- Index cho token để tìm kiếm nhanh
CREATE INDEX password_reset_expires_at_idx ON password_resets(expires_at); -- Index cho expires_at để lọc token hết hạn
CREATE INDEX password_reset_is_used_idx ON password_resets(is_used);       -- Index cho is_used để lọc token đã sử dụng

-- Thêm foreign key constraint (nếu cần)
-- ALTER TABLE password_resets ADD CONSTRAINT fk_password_reset_user_id FOREIGN KEY (user_id) REFERENCES users(id);
```

**Mối quan hệ**:

- `user_id` → `users.id` (Many-to-One)

**Business Rules**:

- Token phải unique và cryptographically secure (UUID v4 hoặc random string)
- Token tự động expire sau 1 giờ (3600 seconds)
- Token chỉ có thể sử dụng một lần (is_used = true sau khi dùng)
- Một user có thể có nhiều token active (nếu request nhiều lần)
- Token cũ sẽ được invalidate khi tạo token mới

**Security Considerations**:

- Token được generate bằng cryptographically secure random
- Token không được log trong application logs
- Email chứa reset link phải được gửi qua secure channel
- Rate limiting cho password reset requests
- Cleanup expired tokens định kỳ

**Workflow**:

1. User request password reset với email
2. System tạo unique token và gửi email
3. User click link trong email (chứa token)
4. System validate token (not expired, not used)
5. User nhập password mới
6. System update password và mark token as used
7. Invalidate tất cả sessions của user

---

### 5.9. Bảng Roles - Vai trò hệ thống

**Mục đích**: Định nghĩa các vai trò trong hệ thống Role-Based Access Control (RBAC).

#### SQL DDL

```sql
-- Tạo bảng roles
CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,                                   -- ID của vai trò, khóa chính
    name VARCHAR(255) NOT NULL DEFAULT '' UNIQUE,              -- Tên vai trò, phải duy nhất
    is_system BOOLEAN NOT NULL DEFAULT false,                  -- Đánh dấu vai trò hệ thống (không thể xóa)
    description VARCHAR(255) NOT NULL DEFAULT '',              -- Mô tả về vai trò
    versions INTEGER NOT NULL DEFAULT 0,                       -- Phiên bản update
    created_at BIGINT NOT NULL DEFAULT 0,                      -- Thời gian tạo, dạng unix time
    updated_at BIGINT NOT NULL DEFAULT 0                       -- Thời gian cập nhật gần nhất, dạng unix time
);

-- Tạo các index
CREATE INDEX roles_name_idx ON roles(name);                    -- Index cho tên vai trò để tìm kiếm nhanh
CREATE INDEX roles_is_system_idx ON roles(is_system);          -- Index cho is_system để lọc vai trò hệ thống
```

**Business Rules**:

- Tên role phải duy nhất trong toàn hệ thống
- System roles không thể bị xóa (is_system = true)
- Role names nên follow naming convention (UPPER_CASE_WITH_UNDERSCORE)

---

### 5.10. Bảng Permissions - Quyền hạn hệ thống

**Mục đích**: Định nghĩa các quyền hạn cụ thể trong hệ thống.

#### SQL DDL

```sql
-- Tạo bảng permissions
CREATE TABLE permissions (
    id BIGSERIAL PRIMARY KEY,                                   -- ID của quyền, khóa chính
    name VARCHAR(255) NOT NULL DEFAULT '' UNIQUE,              -- Tên quyền, phải duy nhất
    is_system BOOLEAN NOT NULL DEFAULT false,                  -- Đánh dấu quyền hệ thống (không thể xóa)
    description VARCHAR(255) NOT NULL DEFAULT '',              -- Mô tả về quyền
    versions INTEGER NOT NULL DEFAULT 0,                       -- Phiên bản update
    created_at BIGINT NOT NULL DEFAULT 0,                      -- Thời gian tạo, dạng unix time
    updated_at BIGINT NOT NULL DEFAULT 0                       -- Thời gian cập nhật gần nhất, dạng unix time
);

-- Tạo các index
CREATE INDEX permissions_name_idx ON permissions(name);        -- Index cho tên quyền để tìm kiếm nhanh
CREATE INDEX permissions_is_system_idx ON permissions(is_system); -- Index cho is_system để lọc quyền hệ thống
```

**Business Rules**:

- Permission names nên follow format: `resource:action` (vd: `users:read`, `posts:create`)
- System permissions không thể bị xóa
- Permissions có thể được group theo resource hoặc module

---

### 5.11. Bảng Role Permission - Liên kết vai trò và quyền hạn

**Mục đích**: Bảng junction để liên kết roles với permissions (Many-to-Many relationship).

#### SQL DDL

```sql
-- Tạo bảng role_permission
CREATE TABLE role_permission (
    id BIGSERIAL PRIMARY KEY,                                   -- ID của liên kết, khóa chính
    role_id INTEGER NOT NULL DEFAULT 0,                         -- Liên kết đến bảng Role
    permission_id BIGINT NOT NULL DEFAULT 0,                   -- Liên kết đến bảng Permission
    created_at BIGINT NOT NULL DEFAULT 0                       -- Thời gian tạo, dạng unix time
);

-- Tạo các index
CREATE INDEX role_permission_role_id_idx ON role_permission(role_id);         -- Index cho role_id để tìm kiếm nhanh
CREATE INDEX role_permission_permission_id_idx ON role_permission(permission_id); -- Index cho permission_id để tìm kiếm nhanh
CREATE UNIQUE INDEX role_permission_unique_idx ON role_permission(role_id, permission_id); -- Đảm bảo không có sự kết hợp trùng lặp

-- Thêm foreign key constraints (nếu cần)
-- ALTER TABLE role_permission ADD CONSTRAINT fk_role_permission_role_id FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE;
-- ALTER TABLE role_permission ADD CONSTRAINT fk_role_permission_permission_id FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE;
```

**Mối quan hệ**:

- `role_id` → `roles.id` (Many-to-One)
- `permission_id` → `permissions.id` (Many-to-One)

**Business Rules**:

- Một role có thể có nhiều permissions
- Một permission có thể thuộc nhiều roles
- Không được duplicate role-permission combinations
- Cascade delete khi role hoặc permission bị xóa

---

### 5.12. RBAC System Overview

**Ví dụ về System Roles & Permissions**:

```sql
-- Insert system roles
INSERT INTO roles (name, is_system, description, created_at, updated_at) VALUES
('SUPER_ADMIN', true, 'System super administrator with all permissions', extract(epoch from now()), extract(epoch from now())),
('ADMIN', true, 'Organization administrator', extract(epoch from now()), extract(epoch from now())),
('MODERATOR', true, 'Content moderator', extract(epoch from now()), extract(epoch from now())),
('USER', true, 'Regular user', extract(epoch from now()), extract(epoch from now()));

-- Insert system permissions
INSERT INTO permissions (name, is_system, description, created_at, updated_at) VALUES
('users:read', true, 'Read user information', extract(epoch from now()), extract(epoch from now())),
('users:create', true, 'Create new users', extract(epoch from now()), extract(epoch from now())),
('users:update', true, 'Update user information', extract(epoch from now()), extract(epoch from now())),
('users:delete', true, 'Delete users', extract(epoch from now()), extract(epoch from now())),
('organizations:read', true, 'Read organization information', extract(epoch from now()), extract(epoch from now())),
('organizations:create', true, 'Create organizations', extract(epoch from now()), extract(epoch from now())),
('organizations:update', true, 'Update organizations', extract(epoch from now()), extract(epoch from now())),
('organizations:delete', true, 'Delete organizations', extract(epoch from now()), extract(epoch from now()));
```

**RBAC Implementation Benefits**:

- **Scalability**: Dễ dàng thêm roles và permissions mới
- **Flexibility**: Roles có thể được customize cho từng organization
- **Security**: Fine-grained access control
- **Maintainability**: Centralized permission management
- **Audit**: Track permission changes over time

---

### 5.13. Unified Organization System Benefits

**Tích hợp Translation Groups vào Organizations**:

#### Ví dụ sử dụng

```sql
-- Tạo translation group
INSERT INTO organizations (
    name, slug, description, type, category,
    specialties, supported_languages, quality_level,
    is_recruiting, recruitment_status,
    discord_url, contact_email,
    created_at, updated_at
) VALUES (
    'Wibu Fansub', 'wibu-fansub', 'Nhóm dịch anime và manga chất lượng cao',
    1, 'translation',
    '["anime", "manga"]', '["vi", "en", "ja"]', 4,
    true, 1,
    'https://discord.gg/wibufansub', 'contact@wibufansub.com',
    extract(epoch from now()), extract(epoch from now())
);

-- Thêm translator vào nhóm
INSERT INTO organization_membership (
    organization_id, user_id, role,
    specializations, languages, experience_level,
    join_reason, status, joined_at, created_at, updated_at
) VALUES (
    1, 123, 1,
    '["translate", "edit"]', '["vi", "ja"]', 2,
    'Có kinh nghiệm dịch manga 3 năm', 1,
    extract(epoch from now()), extract(epoch from now()), extract(epoch from now())
);

-- Query translation groups đang tuyển translator
SELECT o.*, om.total_members
FROM organizations o
LEFT JOIN (
    SELECT organization_id, COUNT(*) as total_members
    FROM organization_membership
    WHERE status = 1
    GROUP BY organization_id
) om ON o.id = om.organization_id
WHERE o.type = 1
  AND o.is_recruiting = true
  AND o.specialties ? 'anime';

-- Tìm translator có kinh nghiệm cao
SELECT u.display_name, om.experience_level, om.languages, om.rating
FROM organization_membership om
JOIN users u ON om.user_id = u.id
JOIN organizations o ON om.organization_id = o.id
WHERE o.type = 1
  AND om.role IN (1, 2, 3)
  AND om.experience_level >= 2
  AND om.languages ? 'ja'
ORDER BY om.rating DESC, om.experience_level DESC;
```

**Lợi ích của hệ thống thống nhất**:

1. **Consistency**: Cùng một framework cho tất cả loại tổ chức
2. **Flexibility**: Type field cho phép mở rộng thêm loại tổ chức
3. **Reusability**: Invitation system, membership management dùng chung
4. **Scalability**: Dễ dàng thêm features cho tất cả organization types
5. **Performance**: Ít table joins, optimized queries
6. **Maintenance**: Ít code duplication, unified business logic

**Migration từ separate tables**:

```sql
-- Migrate translation groups
INSERT INTO organizations (name, slug, description, type, specialties, supported_languages, ...)
SELECT name, slug, description, 1, specialties, supported_languages, ...
FROM translation_groups;

-- Migrate translation group memberships
INSERT INTO organization_membership (organization_id, user_id, role, specializations, languages, ...)
SELECT tg.new_org_id, tgm.user_id, tgm.role, tgm.specializations, tgm.languages, ...
FROM translation_group_membership tgm
JOIN translation_groups_mapping tg ON tgm.translation_group_id = tg.old_id;
```

---

### 5.14. Bảng User Addresses - Địa chỉ người dùng

**Mục đích**: Quản lý địa chỉ giao hàng và thanh toán của người dùng.

#### SQL DDL

```sql
-- Tạo bảng user_addresses
CREATE TABLE user_addresses (
    id BIGSERIAL PRIMARY KEY,                                   -- ID địa chỉ, khóa chính
    user_id BIGINT NOT NULL DEFAULT 0,                         -- Liên kết đến bảng User

    -- Thông tin địa chỉ
    label VARCHAR(100) NOT NULL DEFAULT '',                     -- Nhãn địa chỉ (Nhà riêng, Công ty, etc.)
    recipient_name VARCHAR(255) NOT NULL DEFAULT '',           -- Tên người nhận
    phone_number VARCHAR(20) NOT NULL DEFAULT '',              -- Số điện thoại người nhận

    -- Địa chỉ chi tiết
    address_line_1 TEXT NOT NULL DEFAULT '',                   -- Địa chỉ dòng 1
    address_line_2 TEXT NOT NULL DEFAULT '',                   -- Địa chỉ dòng 2 (tùy chọn)
    city VARCHAR(100) NOT NULL DEFAULT '',                     -- Thành phố
    state_province VARCHAR(100) NOT NULL DEFAULT '',           -- Tỉnh/Bang
    postal_code VARCHAR(20) NOT NULL DEFAULT '',               -- Mã bưu điện
    country VARCHAR(100) NOT NULL DEFAULT '',                  -- Quốc gia
    country_code VARCHAR(2) NOT NULL DEFAULT '',               -- Mã quốc gia (VN, US, etc.)

    -- Loại địa chỉ
    address_type SMALLINT NOT NULL DEFAULT 0,                  -- Loại: 0: shipping, 1: billing, 2: both

    -- Trạng thái
    is_default BOOLEAN NOT NULL DEFAULT false,                 -- Địa chỉ mặc định
    is_active BOOLEAN NOT NULL DEFAULT true,                   -- Địa chỉ đang hoạt động

    -- Thông tin bổ sung
    delivery_instructions TEXT NOT NULL DEFAULT '',            -- Hướng dẫn giao hàng

    versions INT NOT NULL DEFAULT 0,                           -- Phiên bản update
    created_at BIGINT NOT NULL DEFAULT 0,                      -- Thời gian tạo
    updated_at BIGINT NOT NULL DEFAULT 0                       -- Thời gian cập nhật
);

-- Tạo các index
CREATE INDEX user_addresses_user_id_idx ON user_addresses(user_id);            -- Index cho user_id
CREATE INDEX user_addresses_country_idx ON user_addresses(country);            -- Index cho country
CREATE INDEX user_addresses_country_code_idx ON user_addresses(country_code);  -- Index cho country code
CREATE INDEX user_addresses_is_default_idx ON user_addresses(is_default);      -- Index cho default address
CREATE INDEX user_addresses_address_type_idx ON user_addresses(address_type);  -- Index cho address type
CREATE INDEX user_addresses_is_active_idx ON user_addresses(is_active);        -- Index cho active addresses

-- Thêm foreign key constraint (nếu cần)
-- ALTER TABLE user_addresses ADD CONSTRAINT fk_user_addresses_user_id FOREIGN KEY (user_id) REFERENCES users(id);

-- Thêm check constraints
ALTER TABLE user_addresses ADD CONSTRAINT chk_user_addresses_address_type CHECK (address_type >= 0 AND address_type <= 2);
ALTER TABLE user_addresses ADD CONSTRAINT chk_user_addresses_country_code CHECK (LENGTH(country_code) = 2);
```

**Business Rules**:

- Mỗi user có thể có nhiều địa chỉ
- Chỉ có một địa chỉ default per address_type per user
- Country code theo chuẩn ISO 3166-1 alpha-2
- Address types: 0=Shipping, 1=Billing, 2=Both

---

### 5.15. Bảng User Follows - Quan hệ theo dõi

**Mục đích**: Quản lý mối quan hệ theo dõi giữa các người dùng (social features).

#### SQL DDL

```sql
-- Tạo bảng user_follows
CREATE TABLE user_follows (
    id BIGSERIAL PRIMARY KEY,                                   -- ID follow, khóa chính
    follower_id BIGINT NOT NULL DEFAULT 0,                     -- ID người follow
    following_id BIGINT NOT NULL DEFAULT 0,                    -- ID người được follow
    created_at BIGINT NOT NULL DEFAULT 0                       -- Thời gian follow
);

-- Tạo các index
CREATE INDEX user_follows_follower_idx ON user_follows(follower_id);           -- Index cho follower
CREATE INDEX user_follows_following_idx ON user_follows(following_id);         -- Index cho following
CREATE UNIQUE INDEX user_follows_unique_idx ON user_follows(follower_id, following_id); -- Đảm bảo không follow trùng lặp

-- Thêm foreign key constraints (nếu cần)
-- ALTER TABLE user_follows ADD CONSTRAINT fk_user_follows_follower FOREIGN KEY (follower_id) REFERENCES users(id);
-- ALTER TABLE user_follows ADD CONSTRAINT fk_user_follows_following FOREIGN KEY (following_id) REFERENCES users(id);

-- Thêm check constraint để prevent self-follow
ALTER TABLE user_follows ADD CONSTRAINT chk_user_follows_no_self_follow CHECK (follower_id != following_id);
```

**Business Rules**:

- Một user không thể follow chính mình
- Mối quan hệ follow là one-way (không tự động mutual)
- Có thể unfollow bất kỳ lúc nào
- Follow relationship có thể được sử dụng cho notifications và feed

---

### 5.16. Bảng User Identity - Phương thức xác thực

**Mục đích**: Quản lý các phương thức xác thực khác nhau của người dùng (email, phone, OAuth).

#### SQL DDL

```sql
-- Tạo bảng user_identity
CREATE TABLE user_identity (
    id BIGSERIAL PRIMARY KEY,                                   -- ID của bản ghi, khóa chính
    user_id BIGINT NOT NULL DEFAULT 0,                         -- Liên kết đến bảng User
    identity_type SMALLINT NOT NULL DEFAULT 0,                 -- Loại: 0: email, 1: phone, 2: oauth
    identity_value VARCHAR(255) NOT NULL DEFAULT '',           -- Giá trị định danh
    provider VARCHAR(64) NOT NULL DEFAULT '',                  -- Nhà cung cấp OAuth (google, facebook, github, ...)
    created_at BIGINT NOT NULL DEFAULT 0                       -- Thời gian tạo, dạng unix time
);

-- Tạo các index
CREATE INDEX user_identity_user_id_idx ON user_identity(user_id);               -- Index cho user_id
CREATE INDEX user_identity_value_idx ON user_identity(identity_value);         -- Index cho identity_value
CREATE INDEX user_identity_type_idx ON user_identity(identity_type);           -- Index cho identity_type
CREATE INDEX user_identity_provider_idx ON user_identity(provider);            -- Index cho provider
CREATE UNIQUE INDEX user_identity_unique_idx ON user_identity(identity_type, identity_value, provider); -- Unique constraint

-- Thêm foreign key constraint (nếu cần)
-- ALTER TABLE user_identity ADD CONSTRAINT fk_user_identity_user_id FOREIGN KEY (user_id) REFERENCES users(id);

-- Thêm check constraints
ALTER TABLE user_identity ADD CONSTRAINT chk_user_identity_type CHECK (identity_type >= 0 AND identity_type <= 2);
```

**Identity Types**:

- **0: Email** - Email address authentication
- **1: Phone** - Phone number authentication
- **2: OAuth** - Third-party OAuth providers

**Business Rules**:

- Mỗi user có thể có nhiều identity methods
- Email và phone phải được verify trước khi sử dụng
- OAuth providers: google, facebook, github, discord, etc.
- Identity value phải unique per type per provider

---

### 5.17. Bảng User Profiles - Thông tin mở rộng người dùng

**Mục đích**: Lưu trữ thông tin mở rộng và preferences của người dùng.

#### SQL DDL

```sql
-- Tạo bảng user_profiles
CREATE TABLE user_profiles (
    id BIGSERIAL PRIMARY KEY,                                   -- ID profile, khóa chính
    user_id BIGINT NOT NULL UNIQUE,                            -- Liên kết đến bảng User (1-1)

    -- Thông tin ngôn ngữ và preferences
    preferred_language VARCHAR(10) NOT NULL DEFAULT 'vi',      -- Ngôn ngữ ưa thích
    timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',  -- Múi giờ

    -- Thông tin cho hệ thống anime/manga/novel
    favorite_genres JSONB NOT NULL DEFAULT '[]',               -- Thể loại yêu thích
    reading_preferences JSONB NOT NULL DEFAULT '{}',           -- Cài đặt đọc (font size, theme, etc.)
    viewing_preferences JSONB NOT NULL DEFAULT '{}',           -- Cài đặt xem (quality, subtitle, etc.)

    -- Thông tin thống kê
    total_reading_time BIGINT NOT NULL DEFAULT 0,              -- Tổng thời gian đọc (phút)
    total_watching_time BIGINT NOT NULL DEFAULT 0,             -- Tổng thời gian xem (phút)

    -- Cài đặt privacy
    is_profile_public BOOLEAN NOT NULL DEFAULT true,           -- Profile công khai
    is_reading_list_public BOOLEAN NOT NULL DEFAULT true,      -- Danh sách đọc công khai
    is_watching_list_public BOOLEAN NOT NULL DEFAULT true,     -- Danh sách xem công khai

    -- Thông tin cho nhóm dịch
    translation_languages JSONB NOT NULL DEFAULT '[]',         -- Ngôn ngữ có thể dịch
    translation_experience SMALLINT NOT NULL DEFAULT 0,        -- Kinh nghiệm dịch: 0: mới, 1: trung bình, 2: giỏi, 3: chuyên nghiệp

    versions INTEGER NOT NULL DEFAULT 0,                       -- Phiên bản update
    created_at BIGINT NOT NULL DEFAULT 0,                      -- Thời gian tạo
    updated_at BIGINT NOT NULL DEFAULT 0                       -- Thời gian cập nhật
);

-- Tạo các index
CREATE INDEX user_profiles_user_id_idx ON user_profiles(user_id);               -- Index cho user_id
CREATE INDEX user_profiles_preferred_language_idx ON user_profiles(preferred_language); -- Index cho preferred language
CREATE INDEX user_profiles_translation_experience_idx ON user_profiles(translation_experience); -- Index cho translation experience
CREATE INDEX user_profiles_favorite_genres_idx ON user_profiles USING gin(favorite_genres); -- GIN index cho favorite genres
CREATE INDEX user_profiles_translation_languages_idx ON user_profiles USING gin(translation_languages); -- GIN index cho translation languages

-- Thêm foreign key constraint (nếu cần)
-- ALTER TABLE user_profiles ADD CONSTRAINT fk_user_profiles_user_id FOREIGN KEY (user_id) REFERENCES users(id);

-- Thêm check constraints
ALTER TABLE user_profiles ADD CONSTRAINT chk_user_profiles_translation_experience CHECK (translation_experience >= 0 AND translation_experience <= 3);
```

**Business Rules**:

- Mỗi user có duy nhất một profile
- Profile được tạo tự động khi user đăng ký
- Privacy settings control visibility của user data
- Translation experience levels: 0=Beginner, 1=Intermediate, 2=Advanced, 3=Professional

---

### 5.18. Bảng User Role - Vai trò người dùng

**Mục đích**: Liên kết users với system roles (Many-to-Many relationship).

#### SQL DDL

```sql
-- Tạo bảng user_role
CREATE TABLE user_role (
    id BIGSERIAL PRIMARY KEY,                                   -- ID của liên kết, khóa chính
    user_id BIGINT NOT NULL DEFAULT 0,                         -- Liên kết đến bảng User
    role_id INTEGER NOT NULL DEFAULT 0,                         -- Liên kết đến bảng Role
    versions INTEGER NOT NULL DEFAULT 0,                       -- Phiên bản update
    created_at BIGINT NOT NULL DEFAULT 0                       -- Thời gian tạo, dạng unix time
);

-- Tạo các index
CREATE INDEX user_role_user_id_idx ON user_role(user_id);                      -- Index cho user_id
CREATE INDEX user_role_role_id_idx ON user_role(role_id);                      -- Index cho role_id
CREATE UNIQUE INDEX user_role_unique_idx ON user_role(user_id, role_id);       -- Đảm bảo không có sự kết hợp trùng lặp

-- Thêm foreign key constraints (nếu cần)
-- ALTER TABLE user_role ADD CONSTRAINT fk_user_role_user_id FOREIGN KEY (user_id) REFERENCES users(id);
-- ALTER TABLE user_role ADD CONSTRAINT fk_user_role_role_id FOREIGN KEY (role_id) REFERENCES roles(id);
```

**Business Rules**:

- Một user có thể có nhiều system roles
- Một role có thể được assign cho nhiều users
- System roles khác với organization roles
- Default role "USER" được assign tự động cho new users

---

## 6. Chiến Lược Index

### 6.1. Index cho Performance

- **B-tree Index**: Cho các truy vấn equality và range
- **GIN Index**: Cho full-text search và JSON queries
- **Unique Index**: Đảm bảo tính duy nhất

### 6.2. Index Chính

- `users_email_idx` - Tìm kiếm user bằng email
- `users_display_name_fts_idx` - Full-text search tên hiển thị
- `sessions_user_id_idx` - Tìm sessions của user
- `device_tokens_expires_at_idx` - Cleanup expired tokens

## 7. Bảo Mật

### 7.1. Mã Hóa Dữ Liệu

- **Password**: Sử dụng bcrypt với salt
- **API Keys**: Sử dụng cryptographically secure random
- **Tokens**: JWT với signing key

### 7.2. Audit Trail

- Mọi bảng đều có `created_at` và `updated_at`
- Lưu trữ IP address và user agent cho security tracking
- Soft delete thay vì hard delete

### 7.3. Rate Limiting

- Device tokens có `request_count` để tracking usage
- Risk score để phát hiện suspicious activity

## 8. Maintenance

### 8.1. Cleanup Jobs

- Xóa expired tokens và verification codes
- Archive old sessions
- Cleanup soft-deleted records

### 8.2. Monitoring

- Monitor index usage và performance
- Track table size growth
- Alert on suspicious activities

## 9. Migration Strategy

### 9.1. Schema Changes

- Sử dụng migrations để update schema
- Backward compatibility cho API changes
- Rollback strategy cho mỗi migration

### 9.2. Data Migration

- Bulk operations cho large datasets
- Incremental migration cho minimal downtime
- Data validation sau migration

---

### 5.19. Bảng User Subscriptions - Gói subscription của người dùng

**Mục đích**: Quản lý các gói subscription và thanh toán của người dùng.

#### SQL DDL

```sql
-- Tạo bảng user_subscriptions
CREATE TABLE user_subscriptions (
    id BIGSERIAL PRIMARY KEY,                                   -- ID subscription, khóa chính
    user_id BIGINT NOT NULL DEFAULT 0,                         -- Liên kết đến bảng User

    -- Thông tin gói
    plan_type SMALLINT NOT NULL DEFAULT 0,                     -- Loại gói: 0: free, 1: basic, 2: premium, 3: pro
    plan_name VARCHAR(100) NOT NULL DEFAULT '',                -- Tên gói subscription

    -- Thông tin thanh toán
    payment_method SMALLINT NOT NULL DEFAULT 0,                -- Phương thức thanh toán: 0: none, 1: card, 2: paypal, 3: crypto
    payment_provider VARCHAR(50) NOT NULL DEFAULT '',          -- Nhà cung cấp thanh toán
    external_subscription_id VARCHAR(255) NOT NULL DEFAULT '', -- ID subscription từ payment provider

    -- Thời gian
    started_at BIGINT NOT NULL DEFAULT 0,                      -- Thời gian bắt đầu
    expires_at BIGINT NOT NULL DEFAULT 0,                      -- Thời gian hết hạn
    trial_ends_at BIGINT NOT NULL DEFAULT 0,                   -- Thời gian kết thúc trial

    -- Trạng thái
    status SMALLINT NOT NULL DEFAULT 1,                        -- Trạng thái: 0: cancelled, 1: active, 2: expired, 3: suspended, 4: trial
    is_auto_renew BOOLEAN NOT NULL DEFAULT true,               -- Tự động gia hạn
    is_trial BOOLEAN NOT NULL DEFAULT false,                   -- Đang trong thời gian trial

    -- Tính năng được phép
    features JSONB NOT NULL DEFAULT '{}',                      -- Các tính năng được phép sử dụng
    limits JSONB NOT NULL DEFAULT '{}',                        -- Giới hạn sử dụng (downloads, streams, etc.)

    -- Thông tin billing
    billing_cycle SMALLINT NOT NULL DEFAULT 1,                 -- Chu kỳ billing: 1: monthly, 2: quarterly, 3: yearly
    amount INTEGER NOT NULL DEFAULT 0,                         -- Số tiền (cents)
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',                -- Đơn vị tiền tệ

    -- Metadata
    metadata JSONB NOT NULL DEFAULT '{}',                      -- Dữ liệu bổ sung

    versions INTEGER NOT NULL DEFAULT 0,                       -- Phiên bản update
    created_at BIGINT NOT NULL DEFAULT 0,                      -- Thời gian tạo
    updated_at BIGINT NOT NULL DEFAULT 0                       -- Thời gian cập nhật
);

-- Tạo các index
CREATE INDEX user_subscriptions_user_id_idx ON user_subscriptions(user_id);                    -- Index cho user_id
CREATE INDEX user_subscriptions_status_idx ON user_subscriptions(status);                      -- Index cho status
CREATE INDEX user_subscriptions_plan_type_idx ON user_subscriptions(plan_type);                -- Index cho plan_type
CREATE INDEX user_subscriptions_expires_at_idx ON user_subscriptions(expires_at);              -- Index cho expires_at
CREATE INDEX user_subscriptions_external_id_idx ON user_subscriptions(external_subscription_id); -- Index cho external_subscription_id

-- Thêm foreign key constraint (nếu cần)
-- ALTER TABLE user_subscriptions ADD CONSTRAINT fk_user_subscriptions_user_id FOREIGN KEY (user_id) REFERENCES users(id);

-- Thêm check constraints
ALTER TABLE user_subscriptions ADD CONSTRAINT chk_user_subscriptions_plan_type CHECK (plan_type >= 0 AND plan_type <= 3);
ALTER TABLE user_subscriptions ADD CONSTRAINT chk_user_subscriptions_payment_method CHECK (payment_method >= 0 AND payment_method <= 3);
ALTER TABLE user_subscriptions ADD CONSTRAINT chk_user_subscriptions_status CHECK (status >= 0 AND status <= 4);
ALTER TABLE user_subscriptions ADD CONSTRAINT chk_user_subscriptions_billing_cycle CHECK (billing_cycle >= 1 AND billing_cycle <= 3);
ALTER TABLE user_subscriptions ADD CONSTRAINT chk_user_subscriptions_currency CHECK (LENGTH(currency) = 3);
```

**Mối quan hệ**:

- `user_id` → `users.id` (Many-to-One)

**Plan Types**:

- **0: Free** - Gói miễn phí với tính năng cơ bản
- **1: Basic** - Gói cơ bản có phí
- **2: Premium** - Gói cao cấp với nhiều tính năng
- **3: Pro** - Gói chuyên nghiệp với tất cả tính năng

**Payment Methods**:

- **0: None** - Không có thanh toán (free plan)
- **1: Card** - Thẻ tín dụng/ghi nợ
- **2: PayPal** - Thanh toán qua PayPal
- **3: Crypto** - Thanh toán bằng cryptocurrency

**Status Values**:

- **0: Cancelled** - Đã hủy
- **1: Active** - Đang hoạt động
- **2: Expired** - Đã hết hạn
- **3: Suspended** - Tạm dừng
- **4: Trial** - Đang trong thời gian dùng thử

**Business Rules**:

- Mỗi user có thể có nhiều subscriptions (history)
- Chỉ có một subscription active tại một thời điểm
- Amount được lưu dưới dạng cents để tránh floating point issues
- Currency code theo chuẩn ISO 4217 (3 ký tự)
- Trial period có thể overlap với subscription period
- Features và limits được định nghĩa dưới dạng JSON để linh hoạt

---

### 5.20. Bảng Verification Code - Mã xác thực

**Mục đích**: Quản lý mã xác thực được gửi qua email hoặc SMS.

#### SQL DDL

```sql
-- Tạo bảng verification_code
CREATE TABLE verification_code (
    id SERIAL PRIMARY KEY,                                      -- ID của mã xác thực, khóa chính
    user_id BIGINT NOT NULL DEFAULT 0,                        -- Liên kết đến bảng User
    code VARCHAR(32) NOT NULL DEFAULT '',                      -- Mã xác thực được gửi đến người dùng
    type INTEGER NOT NULL DEFAULT 0,                           -- Loại xác thực: 0: email, 1: phone
    expires_at BIGINT NOT NULL DEFAULT 0,                      -- Thời gian hết hạn mã xác thực, dạng unix time
    is_used BOOLEAN NOT NULL DEFAULT false,                    -- Trạng thái sử dụng mã xác thực
    versions INTEGER NOT NULL DEFAULT 0,                       -- Phiên bản update
    created_at BIGINT NOT NULL DEFAULT 0                       -- Thời gian tạo, dạng unix time
);

-- Tạo các index
CREATE INDEX verification_code_user_id_idx ON verification_code(user_id);       -- Index cho user_id để tìm kiếm nhanh
CREATE INDEX verification_code_code_idx ON verification_code(code);             -- Index cho code để tìm kiếm nhanh
CREATE INDEX verification_code_type_idx ON verification_code(type);             -- Index cho type để lọc theo loại
CREATE INDEX verification_code_expires_at_idx ON verification_code(expires_at); -- Index cho expires_at để lọc mã hết hạn
CREATE INDEX verification_code_is_used_idx ON verification_code(is_used);       -- Index cho is_used để lọc mã đã sử dụng

-- Thêm foreign key constraint (nếu cần)
-- ALTER TABLE verification_code ADD CONSTRAINT fk_verification_code_user_id FOREIGN KEY (user_id) REFERENCES users(id);

-- Thêm check constraints
ALTER TABLE verification_code ADD CONSTRAINT chk_verification_code_type CHECK (type >= 0 AND type <= 1);
```

**Mối quan hệ**:

- `user_id` → `users.id` (Many-to-One)

**Verification Types**:

- **0: Email** - Mã xác thực gửi qua email
- **1: Phone** - Mã xác thực gửi qua SMS

**Business Rules**:

- Mã xác thực có thời gian hết hạn (thường 5-15 phút)
- Mã chỉ có thể sử dụng một lần (is_used = true sau khi verify)
- Một user có thể có nhiều mã verification active cùng lúc
- Cleanup expired codes định kỳ để giữ database sạch

**Security Considerations**:

- Code nên là 6-8 chữ số random
- Rate limiting cho việc gửi verification codes
- Log attempts để phát hiện abuse
- Consider using TOTP thay vì random codes cho security cao hơn

---

### 5.21. Bảng Webhooks - Cấu hình webhook

**Mục đích**: Quản lý các webhook endpoints để thông báo sự kiện đến external systems.

#### SQL DDL

```sql
-- Tạo bảng webhooks
CREATE TABLE webhooks (
    id SERIAL PRIMARY KEY,                                      -- ID của webhook, khóa chính
    url VARCHAR(500) NOT NULL DEFAULT '',                      -- URL nhận webhook
    secret VARCHAR(255) NOT NULL DEFAULT '',                   -- Khóa bí mật dùng để xác thực webhook
    events VARCHAR(500) NOT NULL DEFAULT '',                   -- Danh sách sự kiện webhook lắng nghe, phân cách bằng dấu phẩy
    is_active BOOLEAN NOT NULL DEFAULT true,                   -- Trạng thái kích hoạt của webhook
    versions INTEGER NOT NULL DEFAULT 0,                       -- Phiên bản update
    created_at BIGINT NOT NULL DEFAULT 0,                      -- Thời gian tạo, dạng unix time
    updated_at BIGINT NOT NULL DEFAULT 0                       -- Thời gian cập nhật gần nhất, dạng unix time
);

-- Tạo các index
CREATE INDEX webhooks_url_idx ON webhooks(url);                -- Index cho url để tìm kiếm nhanh
CREATE INDEX webhooks_events_idx ON webhooks(events);          -- Index cho events để lọc theo sự kiện
CREATE INDEX webhooks_is_active_idx ON webhooks(is_active);    -- Index cho is_active để lọc webhook đang hoạt động
```

**Business Rules**:

- URL phải là valid HTTP/HTTPS endpoint
- Secret được sử dụng để tạo HMAC signature cho webhook payload
- Events được lưu dưới dạng comma-separated string
- Webhook có thể được disable mà không cần xóa

**Supported Events** (ví dụ):

- `user.created` - User mới được tạo
- `user.updated` - Thông tin user được cập nhật
- `subscription.created` - Subscription mới
- `subscription.cancelled` - Subscription bị hủy
- `payment.succeeded` - Thanh toán thành công
- `payment.failed` - Thanh toán thất bại

**Security Considerations**:

- Secret phải được generate securely và rotate định kỳ
- Webhook payload phải được sign bằng HMAC-SHA256
- Implement retry mechanism với exponential backoff
- Rate limiting cho webhook calls
- Timeout cho webhook requests (5-10 seconds)

---

## 10. Changelog & Data Consistency

### 10.1. Data Type Standardization

**User ID References**: Tất cả foreign keys tham chiếu đến `users.id` đều sử dụng `BIGINT`
**Role/Permission IDs**: Các references đến roles và permissions sử dụng `INTEGER` (đủ cho metadata tables)
**Versions Field**: Tất cả bảng quan trọng đều có `versions INTEGER NOT NULL DEFAULT 0` để support optimistic locking

### 10.2. Version Control Strategy

**Optimistic Locking**: Sử dụng `versions` field để prevent concurrent update conflicts
**Audit Trail**: Combination của `versions`, `created_at`, và `updated_at` provides complete change tracking
**Implementation**: Application phải increment `versions` và update `updated_at` trong mỗi UPDATE operation

```sql
-- Example optimistic locking query
UPDATE users
SET display_name = $1,
    versions = versions + 1,
    updated_at = extract(epoch from now())
WHERE id = $2 AND versions = $3;

-- If affected rows = 0, then concurrent modification detected
```

---

_Tài liệu này sẽ được cập nhật khi có thay đổi về requirements hoặc schema._
