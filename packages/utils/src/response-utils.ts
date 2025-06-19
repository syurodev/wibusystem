/**
 * Response utilities for standardized API responses
 * @fileoverview Comprehensive response formatting utilities with Vietnamese support
 */

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export enum API_RESPONSE_STATUS {
  SUCCESS = 0,
  ERROR = 1,
}

/**
 * Standard API response structure
 */
export interface ApiResponse<T = any> {
  /** Response status (success/error) */
  status: API_RESPONSE_STATUS;
  /** HTTP status code */
  status_code: number;
  /** Response message */
  message: string;
  /** Response data */
  data?: T;
  /** Error details (for error responses) */
  error?: ApiError;
  /** Additional metadata */
  meta?: ResponseMeta;
  /** Request timestamp */
  timestamp: string;
  /** Request ID for tracking */
  request_id?: string;
}

/**
 * Error details structure
 */
export interface ApiError {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** Detailed error information */
  details?: any;
  /** Field-specific validation errors */
  validation?: ValidationError[];
  /** Stack trace (development only) */
  stack?: string;
}

/**
 * Validation error structure
 */
export interface ValidationError {
  /** Field name */
  field: string;
  /** Error message */
  message: string;
  /** Error code */
  code: string;
  /** Field value that caused the error */
  value?: any;
}

/**
 * Response metadata
 */
export interface ResponseMeta {
  /** Pagination information */
  pagination?: PaginationMeta;
  /** Additional metadata */
  [key: string]: any;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  /** Current page number */
  current_page: number;
  /** Items per page */
  per_page: number;
  /** Total items count */
  total_items: number;
  /** Total pages count */
  total_pages: number;
  /** Has next page */
  has_next: boolean;
  /** Has previous page */
  has_prev: boolean;
  /** Next page number */
  next_page?: number;
  /** Previous page number */
  prev_page?: number;
}

/**
 * Response formatter options
 */
export interface ResponseOptions {
  /** Request ID for tracking */
  request_id?: string;
  /** Use Vietnamese messages */
  vietnamese?: boolean;
  /** Include timestamp */
  include_timestamp?: boolean;
  /** Environment (affects error details) */
  environment?: "development" | "production";
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Default response messages
 */
const DEFAULT_MESSAGES = {
  EN: {
    SUCCESS: "Request successful",
    CREATED: "Resource created successfully",
    UPDATED: "Resource updated successfully",
    DELETED: "Resource deleted successfully",
    NOT_FOUND: "Resource not found",
    VALIDATION_ERROR: "Validation failed",
    INTERNAL_ERROR: "Internal server error",
    UNAUTHORIZED: "Unauthorized access",
    FORBIDDEN: "Access forbidden",
    BAD_REQUEST: "Bad request",
  },
  VI: {
    SUCCESS: "Yêu cầu thành công",
    CREATED: "Tạo mới thành công",
    UPDATED: "Cập nhật thành công",
    DELETED: "Xóa thành công",
    NOT_FOUND: "Không tìm thấy dữ liệu",
    VALIDATION_ERROR: "Dữ liệu không hợp lệ",
    INTERNAL_ERROR: "Lỗi hệ thống",
    UNAUTHORIZED: "Chưa xác thực",
    FORBIDDEN: "Không có quyền truy cập",
    BAD_REQUEST: "Yêu cầu không hợp lệ",
  },
} as const;

/**
 * HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * Error codes
 */
export const ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  BAD_REQUEST: "BAD_REQUEST",
  DUPLICATE_RESOURCE: "DUPLICATE_RESOURCE",
  RESOURCE_CONFLICT: "RESOURCE_CONFLICT",
} as const;

// =============================================================================
// CORE RESPONSE FUNCTIONS
// =============================================================================

/**
 * Create standardized success response
 */
export function createSuccessResponse<T = any>(
  data?: T,
  message?: string,
  statusCode: number = HTTP_STATUS.OK,
  options: ResponseOptions = {}
): ApiResponse<T> {
  const { request_id, vietnamese = false, include_timestamp = true } = options;

  const messages = vietnamese ? DEFAULT_MESSAGES.VI : DEFAULT_MESSAGES.EN;
  const defaultMessage =
    statusCode === HTTP_STATUS.CREATED ? messages.CREATED : messages.SUCCESS;

  const response: ApiResponse<T> = {
    status: API_RESPONSE_STATUS.SUCCESS,
    status_code: statusCode,
    message: message ?? defaultMessage,
    data,
    timestamp: include_timestamp ? new Date().toISOString() : "",
  };

  if (request_id) {
    response.request_id = request_id;
  }

  return response;
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  error: string | ApiError,
  statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  options: ResponseOptions = {}
): ApiResponse<null> {
  const {
    request_id,
    vietnamese = false,
    include_timestamp = true,
    environment = "production",
  } = options;

  let errorDetails: ApiError;

  if (typeof error === "string") {
    errorDetails = {
      code: getErrorCodeByStatus(statusCode),
      message: error || getDefaultErrorMessage(statusCode, vietnamese),
    };
  } else {
    errorDetails = {
      ...error,
      message: error.message || getDefaultErrorMessage(statusCode, vietnamese),
    };
  }

  // Remove stack trace in production
  if (environment === "production" && errorDetails.stack) {
    delete errorDetails.stack;
  }

  const response: ApiResponse<null> = {
    status: API_RESPONSE_STATUS.ERROR,
    status_code: statusCode,
    message: errorDetails.message,
    data: null,
    error: errorDetails,
    timestamp: include_timestamp ? new Date().toISOString() : "",
  };

  if (request_id) {
    response.request_id = request_id;
  }

  return response;
}

// =============================================================================
// SPECIFIC RESPONSE HELPERS
// =============================================================================

/**
 * Create success response with data
 */
export function success<T = any>(
  data: T,
  message?: string,
  options?: ResponseOptions
): ApiResponse<T> {
  return createSuccessResponse(data, message, HTTP_STATUS.OK, options);
}

/**
 * Create created response (201)
 */
export function created<T = any>(
  data: T,
  message?: string,
  options?: ResponseOptions
): ApiResponse<T> {
  return createSuccessResponse(data, message, HTTP_STATUS.CREATED, options);
}

/**
 * Create updated response
 */
export function updated<T = any>(
  data: T,
  message?: string,
  options?: ResponseOptions
): ApiResponse<T> {
  const messages = options?.vietnamese
    ? DEFAULT_MESSAGES.VI
    : DEFAULT_MESSAGES.EN;
  return createSuccessResponse(
    data,
    message ?? messages.UPDATED,
    HTTP_STATUS.OK,
    options
  );
}

/**
 * Create deleted response
 */
export function deleted(
  message?: string,
  options?: ResponseOptions
): ApiResponse<null> {
  const messages = options?.vietnamese
    ? DEFAULT_MESSAGES.VI
    : DEFAULT_MESSAGES.EN;
  return createSuccessResponse(
    null,
    message ?? messages.DELETED,
    HTTP_STATUS.OK,
    options
  );
}

/**
 * Create not found error response
 */
export function notFound(
  message?: string,
  options?: ResponseOptions
): ApiResponse<null> {
  const messages = options?.vietnamese
    ? DEFAULT_MESSAGES.VI
    : DEFAULT_MESSAGES.EN;
  return createErrorResponse(
    {
      code: ERROR_CODES.NOT_FOUND,
      message: message ?? messages.NOT_FOUND,
    },
    HTTP_STATUS.NOT_FOUND,
    options
  );
}

/**
 * Create validation error response
 */
export function validationError(
  validationErrors: ValidationError[],
  message?: string,
  options?: ResponseOptions
): ApiResponse<null> {
  const messages = options?.vietnamese
    ? DEFAULT_MESSAGES.VI
    : DEFAULT_MESSAGES.EN;
  return createErrorResponse(
    {
      code: ERROR_CODES.VALIDATION_ERROR,
      message: message ?? messages.VALIDATION_ERROR,
      validation: validationErrors,
    },
    HTTP_STATUS.UNPROCESSABLE_ENTITY,
    options
  );
}

/**
 * Create unauthorized error response
 */
export function unauthorized(
  message?: string,
  options?: ResponseOptions
): ApiResponse<null> {
  const messages = options?.vietnamese
    ? DEFAULT_MESSAGES.VI
    : DEFAULT_MESSAGES.EN;
  return createErrorResponse(
    {
      code: ERROR_CODES.UNAUTHORIZED,
      message: message ?? messages.UNAUTHORIZED,
    },
    HTTP_STATUS.UNAUTHORIZED,
    options
  );
}

/**
 * Create forbidden error response
 */
export function forbidden(
  message?: string,
  options?: ResponseOptions
): ApiResponse<null> {
  const messages = options?.vietnamese
    ? DEFAULT_MESSAGES.VI
    : DEFAULT_MESSAGES.EN;
  return createErrorResponse(
    {
      code: ERROR_CODES.FORBIDDEN,
      message: message ?? messages.FORBIDDEN,
    },
    HTTP_STATUS.FORBIDDEN,
    options
  );
}

/**
 * Create bad request error response
 */
export function badRequest(
  message?: string,
  options?: ResponseOptions
): ApiResponse<null> {
  const messages = options?.vietnamese
    ? DEFAULT_MESSAGES.VI
    : DEFAULT_MESSAGES.EN;
  return createErrorResponse(
    {
      code: ERROR_CODES.BAD_REQUEST,
      message: message ?? messages.BAD_REQUEST,
    },
    HTTP_STATUS.BAD_REQUEST,
    options
  );
}

/**
 * Create internal server error response
 */
export function internalError(
  message?: string,
  error?: Error,
  options?: ResponseOptions
): ApiResponse<null> {
  const messages = options?.vietnamese
    ? DEFAULT_MESSAGES.VI
    : DEFAULT_MESSAGES.EN;
  return createErrorResponse(
    {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: message ?? messages.INTERNAL_ERROR,
      details: error?.message,
      stack: error?.stack,
    },
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    options
  );
}

// =============================================================================
// PAGINATION HELPERS
// =============================================================================

/**
 * Create paginated response
 */
export function paginated<T = any>(
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
  },
  message?: string,
  options?: ResponseOptions
): ApiResponse<T[]> {
  const { page, limit, total } = pagination;
  const totalPages = Math.ceil(total / limit);

  const paginationMeta: PaginationMeta = {
    current_page: page,
    per_page: limit,
    total_items: total,
    total_pages: totalPages,
    has_next: page < totalPages,
    has_prev: page > 1,
    next_page: page < totalPages ? page + 1 : undefined,
    prev_page: page > 1 ? page - 1 : undefined,
  };

  const response = createSuccessResponse(
    data,
    message,
    HTTP_STATUS.OK,
    options
  );
  response.meta = {
    pagination: paginationMeta,
  };

  return response;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get error code by HTTP status
 */
function getErrorCodeByStatus(statusCode: number): string {
  switch (statusCode) {
    case HTTP_STATUS.BAD_REQUEST:
      return ERROR_CODES.BAD_REQUEST;
    case HTTP_STATUS.UNAUTHORIZED:
      return ERROR_CODES.UNAUTHORIZED;
    case HTTP_STATUS.FORBIDDEN:
      return ERROR_CODES.FORBIDDEN;
    case HTTP_STATUS.NOT_FOUND:
      return ERROR_CODES.NOT_FOUND;
    case HTTP_STATUS.UNPROCESSABLE_ENTITY:
      return ERROR_CODES.VALIDATION_ERROR;
    default:
      return ERROR_CODES.INTERNAL_ERROR;
  }
}

/**
 * Get default error message by status code
 */
function getDefaultErrorMessage(
  statusCode: number,
  vietnamese: boolean
): string {
  const messages = vietnamese ? DEFAULT_MESSAGES.VI : DEFAULT_MESSAGES.EN;

  switch (statusCode) {
    case HTTP_STATUS.BAD_REQUEST:
      return messages.BAD_REQUEST;
    case HTTP_STATUS.UNAUTHORIZED:
      return messages.UNAUTHORIZED;
    case HTTP_STATUS.FORBIDDEN:
      return messages.FORBIDDEN;
    case HTTP_STATUS.NOT_FOUND:
      return messages.NOT_FOUND;
    case HTTP_STATUS.UNPROCESSABLE_ENTITY:
      return messages.VALIDATION_ERROR;
    default:
      return messages.INTERNAL_ERROR;
  }
}

/**
 * Wrap async function with error handling
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options?: ResponseOptions
) {
  return async (...args: T): Promise<ApiResponse<R> | ApiResponse<null>> => {
    try {
      const result = await fn(...args);
      return success(result, undefined, options);
    } catch (error) {
      if (error instanceof Error) {
        return internalError(undefined, error, options);
      }
      return internalError("Unknown error occurred", undefined, options);
    }
  };
}

/**
 * Create validation error from field errors
 */
export function createValidationErrors(
  errors: Record<string, string | string[]>,
  vietnamese: boolean = false
): ValidationError[] {
  const validationErrors: ValidationError[] = [];

  for (const [field, error] of Object.entries(errors)) {
    if (Array.isArray(error)) {
      error.forEach((msg) => {
        validationErrors.push({
          field,
          message: msg,
          code: ERROR_CODES.VALIDATION_ERROR,
        });
      });
    } else {
      validationErrors.push({
        field,
        message: error,
        code: ERROR_CODES.VALIDATION_ERROR,
      });
    }
  }

  return validationErrors;
}
