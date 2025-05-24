# Hướng dẫn di chuyển từ Proto nội bộ sang package chung

Tài liệu này hướng dẫn cách chuyển đổi một service đang sử dụng proto nội bộ sang sử dụng proto từ package chung `@repo/elysia-grpc`.

## 1. Cập nhật package.json

Thêm dependency vào file `package.json` của service:

```json
{
  "dependencies": {
    "@repo/elysia-grpc": "*"
    // Các dependency khác...
  }
}
```

## 2. Cập nhật mã trong service

### 2.1. Cập nhật import

Thay vì import các type và đường dẫn proto từ thư mục nội bộ, sử dụng package chung:

```typescript
// Trước đây
import {
  ValidateTokenRequest,
  ValidateTokenResponse,
} from "./grpc/protos/auth";
import path from "path";
const PROTO_PATH = path.resolve(__dirname, "./grpc/protos/auth.proto");

// Thay đổi thành
import {
  PROTO_PATHS,
  PROTO_PACKAGES,
  ValidateTokenRequest,
  ValidateTokenResponse,
} from "@repo/elysia-grpc";
```

### 2.2. Cập nhật cấu hình gRPC

```typescript
// Trước đây
const grpcOptions = {
  url: "0.0.0.0:50051",
  protoDefinitions: [
    {
      packageName: "com.wibu.auth",
      protoPath: PROTO_PATH,
    },
  ],
  serviceHandlers: authServiceHandlers,
};

// Thay đổi thành
const grpcOptions = {
  url: "0.0.0.0:50051",
  protoDefinitions: [
    {
      packageName: PROTO_PACKAGES.auth,
      protoPath: PROTO_PATHS.auth,
    },
  ],
  serviceHandlers: authServiceHandlers,
};
```

## 3. Cập nhật gRPC handlers

Đảm bảo handlers của bạn phù hợp với tên service và package từ package chung:

```typescript
// Trước đây
const authServiceHandlers = {
  "com.wibu.auth.AuthService": {
    ValidateToken: async (call, callback) => {
      // Xử lý
    },
  },
};

// Thay đổi thành
const authServiceHandlers = {
  [`${PROTO_PACKAGES.auth}.AuthService`]: {
    ValidateToken: async (call, callback) => {
      // Xử lý
    },
  },
};
```

## 4. Dọn dẹp code cũ

Sau khi đã chuyển đổi thành công, bạn có thể xóa thư mục proto nội bộ:

```bash
rm -rf src/grpc/protos
```

## 5. Cập nhật hoặc thêm proto mới

Khi cần cập nhật hoặc thêm proto mới:

1. Thêm hoặc cập nhật proto trong package `@repo/elysia-grpc`
2. Chạy lệnh gen:proto trong package đó
3. Publish phiên bản mới của package (hoặc commit thay đổi nếu dùng monorepo)
4. Cập nhật dependency trong service
   ß
