# @your-workspace/common

Package chứa các utilities, types, và hàm dùng chung cho cả client (frontend) và backend trong hệ thống.

## Mục đích

Package này được thiết kế để:

- Chia sẻ code logic giữa các ứng dụng frontend và backend
- Đảm bảo tính nhất quán của types và constants trên toàn hệ thống
- Giảm thiểu code trùng lặp
- Tạo ra một nguồn đáng tin cậy cho các định nghĩa chung

## Cấu trúc thư mục

```
packages/common/
├── src/
│   ├── types/                  # Type definitions dùng chung
│   │   ├── api/                # Types liên quan đến API
│   │   │   ├── request.ts      # Request types
│   │   │   ├── response.ts     # Response types (ApiResponse, PaginatedData, etc.)
│   │   │   ├── config.ts       # API endpoint configuration types
│   │   │   └── index.ts        # Re-exports
│   │   ├── entities/           # Business entities (các trường dữ liệu là snake_case)
│   │   │   ├── user.ts         # User related types (e.g., full_name, created_at)
│   │   │   ├── product.ts      # Product related types
│   │   │   ├── order.ts        # Order related types
│   │   │   └── index.ts        # Re-exports
│   │   ├── errors/             # Error types
│   │   │   ├── api-error.ts    # API error types (cấu trúc error chi tiết)
│   │   │   ├── validation.ts   # Validation error types
│   │   │   └── index.ts        # Re-exports
│   │   ├── editor/             # Types for rich text editor content (các trường dữ liệu là snake_case nếu có nhiều từ)
│   │   │   ├── content.ts      # Editor content structure
│   │   │   └── index.ts        # Re-exports
│   │   └── index.ts            # Re-exports tất cả types
│   ├── constants/              # Constants dùng chung
│   │   ├── api/                # API constants
│   │   │   ├── endpoints.ts    # API endpoints
│   │   │   ├── versions.ts     # API versions (deprecated, use enum instead)
│   │   │   ├── headers.ts      # API headers
│   │   │   └── index.ts        # Re-exports
│   │   ├── app/                # App constants
│   │   │   ├── limits.ts       # Limits (size, length, etc. - deprecated, use defaults or specific constants)
│   │   │   ├── defaults.ts     # Default values (PAGE_SIZE, MAX_PAGE_SIZE, etc.)
│   │   │   └── index.ts        # Re-exports
│   │   ├── errors/             # Error constants
│   │   │   ├── codes.ts        # Error codes (deprecated, use enum instead)
│   │   │   ├── messages.ts     # Error messages
│   │   │   └── index.ts        # Re-exports
│   │   └── index.ts            # Re-exports tất cả constants
│   ├── utils/                  # Pure functions & utilities
│   │   ├── api/                # API related utilities
│   │   │   ├── response-formatter.ts # Hàm tạo cấu trúc API response chuẩn
│   │   │   └── index.ts        # Re-exports
│   │   ├── date/             # Date/Time utilities (sử dụng Luxon)
│   │   │   ├── format.ts       # Date formatting functions
│   │   │   ├── convert.ts      # Date conversion (e.g., to/from Unix timestamp)
│   │   │   ├── manipulate.ts   # Date manipulation (add, subtract)
│   │   │   ├── constants.ts    # Date related constants (e.g., common formats)
│   │   │   └── index.ts        # Re-exports
│   │   ├── formatting/         # Các formatters khác (ngoài Date)
│   │   │   ├── currency/       # Currency formatters
│   │   │   │   ├── format.ts   # Currency format function
│   │   │   │   └── index.ts    # Re-exports
│   │   │   ├── number/         # Number formatters
│   │   │   │   ├── format.ts   # Number format functions
│   │   │   │   └── index.ts    # Re-exports
│   │   │   └── index.ts        # Re-exports
│   │   ├── validation/         # Validation helpers
│   │   │   ├── string/         # String validation
│   │   │   │   ├── is-empty.ts # Empty string check
│   │   │   │   ├── is-email.ts # Email validation
│   │   │   │   └── index.ts    # Re-exports
│   │   │   ├── number/         # Number validation
│   │   │   │   ├── is-positive.ts  # Positive number check
│   │   │   │   └── index.ts    # Re-exports
│   │   │   └── index.ts        # Re-exports
│   │   ├── helpers/            # Các helper functions khác
│   │   │   ├── object/         # Object helpers
│   │   │   │   ├── omit.ts     # Omit properties
│   │   │   │   ├── pick.ts     # Pick properties
│   │   │   │   └── index.ts    # Re-exports
│   │   │   ├── array/          # Array helpers
│   │   │   │   ├── chunk.ts    # Chunk array
│   │   │   │   ├── unique.ts   # Get unique values
│   │   │   │   └── index.ts    # Re-exports
│   │   │   └── index.ts        # Re-exports
│   │   └── index.ts            # Re-exports tất cả utils
│   ├── enums/                  # Enums dùng chung
│   │   ├── user/               # User related enums
│   │   │   ├── role.ts         # User roles (RoleEnum)
│   │   │   ├── status.ts       # User statuses (UserStatusEnum)
│   │   │   ├── permission.ts   # User permissions (PermissionEnum)
│   │   │   └── index.ts        # Re-exports
│   │   ├── common/             # Common enums
│   │   │   ├── boolean.ts      # Boolean enums (BooleanEnum, TriStateBooleanEnum)
│   │   │   ├── status.ts       # General status enums
│   │   │   └── index.ts        # Re-exports
│   │   ├── http/               # HTTP related enums
│   │   │   ├── status-code.ts  # HTTP status codes (HttpStatusCodeEnum)
│   │   │   ├── method.ts       # HTTP methods (HttpMethodEnum)
│   │   │   └── index.ts        # Re-exports
│   │   ├── error/              # Error related enums
│   │   │   ├── code.ts         # Error codes (ErrorCodeEnum)
│   │   │   ├── type.ts         # Error types
│   │   │   └── index.ts        # Re-exports
│   │   ├── api/                # API related enums
│   │   │   ├── version.ts      # API Version (ApiVersionEnum)
│   │   │   ├── access-type.ts  # API Access Type (ApiAccessTypeEnum)
│   │   │   └── index.ts        # Re-exports
│   │   └── index.ts            # Re-exports tất cả enums
│   └── index.ts                # Main export file
├── package.json
├── tsconfig.json
└── tsconfig.build.json
```

## Quy tắc và nguyên tắc thiết kế

### 1. Cross-environment compatibility

- Package này phải hoạt động được ở cả môi trường Node.js (backend) và browser (frontend).
- Không sử dụng các API chỉ có trong browser hoặc chỉ có trong Node.js.
- Nếu cần API đặc thù cho môi trường, sử dụng conditional exports hoặc dynamic imports.
- Không phụ thuộc vào framework-specific APIs (không dùng React, Express, ElysiaJS, NextJS APIs).

### 2. Minimal dependencies

- Hạn chế tối đa việc sử dụng external dependencies. Sử dụng pure JavaScript/TypeScript code khi có thể.
- Các exceptions được chấp nhận:
  - **Luxon**: Cho việc xử lý ngày giờ, do tính năng mạnh mẽ, bất biến và là bước đệm tốt cho Temporal API trong tương lai.
- Nếu cần dependency khác, ưu tiên các lightweight & well-maintained libraries và phải được thảo luận kỹ lưỡng.

### 3. Tree-shakeable

- Export từng function và type một cách riêng lẻ.
- Sử dụng named exports thay vì default exports.
- Đảm bảo bundlers (như webpack, rollup) có thể tree-shake code không sử dụng.

### 4. Strong typing & Naming Conventions

- Mọi function, constant, và export đều phải có type rõ ràng.
- Tránh sử dụng `any` type.
- Sử dụng generics khi cần thiết để tăng tính tái sử dụng.
- Sử dụng strict TypeScript config.
- **Data Fields Naming**: Tất cả các trường dữ liệu (data fields) trong entities và trong phần `data` của API responses phải sử dụng `snake_case` để đồng bộ với quy ước của database (ví dụ: `user_id`, `full_name`, `created_at`). Các trường ở cấp độ gốc của `ApiResponse` (`status`, `message`, `messageCode`, `data`) vẫn là `camelCase`.

### 5. Xử lý Ngày giờ với Luxon

- Sử dụng thư viện **Luxon** cho tất cả các thao tác liên quan đến ngày và giờ.
- **Lý do**: Luxon cung cấp API hiện đại, bất biến, xử lý múi giờ tốt và là một bước đệm tốt để chuyển sang Temporal API trong tương lai.
- **Lưu ý về Unix Timestamps**: Database lưu trữ thời gian dưới dạng Unix timestamp (number). Luxon hỗ trợ tốt việc chuyển đổi giữa Unix timestamp và đối tượng `DateTime` của nó.
  - Tạo `DateTime` từ Unix milliseconds: `DateTime.fromMillis(timestampInMs)`.
  - Tạo `DateTime` từ Unix seconds: `DateTime.fromSeconds(timestampInSeconds)`.
  - Lấy Unix milliseconds: `dateTimeObject.toMillis()`.
  - Lấy Unix seconds: `dateTimeObject.toSeconds()`.
- Nên đặt múi giờ mặc định (ví dụ: UTC) khi tạo đối tượng `DateTime` từ timestamp nếu timestamp đó không mang thông tin múi giờ, để đảm bảo tính nhất quán.

### 6. Phong cách viết Utilities: Standalone Functions

- **Ưu tiên Standalone Functions (Hàm Độc Lập)**: Tất cả các hàm tiện ích (utilities) trong package `common` nên được viết dưới dạng các hàm độc lập, được export riêng lẻ thay vì nhóm thành các phương thức static của một class.
- **Lý do chính**:
  - **Tối ưu Tree-Shaking**: Đây là yếu tố quan trọng nhất. Các hàm độc lập cho phép bundlers (Webpack, Rollup) loại bỏ hiệu quả code không sử dụng, giúp giảm kích thước bundle cuối cùng cho các ứng dụng sử dụng package này. Nếu dùng class, có nguy cơ toàn bộ class sẽ bị kéo vào bundle ngay cả khi chỉ dùng một phương thức.
  - **Đơn giản (Simplicity)**: Hàm là đơn vị code cơ bản, dễ viết, dễ hiểu, dễ đọc và dễ test. Không có sự phức tạp của `this` hoặc yêu cầu khởi tạo đối tượng.
  - **Dễ kết hợp (Composability)**: Các hàm độc lập dễ dàng kết hợp với nhau để xây dựng các logic phức tạp hơn.
  - **Phù hợp với bản chất Utilities**: Hầu hết utilities là các hàm thuần túy (pure functions) - không trạng thái (stateless) và không tác dụng phụ (side-effects). Standalone functions thể hiện rất tốt điều này.
- **Khi nào Class có thể được cân nhắc (nhưng không phải là ưu tiên cho `common`)**:
  - Quản lý trạng thái hoặc cấu hình chung mà một nhóm hàm tiện ích cần chia sẻ (ít phổ biến cho utilities thuần túy).
  - Cung cấp một namespace tự nhiên (tuy nhiên, cấu trúc module với file `index.ts` cũng giải quyết tốt vấn đề này).
- **Ví dụ (đã theo hướng standalone functions)**:

  ```typescript
  // src/utils/validation/string/is-empty.ts
  export const isNullOrEmpty = (value?: string | null): boolean => {
    /* ... */
  };

  // Khi sử dụng
  import { isNullOrEmpty } from "@your-workspace/common/utils/validation/string";
  ```

## Các module chính

### Types

Định nghĩa các types dùng chung trên toàn hệ thống:

```typescript
// src/types/api/response.ts
import { HttpStatusCodeEnum } from "../../enums/http/status-code";

/**
 * Cấu trúc chuẩn cho API response.
 * @template T Kiểu dữ liệu của phần 'data'.
 */
export interface ApiResponse<T = unknown> {
  // Mặc định T là unknown nếu không có data cụ thể
  status: HttpStatusCodeEnum; // HTTP status code (e.g., 200, 404, 500)
  message: string; // Thông điệp mô tả kết quả (e.g., "Success", "User not found") mặc định là Success
  message_code: string; // Mã thông điệp tùy chọn, có thể dùng cho i18n hoặc xử lý logic phía client mặc định là SUCCESS
  data: T; // Dữ liệu trả về, có thể là null, object, array, etc.
}

/**
 * Cấu trúc cho phần dữ liệu của API response có phân trang.
 * Các trường trong đây là snake_case.
 * @template ListItemType Kiểu dữ liệu của mỗi item trong danh sách.
 */
export interface PaginatedData<ListItemType> {
  total_record: number; // Tổng số bản ghi khớp với truy vấn
  page: number; // Trang hiện tại (giữ nguyên vì là từ đơn, hoặc có thể là page_number)
  limit: number; // Số lượng item mỗi trang (giữ nguyên vì là từ đơn)
  list: ListItemType[]; // Danh sách các item của trang hiện tại (giữ nguyên vì là từ đơn)
}

// src/types/entities/user.ts
import { RoleEnum } from "../../enums/user/role";

export interface User {
  id: string; // Giữ nguyên vì là từ đơn
  email: string; // Giữ nguyên vì là từ đơn
  full_name: string; // Đổi thành snake_case
  role: RoleEnum; // Sử dụng RoleEnum, giữ nguyên vì là từ đơn
  // Giả sử createdAt và updatedAt được lưu trữ dưới dạng Unix timestamp (milliseconds) trong DB
  // và được chuyển đổi thành number khi lấy ra hoặc string (ISO 8601) khi cần
  created_at: number; // Đổi thành snake_case (Unix timestamp)
  updated_at: number; // Đổi thành snake_case (Unix timestamp)
  // Ví dụ thêm: user_status (nếu có), avatar_url
}

// src/types/errors/api-error.ts
import { ErrorCodeEnum } from "../../enums/error/code";

export interface ApiError {
  code: ErrorCodeEnum; // Giữ nguyên
  message: string; // Giữ nguyên
  details?: Record<string, unknown>; // Giữ nguyên
}

// src/types/editor/content.ts
export interface EditorContentChild {
  text: string; // Giữ nguyên
  italic?: boolean; // Giữ nguyên
  bold?: boolean; // Giữ nguyên
  // Ví dụ: text_color, background_color nếu có
}

export interface EditorContent {
  id: string; // Giữ nguyên
  url?: string; // Giữ nguyên
  type: string; // e.g., 'paragraph', 'image', 'video', 'embed' (giữ nguyên)
  children: EditorContentChild[]; // Giữ nguyên
  // Ví dụ: created_at, updated_at nếu content này có timestamp
}

// src/types/api/config.ts (Các trường config không phải data trả về, có thể giữ camelCase)
import { RoleEnum } from "../../enums/user/role";
import { PermissionEnum } from "../../enums/user/permission";
import { ApiAccessTypeEnum } from "../../enums/api/access-type";

export interface ApiEndpointConfig {
  endpoint: string;
  type: ApiAccessTypeEnum;
  requiredRoles?: RoleEnum[];
  requiredPermissions?: PermissionEnum[];
}
```

### Enums

Chứa các enum dùng chung, mỗi enum được định nghĩa trong một file riêng biệt:

```typescript
// src/enums/common/boolean.ts
export enum BooleanEnum {
  TRUE = 1,
  FALSE = 0,
}

export enum TriStateBooleanEnum {
  TRUE = 1,
  FALSE = 0,
  ALL = -1, // Hoặc có thể là một string như 'ALL'
}

export enum YesNoEnum {
  YES = "Y",
  NO = "N",
}

// src/enums/api/version.ts
export enum ApiVersionEnum {
  V1 = "v1",
  V2 = "v2",
  // Thêm các version khác nếu cần
}

// src/enums/api/access-type.ts
export enum ApiAccessTypeEnum {
  PUBLIC = "PUBLIC", // No authentication required
  OPTIONAL_AUTH = "OPTIONAL_AUTH", // Authentication is optional, endpoint behaves differently
  AUTH = "AUTH", // Authentication is required
}

// src/enums/user/role.ts (Trích xuất từ role-permission.md)
export enum RoleEnum {
  SYSTEM_ADMIN = "SYSTEM_ADMIN",
  SUB_ADMIN = "SUB_ADMIN",
  GROUP_OWNER = "GROUP_OWNER",
  GROUP_MODERATOR = "GROUP_MODERATOR",
  ANIME_CREATOR = "ANIME_CREATOR",
  MANGA_CREATOR = "MANGA_CREATOR",
  NOVEL_CREATOR = "NOVEL_CREATOR",
  SELLER = "SELLER",
  BUYER = "BUYER",
  USER = "USER", // Role mặc định
}

// src/enums/user/permission.ts (Trích xuất từ role-permission.md)
export enum PermissionEnum {
  // Content Permissions
  CONTENT_VIEW = "CONTENT_VIEW",
  ANIME_CREATE = "ANIME_CREATE",
  MANGA_CREATE = "MANGA_CREATE",
  NOVEL_CREATE = "NOVEL_CREATE",
  ANIME_EDIT_OWN = "ANIME_EDIT_OWN",
  MANGA_EDIT_OWN = "MANGA_EDIT_OWN",
  NOVEL_EDIT_OWN = "NOVEL_EDIT_OWN",
  ANIME_EDIT_ALL = "ANIME_EDIT_ALL",
  MANGA_EDIT_ALL = "MANGA_EDIT_ALL",
  NOVEL_EDIT_ALL = "NOVEL_EDIT_ALL",
  ANIME_PUBLISH_IMMEDIATE = "ANIME_PUBLISH_IMMEDIATE",
  MANGA_PUBLISH_IMMEDIATE = "MANGA_PUBLISH_IMMEDIATE",
  NOVEL_PUBLISH_IMMEDIATE = "NOVEL_PUBLISH_IMMEDIATE",
  ANIME_SUBMIT_FOR_APPROVAL = "ANIME_SUBMIT_FOR_APPROVAL",
  MANGA_SUBMIT_FOR_APPROVAL = "MANGA_SUBMIT_FOR_APPROVAL",
  NOVEL_SUBMIT_FOR_APPROVAL = "NOVEL_SUBMIT_FOR_APPROVAL",
  ANIME_APPROVE = "ANIME_APPROVE",
  MANGA_APPROVE = "MANGA_APPROVE",
  NOVEL_APPROVE = "NOVEL_APPROVE",
  ANIME_TRANSLATE_RAW = "ANIME_TRANSLATE_RAW",
  MANGA_TRANSLATE_RAW = "MANGA_TRANSLATE_RAW",
  NOVEL_TRANSLATE_RAW = "NOVEL_TRANSLATE_RAW",

  // Comment Permissions
  COMMENT_VIEW = "COMMENT_VIEW",
  COMMENT_CREATE = "COMMENT_CREATE",
  COMMENT_EDIT_OWN = "COMMENT_EDIT_OWN",
  COMMENT_EDIT_ALL = "COMMENT_EDIT_ALL",
  COMMENT_DELETE_OWN = "COMMENT_DELETE_OWN",
  COMMENT_DELETE_ALL = "COMMENT_DELETE_ALL",

  // User & Group Management Permissions
  USER_VIEW = "USER_VIEW",
  USER_MANAGE = "USER_MANAGE",
  SUBADMIN_MANAGE = "SUBADMIN_MANAGE",
  GROUP_MANAGE = "GROUP_MANAGE",
  GROUP_MEMBER_MANAGE = "GROUP_MEMBER_MANAGE",

  // System Permissions
  SYSTEM_CONFIG = "SYSTEM_CONFIG",

  // E-commerce Permissions
  SELLER_MANAGE_PRODUCT = "SELLER_MANAGE_PRODUCT",
  SELLER_VIEW_ORDERS = "SELLER_VIEW_ORDERS",
  BUYER_MAKE_ORDER = "BUYER_MAKE_ORDER",
  BUYER_VIEW_OWN_ORDERS = "BUYER_VIEW_OWN_ORDERS",

  // Special Permission for System Admin
  FULL_ACCESS = "FULL_ACCESS",
}

// src/enums/http/status-code.ts
export enum HttpStatusCodeEnum { // Đổi tên để nhất quán
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  INTERNAL_SERVER_ERROR = 500,
  // Thêm các status code khác nếu cần
}

// src/enums/error/code.ts (Có thể là một tập hợp các mã lỗi nghiệp vụ của bạn)
export enum ErrorCodeEnum { // Đổi tên để nhất quán
  // General Errors
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  NOT_FOUND = "NOT_FOUND", // Resource not found
  UNAUTHORIZED = "UNAUTHORIZED", // Not authenticated
  FORBIDDEN = "FORBIDDEN", // Authenticated but not authorized
  BAD_REQUEST = "BAD_REQUEST", // Generic bad request
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",

  // Feature-specific errors (ví dụ)
  USER_NOT_FOUND = "USER_NOT_FOUND",
  EMAIL_ALREADY_EXISTS = "EMAIL_ALREADY_EXISTS",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  // Thêm các mã lỗi khác nếu cần
}

// src/enums/user/status.ts - Giữ nguyên hoặc đổi tên nếu cần
export enum UserStatusEnum {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  PENDING_VERIFICATION = "PENDING_VERIFICATION",
  SUSPENDED = "SUSPENDED",
  BANNED = "BANNED",
}
```

### Constants

Định nghĩa các constants dùng chung, các constants cũng được tổ chức theo phân cấp:

```typescript
// src/constants/app/defaults.ts
export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50; // Hoặc 100 tùy theo nhu cầu trước đó
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB in bytes
export const MAX_USERNAME_LENGTH = 50;

// src/constants/api/versions.ts (Có thể bỏ file này nếu dùng ApiVersionEnum)
// export const API_VERSION = "v1";

// src/constants/errors/messages.ts
import { ErrorCodeEnum } from "../../enums/error/code";

// Cung cấp một số message mặc định, có thể được override ở backend
export const DEFAULT_ERROR_MESSAGES: Partial<Record<ErrorCodeEnum, string>> = {
  [ErrorCodeEnum.UNKNOWN_ERROR]: "An unexpected error occurred.",
  [ErrorCodeEnum.VALIDATION_ERROR]: "Dữ liệu không hợp lệ.",
  [ErrorCodeEnum.NOT_FOUND]: "Không tìm thấy tài nguyên yêu cầu.",
  [ErrorCodeEnum.UNAUTHORIZED]: "Yêu cầu xác thực.",
  [ErrorCodeEnum.FORBIDDEN]: "Không có quyền truy cập tài nguyên này.",
  [ErrorCodeEnum.INTERNAL_SERVER_ERROR]: "Lỗi hệ thống, vui lòng thử lại sau.",
  [ErrorCodeEnum.USER_NOT_FOUND]: "Người dùng không tồn tại.",
  [ErrorCodeEnum.EMAIL_ALREADY_EXISTS]: "Địa chỉ email đã được sử dụng.",
  [ErrorCodeEnum.INVALID_CREDENTIALS]: "Thông tin đăng nhập không chính xác.",
};

// src/constants/api/endpoints.ts (Ví dụ về cấu hình API)
import {
  ApiAccessTypeEnum,
  RoleEnum,
  PermissionEnum,
  ApiEndpointConfig,
} from "../../internal"; // Giả sử có internal barrel file

export const USER_API_CONFIGS: ApiEndpointConfig[] = [
  {
    endpoint: "/users",
    type: ApiAccessTypeEnum.AUTH,
    requiredRoles: [RoleEnum.SYSTEM_ADMIN, RoleEnum.SUB_ADMIN],
    requiredPermissions: [PermissionEnum.USER_VIEW],
    // version: ApiVersionEnum.V1, // Nếu cần versioning cho từng endpoint
  },
  {
    endpoint: "/users/:id",
    type: ApiAccessTypeEnum.AUTH,
    requiredRoles: [RoleEnum.SYSTEM_ADMIN, RoleEnum.SUB_ADMIN],
    requiredPermissions: [PermissionEnum.USER_VIEW],
  },
  {
    endpoint: "/auth/login",
    type: ApiAccessTypeEnum.PUBLIC,
  },
];
```

### Utilities

#### API Response Formatting Utilities

Các hàm này giúp tạo cấu trúc response API đồng nhất. Đặt trong `src/utils/api/response-formatter.ts`.

```typescript
// src/utils/api/response-formatter.ts
import { ApiResponse, PaginatedData } from "../../types/api/response";
import { HttpStatusCodeEnum } from "../../enums/http/status-code";
import { ErrorCodeEnum } from "../../enums/error/code"; // Tùy chọn: dùng ErrorCodeEnum cho messageCode
import { DEFAULT_ERROR_MESSAGES } from "../../constants/errors/messages";

/**
 * Tạo một API response thành công.
 * @template T Kiểu dữ liệu của phần 'data'.
 * @param data Dữ liệu trả về.
 * @param message Thông điệp thành công. Mặc định: "Operation successful.".
 * @param status HTTP status code. Mặc định: HttpStatusCodeEnum.OK (200).
 * @param messageCode Mã thông điệp tùy chọn.
 * @returns Đối tượng ApiResponse.
 */
export function createSuccessResponse<T>(
  data: T,
  message: string = "Operation successful.",
  status: HttpStatusCodeEnum = HttpStatusCodeEnum.OK,
  messageCode?: string | ErrorCodeEnum
): ApiResponse<T> {
  return {
    status,
    message,
    messageCode: messageCode as string, // Cast to string if using ErrorCodeEnum
    data,
  };
}

/**
 * Tạo một API response lỗi.
 * @param message Thông điệp lỗi. Nếu không có messageCode, message này sẽ được dùng.
 * @param status HTTP status code. Mặc định: HttpStatusCodeEnum.INTERNAL_SERVER_ERROR (500).
 * @param messageCode Mã lỗi (nên dùng ErrorCodeEnum). Nếu có, message có thể được lấy từ DEFAULT_ERROR_MESSAGES.
 * @param data Dữ liệu lỗi chi tiết (ví dụ: danh sách lỗi validation). Mặc định: null.
 * @returns Đối tượng ApiResponse.
 */
export function createErrorResponse<TErrorData = null>(
  message?: string, // message có thể là optional nếu dùng messageCode
  status: HttpStatusCodeEnum = HttpStatusCodeEnum.INTERNAL_SERVER_ERROR,
  messageCode?: ErrorCodeEnum,
  data: TErrorData = null as TErrorData
): ApiResponse<TErrorData> {
  const finalMessage =
    messageCode && DEFAULT_ERROR_MESSAGES[messageCode]
      ? DEFAULT_ERROR_MESSAGES[messageCode]
      : message ||
        DEFAULT_ERROR_MESSAGES[ErrorCodeEnum.UNKNOWN_ERROR] ||
        "An unexpected error occurred.";

  return {
    status,
    message: finalMessage as string,
    messageCode: messageCode || ErrorCodeEnum.UNKNOWN_ERROR,
    data,
  };
}

/**
 * Tạo một API response thành công với dữ liệu phân trang.
 * @template ListItemType Kiểu dữ liệu của mỗi item trong danh sách.
 * @param list Danh sách các item của trang hiện tại.
 * @param totalRecord Tổng số bản ghi.
 * @param page Trang hiện tại.
 * @param limit Số lượng item mỗi trang.
 * @param message Thông điệp thành công. Mặc định: "Data retrieved successfully.".
 * @param status HTTP status code. Mặc định: HttpStatusCodeEnum.OK (200).
 * @param messageCode Mã thông điệp tùy chọn.
 * @returns Đối tượng ApiResponse chứa PaginatedData.
 */
export function createPaginatedResponse<ListItemType>(
  list: ListItemType[],
  totalRecord: number, // Tham số đầu vào vẫn giữ camelCase cho tiện code
  page: number,
  limit: number,
  message: string = "Data retrieved successfully.",
  status: HttpStatusCodeEnum = HttpStatusCodeEnum.OK,
  messageCode?: string | ErrorCodeEnum
): ApiResponse<PaginatedData<ListItemType>> {
  const paginatedData: PaginatedData<ListItemType> = {
    total_record: totalRecord, // Chuyển thành snake_case ở đây
    page,
    limit,
    list,
  };
  return createSuccessResponse(paginatedData, message, status, messageCode);
}

// Ví dụ sử dụng:
// const users = [{ id: 1, full_name: "User A", created_at: Date.now() }];
// const paginatedUserResponse = createPaginatedResponse(users, 100, 1, 10, "Users fetched");
// const singleUserResponse = createSuccessResponse(users[0], "User found");
// const notFoundError = createErrorResponse(undefined, HttpStatusCodeEnum.NOT_FOUND, ErrorCodeEnum.USER_NOT_FOUND);
```

#### Date/Time Utilities (sử dụng Luxon)

Các hàm tiện ích liên quan đến ngày giờ sẽ sử dụng thư viện Luxon. Ví dụ về cách làm việc với Unix timestamp:

```typescript
// src/utils/date/convert.ts
import { DateTime } from "luxon";

/**
 * Chuyển đổi Unix timestamp (milliseconds) sang đối tượng DateTime của Luxon.
 * Mặc định sẽ set múi giờ là UTC.
 * @param ms Unix timestamp tính bằng mili giây.
 * @param zone Múi giờ (IANA string, ví dụ: 'America/New_York', 'Asia/Ho_Chi_Minh'). Mặc định là 'utc'.
 * @returns Đối tượng DateTime.
 */
export const fromMillisToDateTime = (
  ms: number,
  zone: string = "utc"
): DateTime => {
  return DateTime.fromMillis(ms, { zone });
};

/**
 * Chuyển đổi Unix timestamp (seconds) sang đối tượng DateTime của Luxon.
 * Mặc định sẽ set múi giờ là UTC.
 * @param seconds Unix timestamp tính bằng giây.
 * @param zone Múi giờ (IANA string). Mặc định là 'utc'.
 * @returns Đối tượng DateTime.
 */
export const fromSecondsToDateTime = (
  seconds: number,
  zone: string = "utc"
): DateTime => {
  return DateTime.fromSeconds(seconds, { zone });
};

/**
 * Lấy Unix timestamp (milliseconds) từ đối tượng DateTime của Luxon.
 * @param dt Đối tượng DateTime.
 * @returns Unix timestamp tính bằng mili giây.
 */
export const toMillisFromDateTime = (dt: DateTime): number => {
  return dt.toMillis();
};

/**
 * Lấy Unix timestamp (seconds) từ đối tượng DateTime của Luxon.
 * @param dt Đối tượng DateTime.
 * @returns Unix timestamp tính bằng giây (làm tròn xuống).
 */
export const toSecondsFromDateTime = (dt: DateTime): number => {
  return dt.toSeconds(); // Trả về số, có thể có phần thập phân
  // return Math.floor(dt.toSeconds()); // Nếu muốn số nguyên giây
};

// src/utils/date/format.ts
import { DateTime } from "luxon";

export const COMMON_DATE_FORMATS = {
  DATE_ONLY: "dd/MM/yyyy", // Ví dụ: 25/12/2023
  DATE_TIME: "dd/MM/yyyy HH:mm:ss", // Ví dụ: 25/12/2023 14:30:00
  ISO_DATE_TIME: "yyyy-MM-dd'T'HH:mm:ss'Z'", // Định dạng ISO 8601 (UTC)
};

/**
 * Định dạng đối tượng DateTime của Luxon thành chuỗi.
 * @param dt Đối tượng DateTime.
 * @param format Chuỗi định dạng (ví dụ: 'dd/MM/yyyy HH:mm'). Mặc định là COMMON_DATE_FORMATS.DATE_TIME.
 * @param locale Ngôn ngữ (ví dụ: 'vi-VN', 'en-US'). Mặc định là 'en-US'.
 * @returns Chuỗi ngày giờ đã định dạng.
 */
export const formatDateTime = (
  dt: DateTime,
  format: string = COMMON_DATE_FORMATS.DATE_TIME,
  locale: string = "en-US" // Hoặc 'vi-VN' tùy theo nhu cầu
): string => {
  return dt.setLocale(locale).toFormat(format);
};

/**
 * Định dạng Unix timestamp (milliseconds) thành chuỗi.
 * @param ms Unix timestamp (milliseconds).
 * @param format Chuỗi định dạng.
 * @param zone Múi giờ hiển thị. Mặc định là 'utc'.
 * @param locale Ngôn ngữ. Mặc định là 'en-US'.
 * @returns Chuỗi ngày giờ đã định dạng.
 */
export const formatMillis = (
  ms: number,
  format: string = COMMON_DATE_FORMATS.DATE_TIME,
  zone: string = "utc",
  locale: string = "en-US"
): string => {
  const dt = fromMillisToDateTime(ms, zone);
  return formatDateTime(dt, format, locale);
};
```

#### Các Utilities khác

```typescript
// src/utils/formatting/currency/format.ts
// ... (ví dụ về format tiền tệ)

// src/utils/validation/string/is-empty.ts
export const isNullOrEmpty = (
  value?: string | null
): value is null | undefined | "" => {
  return value === null || value === undefined || value.trim() === "";
};

// src/utils/helpers/object/omit.ts
export const omit = <T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  ...keys: K[]
): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach((key) => delete result[key]);
  return result;
};
```

## Setup và sử dụng

### Cài đặt

Trong một dự án monorepo sử dụng workspace (như npm/yarn/pnpm workspaces):

```json
// package.json (trong project sử dụng)
{
  "dependencies": {
    "@your-workspace/common": "workspace:*",
    "luxon": "^x.y.z" // Thêm luxon vào dependencies của project sử dụng nếu cần trực tiếp
  },
  "devDependencies": {
    // Nếu package common tự cài luxon thì không cần ở đây
  }
}
```

**Lưu ý về `luxon` dependency:**

- Package `@your-workspace/common` sẽ cần khai báo `luxon` trong `peerDependencies` hoặc `dependencies` của nó.
  - Nếu là `peerDependencies`: các project sử dụng `common` phải tự cài `luxon`.
  - Nếu là `dependencies`: `luxon` sẽ được cài cùng với `common`.
- Quyết định này phụ thuộc vào cách bạn quản lý dependencies trong monorepo.

### Import và sử dụng

Với cấu trúc phân cấp, bạn có thể import cụ thể từng thành phần cần thiết:

```typescript
// Import theo module (khuyến khích)
import {
  RoleEnum,
  PermissionEnum,
  UserStatusEnum,
} from "@your-workspace/common/enums/user";
import {
  ApiVersionEnum,
  ApiAccessTypeEnum,
} from "@your-workspace/common/enums/api";
import {
  TriStateBooleanEnum,
  HttpStatusCodeEnum,
  ErrorCodeEnum,
} from "@your-workspace/common/enums"; // Giả sử re-export từ common, http, error

import {
  fromMillisToDateTime,
  formatDateTime,
  COMMON_DATE_FORMATS,
} from "@your-workspace/common/utils/date";
import {
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse,
} from "@your-workspace/common/utils/api"; // Import các hàm response formatter
import { isNullOrEmpty } from "@your-workspace/common/utils/validation/string";
import { omit } from "@your-workspace/common/utils/helpers/object";

import type { User } from "@your-workspace/common/types/entities/user";
import type {
  ApiResponse, // Sử dụng ApiResponse thay vì FormattedApiResponse
  PaginatedData,
} from "@your-workspace/common/types/api/response";
import type {
  EditorContent,
  EditorContentChild,
} from "@your-workspace/common/types/editor";
import type { ApiEndpointConfig } from "@your-workspace/common/types/api";

import {
  DEFAULT_PAGE_SIZE,
  MAX_FILE_SIZE_BYTES,
} from "@your-workspace/common/constants/app";

// Sử dụng
const currentTimeMillis = Date.now();
const dateTimeUtc = fromMillisToDateTime(currentTimeMillis); // Mặc định UTC
const dateTimeLocal = fromMillisToDateTime(
  currentTimeMillis,
  "Asia/Ho_Chi_Minh"
);

console.log(formatDateTime(dateTimeUtc, COMMON_DATE_FORMATS.ISO_DATE_TIME));
console.log(
  formatDateTime(dateTimeLocal, COMMON_DATE_FORMATS.DATE_TIME, "vi-VN")
);

const userEntity: User = {
  id: "1",
  email: "user@example.com",
  full_name: "Example User", // Đổi thành snake_case
  role: RoleEnum.USER,
  created_at: dateTimeUtc.toMillis(), // Đổi thành snake_case
  updated_at: dateTimeUtc.toMillis(), // Đổi thành snake_case
};

// Ví dụ tạo response
const userSuccessResponse: ApiResponse<User> = createSuccessResponse(
  userEntity,
  "User retrieved successfully.",
  HttpStatusCodeEnum.OK
);

const usersList = [userEntity];
const paginatedUsersResponse: ApiResponse<PaginatedData<User>> =
  createPaginatedResponse(usersList, 1, 1, 10, "Users list retrieved.");
// Cấu trúc data của paginatedUsersResponse sẽ là:
// data: {
//   total_record: 1,
//   page: 1,
//   limit: 10,
//   list: [
//     {
//       id: "1",
//       email: "user@example.com",
//       full_name: "Example User",
//       role: "USER",
//       created_at: ...,
//       updated_at: ...
//     }
//   ]
// }

const userNotFoundErrorResponse: ApiResponse<null> = createErrorResponse(
  undefined, // Message sẽ lấy từ DEFAULT_ERROR_MESSAGES
  HttpStatusCodeEnum.NOT_FOUND,
  ErrorCodeEnum.USER_NOT_FOUND
);

const editorData: EditorContent = {
  id: "content-1",
  type: "paragraph",
  children: [{ text: "Hello ", bold: true }, { text: "World!" }],
  // ví dụ: created_at: Date.now() nếu cần
};

const userViewConfig: ApiEndpointConfig = {
  endpoint: "/users",
  type: ApiAccessTypeEnum.AUTH,
  requiredRoles: [RoleEnum.SYSTEM_ADMIN],
  requiredPermissions: [PermissionEnum.USER_VIEW],
};

console.log(
  `Default page size: ${DEFAULT_PAGE_SIZE}, Max file size: ${MAX_FILE_SIZE_BYTES} bytes`
);
console.log(`Current API version for new features: ${ApiVersionEnum.V2}`);
console.log(`TriStateBoolean ALL: ${TriStateBooleanEnum.ALL}`);
console.log(
  "User Success Response:",
  JSON.stringify(userSuccessResponse, null, 2)
);
console.log(
  "User Not Found Error:",
  JSON.stringify(userNotFoundErrorResponse, null, 2)
);
console.log(
  "Paginated Users Response:",
  JSON.stringify(paginatedUsersResponse, null, 2) // Để kiểm tra cấu trúc phân trang
);
```

## Quy trình phát triển

### Thêm một utility mới

1. Xác định đúng vị trí (thư mục) cho utility mới.
2. Tạo file mới trong thư mục tương ứng.
3. Viết code với type definitions đầy đủ (sử dụng Luxon cho date/time, và theo phong cách standalone functions).
4. Export từ file `index.ts` của thư mục trực tiếp.
5. Export từ các file `index.ts` của thư mục cha (nếu cần).
6. Export từ root `index.ts` (nếu cần).
7. Viết tests (nếu có).

### Thêm một enum/type/constant mới

1. Xác định đúng vị trí (thư mục) cho định nghĩa mới (ví dụ: `src/enums/feature`, `src/types/feature`, `src/constants/feature`).
2. Tạo file mới hoặc thêm vào file hiện có trong thư mục tương ứng.
3. Định nghĩa enum/type/constant với đầy đủ JSDoc nếu cần, tuân thủ quy ước đặt tên (ví dụ: `MyFeatureEnum`, `MyFeatureType`, `MY_FEATURE_CONSTANT`). Đối với các trường dữ liệu trong Types, sử dụng `snake_case`.
4. Export từ file `index.ts` của thư mục chứa nó.
5. Export từ các file `index.ts` của thư mục cha (nếu cần).
6. Export từ root `index.ts` (nếu cần).

## Versioning và Backward Compatibility

Khi cập nhật package này, cần tuân thủ nguyên tắc semantic versioning:

- **MAJOR version** khi có breaking changes.
- **MINOR version** khi thêm tính năng mới theo cách backward compatible.
- **PATCH version** khi có bug fixes.
