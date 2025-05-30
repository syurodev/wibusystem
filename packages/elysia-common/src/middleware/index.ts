// Common middleware for Elysia services

import { HTTP_STATUS } from "@repo/common/constants";
import type { ApiResponse } from "@repo/common/types";
import { formatDate, generateId } from "@repo/common/utils";
import { Elysia } from "elysia";
import { createLoggerPlugin, logger } from "../logger/index.js";

// Logger middleware - sử dụng elysia-logger plugin
export const loggerMiddleware = (
  config?: Parameters<typeof createLoggerPlugin>[0]
) => createLoggerPlugin(config);

// Request ID middleware với proper typing
export const requestId = new Elysia({ name: "requestId" })
  .derive(({ headers }) => {
    const requestId = headers["x-request-id"] ?? generateId();
    return { requestId };
  })
  .onBeforeHandle(({ requestId, request }) => {
    // Sử dụng standalone logger cho manual logging
    logger.info("Request started", {
      requestId,
      method: request.method,
      url: request.url,
    });
  })
  .onAfterHandle(({ requestId, request, response }) => {
    logger.info("Request completed", {
      requestId,
      method: request.method,
      url: request.url,
      // Note: response status might not be available in onAfterHandle
    });
  });

// CORS middleware
export const cors = new Elysia({ name: "cors" })
  .onRequest(({ request, set }) => {
    // Handle preflight requests
    if (request.method === "OPTIONS") {
      set.headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, X-Request-ID",
        "Access-Control-Max-Age": "86400",
      } as Record<string, string>;
      set.status = 204;
      return new Response(null, { status: 204 });
    }
  })
  .onAfterHandle(({ set }) => {
    const headers = set.headers ?? {};
    set.headers = {
      ...headers,
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, X-Request-ID",
    } as Record<string, string>;
  });

// Error handling middleware với proper error typing
export const errorHandler = new Elysia({ name: "errorHandler" }).onError(
  ({ error, code, set }) => {
    const timestamp = formatDate();

    // Type guard for Error objects
    const isError = error instanceof Error;
    const errorMessage = isError ? error.message : String(error);
    const errorStack = isError ? error.stack : undefined;

    logger.error("Request error", {
      error: errorMessage,
      code,
      stack: errorStack,
    });

    const response: ApiResponse = {
      success: false,
      error: errorMessage,
      timestamp,
    };

    switch (code) {
      case "VALIDATION":
        set.status = HTTP_STATUS.BAD_REQUEST;
        response.error = "Dữ liệu không hợp lệ";
        break;
      case "NOT_FOUND":
        set.status = HTTP_STATUS.NOT_FOUND;
        response.error = "Không tìm thấy tài nguyên";
        break;
      case "PARSE":
        set.status = HTTP_STATUS.BAD_REQUEST;
        response.error = "Dữ liệu không hợp lệ";
        break;
      case "INTERNAL_SERVER_ERROR":
      default:
        set.status = HTTP_STATUS.INTERNAL_SERVER_ERROR;
        response.error = "Lỗi máy chủ nội bộ";
        break;
    }

    return response;
  }
);

// Response formatter middleware
export const responseFormatter = new Elysia({
  name: "responseFormatter",
}).onAfterHandle(({ response, set }) => {
  // Skip formatting for non-200 responses or already formatted responses
  if (
    (set.status && set.status !== 200) ||
    (response && typeof response === "object" && "success" in response)
  ) {
    return response;
  }

  const formattedResponse: ApiResponse = {
    success: true,
    data: response,
    timestamp: formatDate(),
  };

  return formattedResponse;
});

// JWT Auth middleware (placeholder - to be implemented based on your auth strategy)
export const auth = (options: { optional?: boolean } = {}) =>
  new Elysia({ name: "auth" }).derive(({ headers, set }) => {
    const authorization = headers.authorization;

    if (!authorization && !options.optional) {
      set.status = HTTP_STATUS.UNAUTHORIZED;
      throw new Error("Token không được cung cấp");
    }

    if (authorization) {
      const token = authorization.replace("Bearer ", "");
      // TODO: Implement JWT verification logic here
      // For now, we'll just pass the token
      return {
        token,
        user: null, // Will be populated after JWT verification
      };
    }

    return { token: null, user: null };
  });

// Rate limiting middleware (basic implementation)
export const rateLimit = (options: { max: number; windowMs: number }) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return new Elysia({ name: "rateLimit" }).onRequest(({ request, set }) => {
    const ip =
      request.headers.get("x-forwarded-for") ??
      request.headers.get("x-real-ip") ??
      "unknown";

    const now = Date.now();
    const windowStart = now - options.windowMs;

    // Clean up old entries
    for (const [key, value] of requests.entries()) {
      if (value.resetTime < windowStart) {
        requests.delete(key);
      }
    }

    const current = requests.get(ip) ?? {
      count: 0,
      resetTime: now + options.windowMs,
    };

    if (current.count >= options.max) {
      set.status = 429;
      throw new Error("Quá nhiều requests, vui lòng thử lại sau");
    }

    current.count++;
    requests.set(ip, current);
  });
};

// Health check middleware
export const healthCheck = new Elysia({ name: "healthCheck" })
  .get("/health", () => ({
    status: "ok",
    timestamp: formatDate(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  }))
  .get("/ready", () => ({
    status: "ready",
    timestamp: formatDate(),
  }));
