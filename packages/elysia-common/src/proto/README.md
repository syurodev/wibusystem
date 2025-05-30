# gRPC Proto Files

Thư mục này chứa các protocol buffer (.proto) files định nghĩa gRPC services và message types được shared giữa các microservices trong hệ thống.

## Services Overview

### 🔐 AuthService (`auth.proto`)

Authentication và authorization service

**Methods:**

- `Login` - Đăng nhập user
- `Register` - Đăng ký user mới
- `RefreshToken` - Refresh access token
- `Logout` - Đăng xuất user
- `VerifyToken` - Verify JWT token
- `ResetPassword` - Reset password
- `ChangePassword` - Đổi password

### 👤 UserService (`user.proto`)

User management service

**Methods:**

- `GetUser` - Get user by ID
- `ListUsers` - List users with pagination
- `CreateUser` - Create new user
- `UpdateUser` - Update user information
- `DeleteUser` - Delete user
- `AuthenticateUser` - Authenticate user credentials

### 🔔 NotificationService (`notification.proto`)

Notification service với real-time support

**Methods:**

- `SendNotification` - Send single notification
- `SendBulkNotifications` - Send notifications to multiple users
- `GetUserNotifications` - Get user's notifications
- `MarkAsRead` - Mark notification as read
- `MarkAllAsRead` - Mark all notifications as read
- `DeleteNotification` - Delete notification
- `SubscribeToNotifications` - Real-time notification stream

## Message Types

### Common Messages

- `PaginationInfo` - Pagination metadata
- `TokenPair` / `AuthTokens` - JWT token pairs
- `UserInfo` - Basic user information

### Request/Response Patterns

Tất cả response messages follow standard pattern:

```protobuf
message SomeResponse {
  bool success = 1;
  // data fields...
  string message = N;
}
```

## Usage Examples

### Loading Proto Definitions

```typescript
import {
  loadAllProtos,
  loadServiceConstructors,
} from "@repo/elysia-common/proto";

// Load all proto definitions
const protos = loadAllProtos();

// Get service constructors
const { UserService, AuthService, NotificationService } =
  loadServiceConstructors();
```

### Creating gRPC Server

```typescript
import * as grpc from "@grpc/grpc-js";
import { loadServiceConstructors } from "@repo/elysia-common/proto";

const { UserService } = loadServiceConstructors();

const server = new grpc.Server();
server.addService(UserService.service, {
  GetUser: (call, callback) => {
    const { id } = call.request;
    // Your implementation
    callback(null, {
      success: true,
      user: { id, email: "test@example.com" },
      message: "Success",
    });
  },
});

server.bindAsync(
  "0.0.0.0:50051",
  grpc.ServerCredentials.createInsecure(),
  () => {
    server.start();
  }
);
```

### Creating gRPC Client

```typescript
import {
  createGrpcClient,
  loadServiceConstructors,
} from "@repo/elysia-common/proto";

const { UserService } = loadServiceConstructors();

const userClient = createGrpcClient(UserService, "localhost:50051");

// Use the client
userClient.GetUser({ id: "123" }, (error, response) => {
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("User:", response.user);
  }
});

// Or with promises
const getUser = (id: string) => {
  return new Promise((resolve, reject) => {
    userClient.GetUser({ id }, (error, response) => {
      if (error) reject(error);
      else resolve(response);
    });
  });
};
```

## TypeScript Type Generation

Generate TypeScript types từ proto files:

```bash
# From package root
bun run proto:build

# Or manually
bun run generate-types
```

**Requirements:**

- `protoc` (Protocol Compiler)
- `protoc-gen-ts` (TypeScript generator)

**Installation:**

```bash
# MacOS
brew install protobuf

# Ubuntu/Debian
sudo apt-get install protobuf-compiler

# TypeScript generator
npm install -g protoc-gen-ts
```

Generated types sẽ được placed trong `../generated/` directory.

## Service Ports Convention

Recommended port assignments:

- **AuthService**: `50051`
- **UserService**: `50052`
- **NotificationService**: `50053`
- **Other services**: `50054+`

## Versioning Strategy

Khi cần breaking changes:

```
src/proto/
├── v1/
│   ├── user.proto
│   ├── auth.proto
│   └── notification.proto
├── v2/
│   ├── user.proto      # Updated version
│   ├── auth.proto      # Updated version
│   └── notification.proto
└── current -> v2/      # Symlink to current version
```

## Best Practices

### 1. Backwards Compatibility

- Luôn add new fields as optional
- Không remove existing fields
- Use reserved field numbers for deprecated fields

### 2. Documentation

- Comment tất cả services, methods, và messages
- Include examples trong comments
- Document error scenarios

### 3. Naming Conventions

- Services: `PascalCase` ending with `Service`
- Methods: `PascalCase` (verb-first: `GetUser`, `CreateUser`)
- Messages: `PascalCase`
- Fields: `snake_case`

### 4. Error Handling

- Luôn include `success` field trong response
- Provide meaningful error messages
- Use standard gRPC status codes

### 5. Testing

- Test proto compilation
- Validate message serialization/deserialization
- Test service method signatures

## Development Workflow

1. **Modify proto files** trong này directory
2. **Update version** nếu có breaking changes
3. **Generate types**: `bun run proto:build`
4. **Update implementations** trong các microservices
5. **Test compatibility** giữa services
6. **Deploy** new versions

## Troubleshooting

### Common Issues

**Proto loading errors:**

```bash
# Check proto file syntax
protoc --proto_path=. --descriptor_set_out=/dev/null user.proto
```

**Type generation fails:**

```bash
# Check protoc installation
protoc --version

# Check protoc-gen-ts
protoc-gen-ts --version
```

**Service loading errors:**

- Verify proto file paths
- Check import statements
- Ensure package names match

### Debugging

Enable gRPC debug logging:

```typescript
process.env.GRPC_VERBOSITY = "DEBUG";
process.env.GRPC_TRACE = "all";
```

## Related Documentation

- [gRPC Node.js Documentation](https://grpc.io/docs/languages/node/)
- [Protocol Buffers Documentation](https://developers.google.com/protocol-buffers)
- [Elysia gRPC Integration Guide](../grpc/README.md)
