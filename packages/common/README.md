# @repo/common

Shared utilities, types, constants, and validation schemas used across both backend and frontend applications.

## Structure

```
src/
├── constants/          # Application constants
│   ├── http.ts        # HTTP status codes
│   ├── api.ts         # API route constants
│   ├── errors.ts      # Error codes
│   ├── pagination.ts  # Pagination defaults
│   ├── auth.ts        # Authentication constants
│   └── index.ts       # Export all constants
├── types/             # TypeScript type definitions
│   ├── api.ts         # API response types
│   ├── user.ts        # User and auth types
│   ├── pagination.ts  # Pagination types
│   ├── common.ts      # Common utility types
│   └── index.ts       # Export all types
├── utils/             # Utility functions
│   └── index.ts       # Common utilities
├── schemas/           # Zod validation schemas
│   └── index.ts       # Validation schemas
└── index.ts           # Main entry point
```

## Usage

### Constants

```typescript
import { HTTP_STATUS, API_ROUTES, ERROR_CODES } from "@repo/common/constants";

// HTTP status codes
console.log(HTTP_STATUS.OK); // 200

// API routes
console.log(API_ROUTES.AUTH.LOGIN); // "/auth/login"

// Error codes
console.log(ERROR_CODES.AUTH.INVALID_CREDENTIALS); // "INVALID_CREDENTIALS"
```

### Types

```typescript
import type { ApiResponse, User, PaginationParams } from "@repo/common/types";

const response: ApiResponse<User[]> = {
  success: true,
  data: users,
  timestamp: "2024-01-01T00:00:00.000Z",
};
```

### Utilities

```typescript
import { formatDate, generateId, isValidEmail } from "@repo/common/utils";

const now = formatDate(); // "2024-01-01T00:00:00.000Z"
const id = generateId(); // "abc123..."
const valid = isValidEmail("test@example.com"); // true
```

### Validation Schemas

```typescript
import { loginSchema, paginationSchema } from "@repo/common/schemas";

// Validate login data
const loginData = loginSchema.parse({
  email: "user@example.com",
  password: "password123",
});

// Validate pagination params
const params = paginationSchema.parse({
  page: 1,
  limit: 10,
});
```

## Features

- **Zero dependencies** (except Zod for validation)
- **TypeScript-first** with full type safety
- **Modular structure** - import only what you need
- **Consistent API responses** with standardized format
- **Comprehensive validation** with detailed error messages
- **Shared constants** to avoid magic numbers/strings
- **Utility functions** for common operations

## Installation

This package is part of the turborepo workspace and should be installed automatically when you run:

```bash
bun install
```

## Development

To build this package:

```bash
bun run build
```
