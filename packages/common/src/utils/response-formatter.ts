import { HttpStatusCode } from "../enums";

/**
 * Interface for a standardized API response.
 */
export interface ApiResponse<T = any> {
  success: boolean;
  status_code: HttpStatusCode;
  message: string; // Or use MessageCode enum for i18n
  data?: T;
  error?: {
    code?: string; // Or use MessageCode enum
    details?: any;
  };
  pagination?: {
    total_record: number;
    total_page: number;
  };
}

/**
 * Creates a standardized success response.
 * @param data The data to be returned.
 * @param message An optional success message.
 * @param statusCode HTTP status code, defaults to OK (200).
 * @param pagination Optional pagination data.
 * @returns A standardized API response object.
 */
export function createSuccessResponse<T>(
  data: T,
  message: string = "Success",
  statusCode: HttpStatusCode = HttpStatusCode.OK,
  pagination?: ApiResponse<T>["pagination"]
): ApiResponse<T> {
  return {
    success: true,
    status_code: statusCode,
    message,
    data,
    pagination,
  };
}

/**
 * Creates a standardized error response.
 * @param message An error message.
 * @param statusCode HTTP status code, defaults to INTERNAL_SERVER_ERROR (500).
 * @param errorCode Optional error code (could be from MessageCode enum).
 * @param errorDetails Optional details about the error.
 * @returns A standardized API response object.
 */
export function createErrorResponse(
  message: string,
  statusCode: HttpStatusCode = HttpStatusCode.INTERNAL_SERVER_ERROR,
  errorCode?: string,
  errorDetails?: any
): ApiResponse<null> {
  return {
    success: false,
    status_code: statusCode,
    message,
    error: {
      code: errorCode,
      details: errorDetails,
    },
  };
}
