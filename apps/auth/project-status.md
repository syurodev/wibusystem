# Tổng quan trạng thái Auth Service

## 1. Công nghệ & Stack chính
- **Runtime:** Bun
- **Framework:** Elysia.js
- **ORM:** Drizzle ORM (PostgreSQL)
- **Các package chính:** @elysiajs/jwt, @elysiajs/swagger, bcrypt, redis, @repo/common, @repo/elysia-grpc

## 2. Cấu trúc thư mục chính
```
apps/auth/
├── src/
│   ├── configs/         # Cấu hình (DB, Redis, JWT, app)
│   ├── constants/       # Định nghĩa hằng số, enums
│   ├── database/        # Kết nối DB, schema, seed, migration
│   ├── middlewares/     # Middleware (xử lý lỗi, ...)
│   ├── modules/
│   │   └── v1/
│   │        └── auth/
│   │            ├── controllers/
│   │            ├── dtos/
│   │            ├── services/
│   │            └── validations/
│   ├── plugins/         # auth, jwt, swagger
│   ├── repositories/    # (đang để trống)
│   ├── types/           # interfaces, enums
│   └── utils/           # Tiện ích (hash password, token, redis, ...)
```

## 3. Config & Biến môi trường
- **src/configs/index.ts** quản lý cấu hình DB, Redis, JWT, app port, lấy từ `.env`
- Đã có `.env.example`

## 4. Database & Schema
- Sử dụng Drizzle ORM, kết nối PostgreSQL qua `src/database/connection.ts`
- Schema chia nhỏ theo từng bảng: users, roles, permissions, refresh_tokens, ...
- Có sẵn các file seed/reset/migrations (chưa kiểm tra chi tiết)

## 5. Plugins/Middleware
- **auth.plugin.ts:** Lấy thông tin user từ header (do Gateway truyền xuống)
- **jwt.plugin.ts:** Cấu hình JWT (access/refresh token) dùng @elysiajs/jwt
- **swagger.plugin.ts:** Tự động sinh tài liệu API (Swagger UI tại `/docs`)
- **error.middleware.ts:** Middleware xử lý lỗi tập trung, trả về message/code chuẩn hóa

## 6. Modules (v1/auth)
- Đã tạo sẵn folder structure cho controller, service, dto, validations nhưng chỉ có placeholder:
  - `auth.controller.ts`, `auth.service.ts` đều là class rỗng.
  - DTO & validations chưa có nội dung thực tế.
- Chưa có route thực tế cho auth (login, register, ...)

## 7. Types/Interfaces
- Định nghĩa rõ các interface cho JWT payload, user, kết quả đăng nhập/đăng ký, session, ...
- Nên tận dụng thêm types chung từ `@repo/common` nếu có.

## 8. Scripts
- Đã có các script dev, migrate, seed, reset, lint, ... trong package.json

## 9. Nhận xét tổng quan
- **Cơ bản đã scaffold xong cấu trúc, config, plugin, middleware, DB.**
- **Chưa có business logic thực tế cho Auth (login, register, refresh, ...).**
- Có thể bắt đầu implement các use-case chính cho Auth.

---
**Cập nhật: 2025-05-21**
