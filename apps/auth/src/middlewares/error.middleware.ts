/**
 * @file Middleware xử lý lỗi tập trung cho ứng dụng.
 * @author Your Name
 */
// Remove specific JWT error class imports as they are not found
// import {
//   JWTDecodeError,
//   JWTSignRejected,
//   JWTVerifyRejected,
// } from "@elysiajs/jwt";

// You might need to import specific error codes if @elysiajs/jwt exports them,
// e.g., import { ELYSIA_JWT_INVALID_TOKEN, ELYSIA_JWT_EXPIRED } from '@elysiajs/jwt';
// Otherwise, you can use string literals for codes if known.

import { HttpStatusCode, MessageCode } from "@repo/common";
import { Elysia, NotFoundError } from "elysia";

// Define custom error types for auth-service if not already broadly defined
// For instance, if your services throw these custom errors:
// class InvalidOtpError extends Error { constructor(message = "Invalid OTP") { super(message); this.name = "InvalidOtpError"; } }
// class UserAlreadyExistsError extends Error { constructor(message = "User already exists") { super(message); this.name = "UserAlreadyExistsError"; } }
// etc.

/**
 * Middleware xử lý lỗi tập trung cho auth-service
 */
export const errorMiddleware = new Elysia({
  name: "error-handler", // Optional: name for easier debugging or identification
})
  .error({
    // Custom application errors, can be thrown from services/controllers
    UNAUTHORIZED: Error, // General unauthorized access
    FORBIDDEN: Error, // Access denied due to permissions
    INVALID_CREDENTIALS: Error, // Incorrect username/password
    USER_ALREADY_EXISTS: Error, // During registration
    USER_NOT_FOUND: Error, // When trying to operate on a non-existent user
    INVALID_TOKEN: Error, // Generic invalid token (could be format, signature, etc.)
    TOKEN_EXPIRED: Error, // Specifically for expired tokens
    INVALID_OTP: Error, // For OTP verification failures
    // Add other custom error types as needed
  })
  .onError(({ code, error, set, path, request }) => {
    // Log the error with more context
    if (error instanceof Error) {
      console.error(
        `[Error Handler] Path: ${path}, Method: ${request.method}, Code: ${code}, Name: ${error.name}, Message: ${error.message}`,
        error.stack
      );
    } else {
      console.error(
        `[Error Handler] Path: ${path}, Method: ${request.method}, Code: ${code}, Error: `,
        error
      );
    }

    // Cast error to Error type for reliable property access if needed
    const errorAsError = error as Error;

    // Handle JWT errors
    if (errorAsError.name === "JsonWebTokenError") {
      set.status = HttpStatusCode.UNAUTHORIZED;
      return {
        success: false,
        message_code: MessageCode.AUTH_INVALID_TOKEN,
        message: "Token không hợp lệ hoặc đã bị thay đổi.",
        error_detail: errorAsError.message,
      };
    }
    if (errorAsError.name === "TokenExpiredError") {
      set.status = HttpStatusCode.UNAUTHORIZED;
      return {
        success: false,
        message_code: MessageCode.AUTH_TOKEN_EXPIRED,
        message: "Token đã hết hạn.",
        error_detail: errorAsError.message,
      };
    }
    if (errorAsError.name === "NotBeforeError") {
      set.status = HttpStatusCode.UNAUTHORIZED;
      return {
        success: false,
        message_code: MessageCode.AUTH_TOKEN_NOT_YET_VALID,
        message: "Token chưa có hiệu lực.",
        error_detail: errorAsError.message,
      };
    }

    // Handle Elysia's built-in NotFoundError
    if (error instanceof NotFoundError) {
      set.status = HttpStatusCode.NOT_FOUND;
      return {
        success: false,
        message_code: MessageCode.RESOURCE_NOT_FOUND,
        message: "Không tìm thấy tài nguyên được yêu cầu.",
        error_detail: error.message, // error is NotFoundError, which extends Error
      };
    }

    // Handle Elysia's built-in VALIDATION error
    if (code === "VALIDATION") {
      set.status = HttpStatusCode.BAD_REQUEST;
      return {
        success: false,
        message_code: MessageCode.VALIDATION_ERROR,
        message: "Dữ liệu không hợp lệ.",
        error_detail: errorAsError.message, // error.message should be available
      };
    }

    // Handle custom errors defined with .error()
    switch (code) {
      case "UNAUTHORIZED":
        set.status = HttpStatusCode.UNAUTHORIZED;
        return {
          success: false,
          message_code: MessageCode.AUTH_UNAUTHORIZED,
          message: "Không được phép truy cập.",
          error_detail: errorAsError.message,
        };
      case "FORBIDDEN":
        set.status = HttpStatusCode.FORBIDDEN;
        return {
          success: false,
          message_code: MessageCode.AUTH_FORBIDDEN,
          message: "Không có quyền truy cập tài nguyên này.",
          error_detail: errorAsError.message,
        };
      case "INVALID_CREDENTIALS":
        set.status = HttpStatusCode.UNAUTHORIZED;
        return {
          success: false,
          message_code: MessageCode.AUTH_INVALID_CREDENTIALS,
          message: "Thông tin đăng nhập không chính xác.",
          error_detail: errorAsError.message,
        };
      case "USER_ALREADY_EXISTS":
        set.status = HttpStatusCode.CONFLICT;
        return {
          success: false,
          message_code: MessageCode.AUTH_USER_ALREADY_EXISTS,
          message: "Người dùng đã tồn tại.",
          error_detail: errorAsError.message,
        };
      case "USER_NOT_FOUND":
        set.status = HttpStatusCode.NOT_FOUND;
        return {
          success: false,
          message_code: MessageCode.AUTH_USER_NOT_FOUND,
          message: "Không tìm thấy người dùng.",
          error_detail: errorAsError.message,
        };
      case "INVALID_TOKEN":
        set.status = HttpStatusCode.UNAUTHORIZED;
        return {
          success: false,
          message_code: MessageCode.AUTH_INVALID_TOKEN,
          message: "Token không hợp lệ.",
          error_detail: errorAsError.message,
        };
      case "TOKEN_EXPIRED":
        set.status = HttpStatusCode.UNAUTHORIZED;
        return {
          success: false,
          message_code: MessageCode.AUTH_TOKEN_EXPIRED,
          message: "Token đã hết hạn (custom error).",
          error_detail: errorAsError.message,
        };
      case "INVALID_OTP":
        set.status = HttpStatusCode.BAD_REQUEST;
        return {
          success: false,
          message_code: MessageCode.AUTH_INVALID_OTP,
          message: "Mã OTP không hợp lệ hoặc đã hết hạn.",
          error_detail: errorAsError.message,
        };
      default:
        set.status = HttpStatusCode.INTERNAL_SERVER_ERROR;
        return {
          success: false,
          message_code: MessageCode.INTERNAL_SERVER_ERROR,
          message: "Đã có lỗi xảy ra phía máy chủ. Vui lòng thử lại sau.",
          error_detail: "An unexpected error occurred.",
        };
    }
  });

// Optional: Export the type if you want to use it elsewhere, though Elysia handles it internally
// export type ErrorMiddleware = typeof errorMiddleware;
