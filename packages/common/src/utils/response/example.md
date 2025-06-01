# Hướng dẫn sử dụng Response Formatter

## Cách import

```typescript
import {
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse,
  createCreatedResponse,
  createUpdatedResponse,
  createDeletedResponse,
  createNotFoundResponse,
  createUnauthorizedResponse,
  createValidationErrorResponse,
  createServerErrorResponse,
  ApiResponse,
} from "@common/utils/response";
```

## Ví dụ sử dụng

### 1. Response thành công cơ bản

```typescript
// Lấy danh sách user
const users = await getUserList();
return createSuccessResponse(users, "Lấy danh sách người dùng thành công");

// Kết quả:
{
  "success": true,
  "message": "Lấy danh sách người dùng thành công",
  "data": [...],
  "statusCode": 200,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 2. Response tạo mới

```typescript
const newUser = await createUser(userData);
return createCreatedResponse(newUser, "Tạo người dùng thành công");

// Kết quả:
{
  "success": true,
  "message": "Tạo người dùng thành công",
  "data": { ... },
  "statusCode": 201,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 3. Response lỗi validation

```typescript
if (!email) {
  return createValidationErrorResponse(
    "Email là bắt buộc",
    "email",
    "Vui lòng nhập địa chỉ email hợp lệ"
  );
}

// Kết quả:
{
  "success": false,
  "message": "Email là bắt buộc",
  "data": null,
  "statusCode": 422,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "error": {
    "code": "VALIDATION_ERROR",
    "field": "email",
    "details": "Vui lòng nhập địa chỉ email hợp lệ"
  }
}
```

### 4. Response phân trang

```typescript
const { users, total } = await getUsersWithPagination(page, limit);
return createPaginatedResponse(users, total, page, limit);

// Kết quả:
{
  "success": true,
  "message": "Lấy dữ liệu thành công",
  "data": {
    "items": [...],
    "pagination": {
      "total": 150,
      "page": 2,
      "limit": 10,
      "totalPages": 15,
      "hasNext": true,
      "hasPrev": true
    }
  },
  "statusCode": 200,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 5. Response lỗi tùy chỉnh

```typescript
return createErrorResponse("Không thể xử lý yêu cầu", 500, {
  code: "PROCESSING_ERROR",
  details: "Lỗi khi kết nối với service bên thứ 3",
});
```

## Sử dụng trong Express.js

```typescript
import express from "express";
import {
  createSuccessResponse,
  createNotFoundResponse,
} from "@common/utils/response";

const app = express();

app.get("/api/users/:id", async (req, res) => {
  try {
    const user = await getUserById(req.params.id);

    if (!user) {
      const response = createNotFoundResponse("Không tìm thấy người dùng");
      return res.status(response.statusCode).json(response);
    }

    const response = createSuccessResponse(
      user,
      "Lấy thông tin người dùng thành công"
    );
    return res.status(response.statusCode).json(response);
  } catch (error) {
    const response = createServerErrorResponse("Lỗi server");
    return res.status(response.statusCode).json(response);
  }
});
```

## Sử dụng với TypeScript Generic

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

// Type-safe response
const response: ApiResponse<User> = createSuccessResponse<User>(user);

// Response cho array
const usersResponse: ApiResponse<User[]> = createSuccessResponse<User[]>(users);
```
