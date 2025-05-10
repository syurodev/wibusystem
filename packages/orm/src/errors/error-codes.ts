/**
 * Enum chứa các mã lỗi cho ORM.
 * Quy ước đặt tên: PREFIX_NOUN_VERB hoặc PREFIX_ERROR_NAME
 * Connection Errors: 1000-1999
 * Query Errors: 2000-2999
 * Model Errors: 3000-3999
 * Generic ORM Error: 9000+
 */
export enum OrmErrorCode {
  // Generic ORM Error (ít khi dùng trực tiếp nếu các lỗi cụ thể được throw)
  ORM_ERROR = 9000,

  // Connection Errors
  CONNECTION_ERROR = 1001, // Cho các instance ConnectionError chung
  POOL_NOT_INITIALIZED_ERROR = 1002,

  // Query Errors
  QUERY_FAILED_ERROR = 2001,

  // Model Errors
  MODEL_ERROR = 3000, // Cho các instance ModelError chung
  MODEL_NOT_REGISTERED_ERROR = 3001,
  MODEL_PROPERTY_NOT_FOUND_ERROR = 3002,
  MODEL_VALUE_CONVERSION_ERROR = 3003,
}
