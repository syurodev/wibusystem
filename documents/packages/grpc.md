<!-- Tệp này sẽ được tạo khi bạn xác nhận -->

# @repo/grpc

Package tập trung quản lý các định nghĩa Protocol Buffer (`.proto`), mã gRPC client/server được tạo tự động, các hàm khởi tạo client tiện ích, và các thành phần gRPC dùng chung khác cho monorepo.

## Mục đích

Package `@repo/grpc` được thiết kế để:

- **Định nghĩa tập trung (Centralized Definitions)**: Cung cấp một nơi duy nhất để lưu trữ và quản lý tất cả các file `.proto` cho các service trong hệ thống.
- **Tạo mã nhất quán (Consistent Code Generation)**: Đảm bảo rằng mã client và server stub từ các file `.proto` được tạo ra một cách nhất quán và có thể được sử dụng bởi các package/application khác.
- **Tái sử dụng Client/Server Logic**: Cung cấp các hàm tiện ích (helper functions) để dễ dàng khởi tạo gRPC clients với các cấu hình mặc định (ví dụ: interceptors, credentials). Có thể mở rộng để cung cấp các base class hoặc helper cho việc tạo gRPC servers.
- **Quản lý Type an toàn**: Export các types và interfaces được tạo từ file `.proto`, giúp đảm bảo type safety khi giao tiếp giữa các service.
- **Đơn giản hóa việc tích hợp gRPC**: Giúp các developer dễ dàng tích hợp và sử dụng gRPC trong các service của họ mà không cần phải lo lắng nhiều về các chi tiết cài đặt ở mức thấp.

## Các tính năng chính

- **Lưu trữ file `.proto`**: Chứa tất cả các file định nghĩa service và message của Protocol Buffer.
- **Tạo mã tự động**: Tích hợp scripts để tự động tạo mã nguồn TypeScript từ các file `.proto` bằng `grpc-tools` và plugin `ts-proto`.
- **Client Factory Functions**: Cung cấp các hàm để dễ dàng tạo instance của gRPC clients, có thể đã được cấu hình sẵn với interceptors, credentials mặc định.
- **(Tùy chọn) Server Helpers**: Cung cấp các hàm hoặc base class để hỗ trợ việc xây dựng gRPC servers.
- **(Tùy chọn) Common Interceptors**: Chứa các client/server interceptors dùng chung.
- **Export các Type đã tạo**: Tái export các message types và service client interfaces được tạo ra từ `.proto`.

## Cấu trúc thư mục gợi ý

```
packages/grpc/
├── protos/                     # Chứa tất cả các file .proto gốc
│   ├── user_service/           # Nhóm theo service hoặc bounded context
│   │   └── v1/
│   │       └── user.proto
│   ├── novel_service/
│   │   └── v1/
│   │       └── novel.proto
│   └── common_messages/        # Các message types dùng chung
│       └── v1/
│           └── common.proto
├── src/
│   ├── generated/              # Mã TypeScript được tạo tự động từ .proto (bằng ts-proto)
│   │   ├── user_service/
│   │   │   └── v1/
│   │   │       └── user.ts     // Chứa messages, service client/interface cho UserAPIService
│   │   ├── novel_service/
│   │   │   └── v1/
│   │   │       └── novel.ts
│   │   └── common_messages/
│   │       └── v1/
│   │           └── common.ts
│   ├── clients/                # Logic khởi tạo gRPC clients
│   │   ├── user.client.ts
│   │   ├── novel.client.ts
│   │   └── index.ts
│   ├── servers/                # (Tùy chọn)
│   ├── interceptors/           # (Tùy chọn)
│   ├── types/                  # (Tùy chọn)
│   ├── index.ts                # Export chính của package
│   └── utils/                  # (Tùy chọn)
├── package.json
├── tsconfig.json
└── scripts/
    └── generate-grpc.ts        # Script Node.js để chạy code generation với ts-proto
```

## Cách hoạt động và sử dụng

### 1. Định nghĩa Protocol Buffers

- Các file `.proto` được viết và lưu trữ trong thư mục `protos/`.
- Nên tổ chức các file `.proto` theo từng service và phiên bản (ví dụ: `protos/user_service/v1/user.proto`).
- Sử dụng các message type chung từ `protos/common_messages/` nếu có thể để tránh lặp lại.

**Ví dụ `protos/user_service/v1/user.proto`:**

```protobuf
syntax = "proto3";

package user_service.v1;

import "common_messages/v1/common.proto";

option go_package = "github.com/your-org/your-project/gen/go/user_service/v1;user_service_v1";
option java_multiple_files = true;
option java_package = "com.yourorg.userservice.v1";
option java_outer_classname = "UserProtoV1";

service UserAPIService {
  rpc GetUser(common_messages.v1.IdRequest) returns (UserResponse);
  rpc CreateUser(CreateUserRequest) returns (UserResponse);
}

message User {
  string id = 1;
  string full_name = 2;
  string email = 3;
  int64 created_at = 4;
  int64 updated_at = 5;
}

message UserResponse {
  User user = 1;
}

message CreateUserRequest {
  string full_name = 1;
  string email = 2;
  string password = 3;
}
```

### 2. Tạo mã tự động (Code Generation)

- Script `scripts/generate-grpc.ts` sẽ sử dụng `grpc_tools_node_protoc` (từ `grpc-tools`) cùng với plugin `protoc-gen-ts_proto` (từ `ts-proto`) để tạo mã TypeScript.
- Mã được tạo sẽ nằm trong `src/generated/` và là các file `.ts`.

**Ví dụ script `scripts/generate-grpc.ts` (sử dụng `ts-proto`):**

```typescript
// scripts/generate-grpc.ts
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const protoRootDir = path.resolve(__dirname, "../protos");
const generatedDir = path.resolve(__dirname, "../src/generated");

function findProtoFiles(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findProtoFiles(filePath));
    } else if (path.extname(filePath) === ".proto") {
      results.push(filePath);
    }
  });
  return results;
}

const protoFiles = findProtoFiles(protoRootDir);

if (!fs.existsSync(generatedDir)) {
  fs.mkdirSync(generatedDir, { recursive: true });
}

const tsProtoPluginPath = path.resolve(
  __dirname,
  "../node_modules/.bin/protoc-gen-ts_proto" // Đảm bảo ts-proto đã được cài
);

protoFiles.forEach((protoFile) => {
  const relativeProtoDir = path.dirname(path.relative(protoRootDir, protoFile));
  const outDir = path.join(generatedDir, relativeProtoDir);

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const command = [
    `grpc_tools_node_protoc`, // Sử dụng protoc từ grpc-tools
    `--plugin=protoc-gen-ts_proto=${tsProtoPluginPath}`,
    `--ts_proto_out=${outDir}`,
    // Tùy chọn cho ts-proto:
    // addGrpcMetadata:true -> Thêm hỗ trợ metadata cho gRPC.
    // nestJs=false -> Không tạo code đặc thù cho NestJS.
    // outputServices=grpc-js -> Tạo service definitions tương thích với @grpc/grpc-js.
    // env=node -> Tối ưu cho môi trường Node.js.
    // useSnakeCase=true -> Giữ snake_case cho tên trường trong code TS (theo code-rule).
    // esModuleInterop=true -> Hỗ trợ tốt hơn cho ES Modules.
    // forceLong=long -> Sử dụng long.js cho kiểu int64/uint64.
    // useDate=false -> Nếu proto dùng google.protobuf.Timestamp, sẽ dùng type đó thay vì Date object.
    // exportCommonSymbols=false -> Tránh ts-proto tự export các common type.
    // outputJsonMethods=true, outputPartialMethods=true -> Tạo các hàm tiện ích toJSON/fromJSON/fromPartial.
    `--ts_proto_opt=addGrpcMetadata=true,nestJs=false,outputServices=grpc-js,env=node,useSnakeCase=true,esModuleInterop=true,forceLong=long,useDate=false,exportCommonSymbols=false,outputJsonMethods=true,outputPartialMethods=true`,
    `--proto_path=${protoRootDir}`, // Để protoc tìm thấy các file import (ví dụ common_messages.proto)
    protoFile,
  ].join(" ");

  console.log(`Generating ts-proto code for ${protoFile}...`);
  try {
    execSync(command, { stdio: "inherit" });
    console.log(`Successfully generated ts-proto code for ${protoFile}`);
  } catch (error) {
    console.error(`Error generating ts-proto code for ${protoFile}:`, error);
    process.exit(1);
  }
});

console.log("All gRPC (ts-proto) code generation finished.");
```

### 3. Client Factory Functions

Trong thư mục `src/clients/`, bạn sẽ tạo các hàm để khởi tạo client. Các hàm này có thể nhận URL từ package `@repo/config` và các tùy chọn khác.

**Ví dụ `src/clients/user.client.ts`:**

```typescript
import * as grpc from "@grpc/grpc-js";
// Đường dẫn import sẽ thay đổi tùy theo output của ts-proto, ví dụ:
import { UserAPIServiceClient } from "../generated/user_service/v1/user";

export interface GrpcClientOptions {
  credentials?: grpc.ChannelCredentials;
  interceptors?: grpc.Interceptor[];
}

export function createUserServiceClient(
  serviceUrl: string,
  options?: GrpcClientOptions
): UserAPIServiceClient {
  const defaultCredentials = grpc.credentials.createInsecure();

  const client = new UserAPIServiceClient(
    serviceUrl,
    options?.credentials || defaultCredentials,
    {
      // Channel options
    }
  );
  return client;
}
```

### 4. Export và Sử dụng

**`src/index.ts` của `@repo/grpc` (với `ts-proto`):**

```typescript
// Export client factory functions
export * from "./clients/user.client";
export * from "./clients/novel.client";

// Re-export các message types và service clients đã generated từ ts-proto
// ts-proto thường gộp chung vào một file .ts (ví dụ: user.ts)
export * from "./generated/user_service/v1/user";
export * from "./generated/novel_service/v1/novel";
export * from "./generated/common_messages/v1/common";

// (Tùy chọn) Export các server helpers, interceptors, types tùy chỉnh
// export * from './types';
```

**Sử dụng trong một service khác (ví dụ `api-gateway`):**

```typescript
import { config } from "@repo/config";
import {
  createUserServiceClient,
  UserAPIServiceClient, // Client
  GetUserRequest, // Request message type
  UserResponse, // Response message type
} from "@repo/grpc";

const userServiceUrl = config.grpc.userServiceUrl;
const userClient: UserAPIServiceClient =
  createUserServiceClient(userServiceUrl);

async function fetchUser(userId: string): Promise<UserResponse | undefined> {
  // Sửa lại kiểu trả về cho phù hợp
  // ts-proto thường cung cấp static create() hoặc fromPartial() cho messages
  const request = GetUserRequest.create({ id: userId });

  return new Promise((resolve, reject) => {
    userClient.getUser(request, (error, response) => {
      if (error) {
        console.error("gRPC Error (getUser):", error);
        return reject(error);
      }
      resolve(response); // response đã là kiểu UserResponse
    });
  });
}
```

## Dependencies gợi ý

Trong `packages/grpc/package.json`:

```json
{
  "name": "@repo/grpc",
  "version": "0.1.0",
  "scripts": {
    "clean": "rm -rf dist src/generated",
    "generate:proto": "ts-node ./scripts/generate-grpc.ts",
    "build:ts": "tsup src/index.ts --format cjs,esm --dts",
    "build": "npm run generate:proto && npm run build:ts",
    "dev": "npm run generate:proto && tsup src/index.ts --format cjs,esm --dts --watch"
  },
  "dependencies": {
    "@grpc/grpc-js": "^1.9.x",
    "google-protobuf": "^3.21.x", // ts-proto có thể cần types từ đây, hoặc tự generate
    "long": "^5.2.x" // Thường cần cho int64 khi dùng ts-proto với forceLong=long
  },
  "devDependencies": {
    "@repo/eslint-config": "*",
    "@repo/typescript-config": "*",
    "@types/google-protobuf": "^3.15.x",
    "@types/node": "^18.x.x || ^20.x.x",
    "eslint": "^8.x.x",
    "grpc-tools": "^1.12.x", // Cung cấp grpc_tools_node_protoc
    "ts-node": "^10.9.x",
    "ts-proto": "^1.167.x", // Plugin generator chính
    "tsup": "^8.x.x",
    "typescript": "^5.x.x"
  }
}
```

## Quy trình làm việc

### Thêm/Cập nhật một RPC Service hoặc Message

1.  **Chỉnh sửa file `.proto`**: Mở file `.proto` tương ứng trong `protos/` (hoặc tạo mới) và định nghĩa/cập nhật service, RPC methods, messages.
2.  **Chạy Code Generation**: Chạy lệnh `npm run generate:proto` (hoặc `npm run build`) trong package `@repo/grpc` để tạo lại các file trong `src/generated/`.
3.  **(Nếu cần) Cập nhật Client Factory**: Nếu có thay đổi về cách khởi tạo client hoặc thêm client mới, cập nhật các file trong `src/clients/`.
4.  **Export**: Đảm bảo các message types và service clients mới được export từ `src/index.ts` của `@repo/grpc`.
5.  **Sử dụng**: Các package khác có thể import và sử dụng các client/type mới.

---

Đây là một bộ khung khá chi tiết. Bạn có thể bắt đầu từ đây và điều chỉnh các công cụ, cấu trúc file, hoặc các tính năng cụ thể cho phù hợp với dự án của mình.

Bạn thấy tài liệu phác thảo này thế nào?
