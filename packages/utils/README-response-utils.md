# Response Utilities - API Response Formatter

Tiện ích để format response chuẩn cho tất cả các API với hỗ trợ tiếng Việt.

## Tổng quan

Response utilities cung cấp một cấu trúc response nhất quán cho toàn bộ hệ thống API, bao gồm:

- ✅ **Success responses** - Định dạng response thành công
- ❌ **Error responses** - Định dạng response lỗi với chi tiết
- 📄 **Pagination support** - Hỗ trợ phân trang
- 🇻🇳 **Vietnamese i18n** - Hỗ trợ thông báo tiếng Việt
- 🔧 **Type safety** - An toàn kiểu dữ liệu với TypeScript
- 📊 **Metadata support** - Hỗ trợ metadata tùy chỉnh

## Cấu trúc Response Chuẩn

```typescript
interface ApiResponse<T = any> {
  status: "success" | "error"; // Trạng thái response
  statusCode: number; // HTTP status code
  message: string; // Thông báo
  data?: T; // Dữ liệu (success only)
  error?: ApiError; // Chi tiết lỗi (error only)
  meta?: ResponseMeta; // Metadata (pagination, etc.)
  timestamp: string; // Thời gian request
  requestId?: string; // ID theo dõi request
}
```

## Import và Sử dụng

```typescript
import {
  // Core functions
  success,
  created,
  updated,
  deleted,

  // Error functions
  notFound,
  validationError,
  unauthorized,
  forbidden,
  badRequest,
  internalError,

  // Pagination
  paginated,

  // Utilities
  withErrorHandling,
  createValidationErrors,

  // Constants
  HTTP_STATUS,
  ERROR_CODES,

  // Types
  type ApiResponse,
  type ValidationError,
  type ResponseOptions,
} from "@repo/utils";
```

## 1. Success Responses

### Basic Success Response

```typescript
// Thành công cơ bản
const response = success({ id: 1, name: "John" });
console.log(response);
/*
{
  status: "success",
  statusCode: 200,
  message: "Request successful",
  data: { id: 1, name: "John" },
  timestamp: "2024-12-25T10:30:00.000Z"
}
*/
```

### Success với Vietnamese

```typescript
const response = success(
  { id: 1, name: "Nguyễn Văn A" },
  "Lấy dữ liệu thành công",
  { vietnamese: true }
);
console.log(response);
/*
{
  status: "success",
  statusCode: 200,
  message: "Lấy dữ liệu thành công",
  data: { id: 1, name: "Nguyễn Văn A" },
  timestamp: "2024-12-25T10:30:00.000Z"
}
*/
```

### Created Response (201)

```typescript
const newUser = { id: 2, name: "Trần Thị B", email: "b@example.com" };

const response = created(newUser, undefined, {
  vietnamese: true,
  requestId: "req-123",
});
console.log(response);
/*
{
  status: "success",
  statusCode: 201,
  message: "Tạo mới thành công",
  data: { id: 2, name: "Trần Thị B", email: "b@example.com" },
  timestamp: "2024-12-25T10:30:00.000Z",
  requestId: "req-123"
}
*/
```

## 2. Error Responses

### Not Found Error

```typescript
const response = notFound("Không tìm thấy người dùng", {
  vietnamese: true,
  requestId: "req-456",
});
console.log(response);
/*
{
  status: "error",
  statusCode: 404,
  message: "Không tìm thấy người dùng",
  data: null,
  error: {
    code: "NOT_FOUND",
    message: "Không tìm thấy người dùng"
  },
  timestamp: "2024-12-25T10:30:00.000Z",
  requestId: "req-456"
}
*/
```

### Validation Error

```typescript
// Tạo validation errors
const validationErrors = createValidationErrors({
  email: "Email không hợp lệ",
  password: ["Mật khẩu quá ngắn", "Mật khẩu phải có ký tự đặc biệt"],
  name: "Tên không được để trống",
});

const response = validationError(
  validationErrors,
  "Dữ liệu đầu vào không hợp lệ",
  { vietnamese: true }
);
```

## 3. Pagination Responses

```typescript
const response = paginated(
  users,
  {
    page: 1, // Trang hiện tại
    limit: 10, // Số items per page
    total: 25, // Tổng số items
  },
  "Lấy danh sách người dùng thành công",
  { vietnamese: true }
);
```

## 4. Sử dụng trong API Routes

### Express.js Example

```typescript
app.get("/api/users/:id", async (req, res) => {
  try {
    const user = await userService.findById(req.params.id);

    if (!user) {
      const response = notFound("Không tìm thấy người dùng", {
        vietnamese: true,
        requestId: req.id,
      });
      return res.status(response.statusCode).json(response);
    }

    const response = success(user, "Lấy thông tin người dùng thành công", {
      vietnamese: true,
      requestId: req.id,
    });

    res.status(response.statusCode).json(response);
  } catch (error) {
    const response = internalError(
      "Có lỗi xảy ra khi lấy thông tin người dùng",
      error as Error,
      { vietnamese: true, requestId: req.id }
    );

    res.status(response.statusCode).json(response);
  }
});
```

## Lợi ích

1. **Nhất quán**: Tất cả API đều có cấu trúc response giống nhau
2. **Type Safety**: Đảm bảo an toàn kiểu dữ liệu với TypeScript
3. **i18n Support**: Hỗ trợ thông báo tiếng Việt
4. **Error Tracking**: Request ID và timestamp để debug
5. **Pagination**: Hỗ trợ phân trang chuẩn
6. **Developer Experience**: Dễ sử dụng và maintain

Với response utilities này, bạn có thể đảm bảo tất cả API trong hệ thống đều có cấu trúc response nhất quán và professional! 🚀
