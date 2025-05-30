// Demo usage của @repo/common package

import {
  API_ROUTES,
  AUTH,
  ERROR_CODES,
  HTTP_STATUS,
  PAGINATION,
} from "../src/constants/index.js";

import type {
  ApiResponse,
  AuthTokens,
  PaginationParams,
  User,
} from "../src/types/index.js";

import {
  debounce,
  formatDate,
  generateId,
  isValidEmail,
} from "../src/utils/index.js";

import {
  loginSchema,
  paginationSchema,
  registerSchema,
} from "../src/schemas/index.js";

console.log("=== @repo/common Demo ===\n");

// 1. Constants Demo
console.log("1. Constants:");
console.log("HTTP_STATUS.OK:", HTTP_STATUS.OK);
console.log("API_ROUTES.AUTH.LOGIN:", API_ROUTES.AUTH.LOGIN);
console.log(
  "ERROR_CODES.AUTH.INVALID_CREDENTIALS:",
  ERROR_CODES.AUTH.INVALID_CREDENTIALS
);
console.log("PAGINATION.DEFAULT_LIMIT:", PAGINATION.DEFAULT_LIMIT);
console.log("AUTH.ROLES.ADMIN:", AUTH.ROLES.ADMIN);

// 2. Types Demo
console.log("\n2. Types:");

const user: User = {
  id: generateId(),
  email: "user@example.com",
  username: "john_doe",
  firstName: "John",
  lastName: "Doe",
  role: "user",
  isActive: true,
  emailVerified: true,
  createdAt: formatDate(),
  updatedAt: formatDate(),
};

const tokens: AuthTokens = {
  accessToken: "jwt_access_token",
  refreshToken: "jwt_refresh_token",
  expiresIn: 900,
  tokenType: "Bearer",
};

const apiResponse: ApiResponse<User> = {
  success: true,
  data: user,
  timestamp: formatDate(),
};

const paginationParams: PaginationParams = {
  page: 1,
  limit: 10,
};

console.log("User:", user);
console.log("API Response:", apiResponse);

// 3. Utils Demo
console.log("\n3. Utils:");
console.log("formatDate():", formatDate());
console.log("generateId():", generateId());
console.log(
  "isValidEmail('test@example.com'):",
  isValidEmail("test@example.com")
);
console.log("isValidEmail('invalid-email'):", isValidEmail("invalid-email"));

// Debounce demo
const debouncedLog = debounce((message: string) => {
  console.log("Debounced:", message);
}, 100);

debouncedLog("First call");
debouncedLog("Second call"); // This will be cancelled
setTimeout(() => debouncedLog("Third call"), 50); // This will execute

// 4. Schemas Demo
console.log("\n4. Schemas Validation:");

try {
  const loginData = loginSchema.parse({
    email: "user@example.com",
    password: "password123",
  });
  console.log("✅ Login validation passed:", loginData);
} catch (error) {
  console.log("❌ Login validation failed:", error);
}

try {
  const registerData = registerSchema.parse({
    email: "user@example.com",
    username: "john_doe",
    password: "password123",
    firstName: "John",
    lastName: "Doe",
  });
  console.log("✅ Register validation passed:", registerData);
} catch (error) {
  console.log("❌ Register validation failed:", error);
}

try {
  const invalidLogin = loginSchema.parse({
    email: "invalid-email",
    password: "123", // Too short
  });
  console.log("✅ Invalid login validation passed:", invalidLogin);
} catch (error) {
  console.log(
    "❌ Invalid login validation failed (expected):",
    error.issues?.[0]?.message
  );
}

try {
  const pagination = paginationSchema.parse({
    page: 1,
    limit: 20,
  });
  console.log("✅ Pagination validation passed:", pagination);
} catch (error) {
  console.log("❌ Pagination validation failed:", error);
}

// 5. Modular Imports Demo
console.log("\n5. Modular Imports:");
console.log("You can import specific modules:");
console.log("- import { HTTP_STATUS } from '@repo/common/constants/http'");
console.log("- import type { User } from '@repo/common/types/user'");
console.log("- import { formatDate } from '@repo/common/utils'");
console.log("- import { loginSchema } from '@repo/common/schemas'");

console.log("\n=== Demo Complete ===");
