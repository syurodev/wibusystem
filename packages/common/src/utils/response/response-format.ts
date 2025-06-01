/**
 * Chuẩn hóa format response cho API
 * Đảm bảo tất cả API response có cùng một định dạng nhất quán
 */

import { ERROR_CODES, HTTP_STATUS } from "../../constants";
import { SUCCESS_CODES } from "../../constants/success";
import { COMMON_DATE_FORMATS, formatDateTime, now } from "../date";

// Định nghĩa kiểu dữ liệu cho API response chuẩn
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  messageCode: string;
  data?: T;
  statusCode: number;
  timestamp: string;
  error?: {
    code?: string;
    details?: string;
    field?: string;
  };
}

/**
 * Kiểu dữ liệu cho metadata phân trang
 */
export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Kiểu dữ liệu cho error response
export interface ErrorInfo {
  code?: string;
  details?: string;
  field?: string;
}

/**
 * Tạo response thành công
 * @param data - Dữ liệu trả về
 * @param message - Thông báo (mặc định: "Thành công")
 * @param messageCode - Mã thông báo (mặc định: SUCCESS)
 * @param statusCode - HTTP status code (mặc định: 200)
 * @returns ApiResponse object
 */
export function createSuccessResponse<T>(
  data?: T,
  message: string = "Success",
  messageCode: string = SUCCESS_CODES.SYSTEM.SUCCESS,
  statusCode: number = HTTP_STATUS.OK
): ApiResponse<T> {
  return {
    success: true,
    message,
    messageCode,
    data,
    statusCode,
    timestamp: formatDateTime(now(), COMMON_DATE_FORMATS.DATE_TIME),
  };
}

/**
 * Tạo response lỗi
 * @param message - Thông báo lỗi
 * @param messageCode - Mã thông báo lỗi (mặc định: ERROR)
 * @param statusCode - HTTP status code (mặc định: 400)
 * @param errorInfo - Thông tin chi tiết về lỗi
 * @returns ApiResponse object
 */
export function createErrorResponse(
  message: string = "Error",
  statusCode: number = HTTP_STATUS.BAD_REQUEST,
  messageCode: string = ERROR_CODES.SYSTEM.ERROR,
  errorInfo?: ErrorInfo
): ApiResponse<null> {
  return {
    success: false,
    message,
    messageCode,
    data: null,
    statusCode,
    timestamp: formatDateTime(now(), COMMON_DATE_FORMATS.DATE_TIME),
    error: errorInfo,
  };
}

/**
 * Tạo response cho dữ liệu phân trang
 * @param data - Dữ liệu array
 * @param total - Tổng số bản ghi
 * @param page - Trang hiện tại
 * @param limit - Số bản ghi mỗi trang
 * @param message - Thông báo (mặc định: "Lấy dữ liệu thành công")
 * @returns ApiResponse với metadata phân trang
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  message: string = "Lấy dữ liệu thành công"
): ApiResponse<{
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}> {
  // Validate input parameters
  if (!Array.isArray(data)) {
    throw new Error("Data phải là một array");
  }

  if (total < 0 || page < 1 || limit < 1) {
    throw new Error("Total, page và limit phải là số dương");
  }

  const totalPages = Math.ceil(total / limit);

  return createSuccessResponse(
    {
      items: data,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    },
    message
  );
}

/**
 * Các hàm helper cho các trường hợp thường gặp
 */

// Response cho thao tác tạo mới thành công
export const createCreatedResponse = <T>(
  data?: T,
  message: string = "Tạo mới thành công"
) =>
  createSuccessResponse(
    data,
    message,
    SUCCESS_CODES.SYSTEM.CREATE_SUCCESS,
    201
  );

// Response cho thao tác cập nhật thành công
export const createUpdatedResponse = <T>(
  data?: T,
  message: string = "Cập nhật thành công"
) =>
  createSuccessResponse(
    data,
    message,
    SUCCESS_CODES.SYSTEM.UPDATE_SUCCESS,
    200
  );

// Response cho thao tác xóa thành công
export const createDeletedResponse = (message: string = "Xóa thành công") =>
  createSuccessResponse(
    null,
    message,
    SUCCESS_CODES.SYSTEM.DELETE_SUCCESS,
    200
  );

// Response cho lỗi không tìm thấy
export const createNotFoundResponse = (
  message: string = "Không tìm thấy dữ liệu"
) =>
  createErrorResponse(
    message,
    HTTP_STATUS.NOT_FOUND,
    ERROR_CODES.SYSTEM.NOT_FOUND
  );

// Response cho lỗi xác thực
export const createUnauthorizedResponse = (
  message: string = "Không có quyền truy cập"
) =>
  createErrorResponse(
    message,
    HTTP_STATUS.UNAUTHORIZED,
    ERROR_CODES.SYSTEM.UNAUTHORIZED
  );

// Response cho lỗi validation
export const createValidationErrorResponse = (
  message: string = "Dữ liệu không hợp lệ",
  field?: string,
  details?: string
) =>
  createErrorResponse(
    message,
    HTTP_STATUS.UNPROCESSABLE_ENTITY,
    ERROR_CODES.VALIDATION.INVALID_FORMAT,
    {
      field,
      details,
    }
  );

// Response cho lỗi server
export const createServerErrorResponse = (message: string = "Lỗi server") =>
  createErrorResponse(
    message,
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    ERROR_CODES.SYSTEM.INTERNAL_ERROR
  );
