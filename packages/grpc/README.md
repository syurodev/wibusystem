# @repo/grpc

Package gRPC cho WibuSystem - Cung cấp cấu hình server, client và proto types cho toàn bộ dự án.

## Cài đặt

```bash
bun add @repo/grpc
```

## Tính năng

- ✅ gRPC Server factory với cấu hình linh hoạt
- ✅ gRPC Client manager với connection pooling
- ✅ Auto-generated TypeScript types từ proto files
- ✅ Utilities cho metadata, error handling, credentials
- ✅ Hỗ trợ multiple proto files

## Cách sử dụng

### 1. Tạo gRPC Server

```typescript
import { createGrpcServer, createAuthServiceDefinition } from "@repo/grpc";

// Tạo server
const server = createGrpcServer({
  host: "0.0.0.0",
  port: 50051,
});

// Thêm service implementation
const authServiceImplementation = {
  validateToken: async (call, callback) => {
    try {
      const { token, device_id, session_id, ip_address } = call.request;

      // Your validation logic here
      const response = {
        status: 200,
        status_code: "SUCCESS",
        message: "Token is valid",
        data: {
          id: 1,
          roles: ["user"],
          permissions: ["read"],
          verified_email: true,
          verified_phone: false,
          device_id,
          session_id,
        },
        metadata: "{}",
        timestamp: new Date().toISOString(),
        request_id: "req-123",
      };

      callback(null, response);
    } catch (error) {
      callback(error, null);
    }
  },
};

// Đăng ký service
server.addService(createAuthServiceDefinition(), authServiceImplementation);

// Khởi động server
await server.start();
```

### 2. Tạo gRPC Client

```typescript
import {
  createGrpcClient,
  AuthServiceClientImpl,
  ValidateTokenRequest,
  createMetadata,
} from "@repo/grpc";

// Tạo client manager
const clientManager = createGrpcClient({
  host: "localhost",
  port: 50051,
});

// Lấy auth service client
const authClient = clientManager.getClient("auth", AuthServiceClientImpl);

// Gọi service
const request: ValidateTokenRequest = {
  token: "jwt-token-here",
  device_id: "device-123",
  session_id: "session-456",
  ip_address: "192.168.1.1",
};

const metadata = createMetadata({
  "request-id": "req-123",
  "user-agent": "MyApp/1.0",
});

try {
  const response = await authClient.validateToken(request, metadata);
  console.log("Validation result:", response);
} catch (error) {
  console.error("Validation error:", error);
}
```

### 3. Utilities

```typescript
import {
  createMetadata,
  handleGrpcError,
  createCredentials,
  createServerAddress,
  parseServerAddress,
} from "@repo/grpc";

// Tạo metadata
const metadata = createMetadata({
  authorization: "Bearer token",
  "request-id": "unique-id",
});

// Xử lý error
try {
  // gRPC call
} catch (error) {
  const grpcError = handleGrpcError(error);
  console.log(`Error ${grpcError.code}: ${grpcError.message}`);
}

// Tạo credentials
const insecureCredentials = createCredentials(); // Insecure
const secureCredentials = createCredentials({
  secure: true,
  ca: caCert,
  cert: clientCert,
  key: clientKey,
});

// Address utilities
const address = createServerAddress("localhost", 50051); // "localhost:50051"
const { host, port } = parseServerAddress("localhost:50051"); // { host: "localhost", port: 50051 }
```

## Development

### Thêm Proto File mới

1. Tạo file `.proto` trong `src/protos/`
2. Thêm script generate trong `package.json`:

```json
{
  "scripts": {
    "generate:proto:newservice": "protoc --plugin=../../node_modules/.bin/protoc-gen-ts_proto --ts_proto_out=./src/generated --ts_proto_opt=addGrpcMetadata=true --ts_proto_opt=snakeToCamel=false --proto_path=./src/protos newservice.proto"
  }
}
```

3. Cập nhật script `generate:proto` để include file mới
4. Chạy `bun run generate:proto`
5. Export types trong `src/index.ts`

### Build Package

```bash
# Generate proto types và build
bun run build

# Chỉ generate proto
bun run generate:proto

# Run tests
bun test
```

## Types

### Server Config

```typescript
interface GrpcServerConfig {
  host?: string; // Default: '0.0.0.0'
  port: number; // Required
  credentials?: grpc.ServerCredentials;
  options?: grpc.ChannelOptions;
}
```

### Client Config

```typescript
interface GrpcClientConfig {
  host: string; // Required
  port: number; // Required
  credentials?: grpc.ChannelCredentials;
  options?: grpc.ChannelOptions;
}
```

### Generated Types

Tất cả types được auto-generate từ proto files:

- `ValidateTokenRequest`
- `ValidateTokenResponse`
- `ValidateTokenResponse_TokenData`
- `ErrorData`
- `AuthService` interface
- `AuthServiceClientImpl` class

## Proto Files

### Hiện tại

- `auth.proto` - Authentication service với `validateToken` method

### Cấu trúc

```
src/
├── protos/
│   └── auth.proto              # Proto definitions
├── generated/
│   └── auth.ts                 # Generated TypeScript
├── server/
│   └── index.ts                # Server factory
├── client/
│   └── index.ts                # Client manager
├── utils/
│   └── index.ts                # Utilities
└── index.ts                    # Main exports
```

## Đóng góp

1. Fork repo
2. Tạo feature branch
3. Commit changes
4. Tạo Pull Request

## License

MIT
