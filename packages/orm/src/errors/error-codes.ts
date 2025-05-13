/**
 * Enum chứa các mã lỗi cho ORM.
 * Quy ước đặt tên: PREFIX_NOUN_VERB hoặc PREFIX_ERROR_NAME
 * Connection Errors: 1000-1999
 * Query Errors: 2000-2999
 * Model Errors: 3000-3999
 * Generic ORM Error: 9000+
 */
export enum OrmErrorCode {
  // Database connection and query errors
  CONNECTION_ERROR = 1000,
  POOL_NOT_INITIALIZED = 1001,
  QUERY_FAILED = 1002,
  TRANSACTION_ERROR = 1003, // Lỗi liên quan đến giao dịch

  // Model and metadata errors
  MODEL_DEFINITION_ERROR = 2000, // Lỗi chung trong định nghĩa model
  MODEL_NOT_REGISTERED = 2001, // Model chưa được đăng ký
  COLUMN_DEFINITION_ERROR = 2002, // Lỗi trong định nghĩa cột
  INVALID_RELATION_DEFINITION = 2003, // Định nghĩa quan hệ không hợp lệ

  // Data mapping and conversion errors
  DATA_TRANSFORMATION_ERROR = 3000, // Lỗi khi chuyển đổi dữ liệu (to/from DB)
  TYPE_CONVERSION_ERROR = 3001, // Lỗi chuyển đổi kiểu dữ liệu cụ thể
  MODEL_PROPERTY_NOT_FOUND_ERROR = 3002, // Thuộc tính không tồn tại trên model khi map
  MODEL_VALUE_CONVERSION_ERROR = 3003, // Lỗi khi chuyển đổi giá trị của model

  // Query Builder errors
  QUERY_BUILDER_ERROR = 4000, // Lỗi chung của Query Builder
  INVALID_QUERY_SYNTAX = 4001, // Cú pháp truy vấn không hợp lệ
  MISSING_PARAMETER = 4002, // Thiếu tham số cho truy vấn

  // Migration errors
  MIGRATION_ERROR = 5000,

  // General ORM errors
  CONFIGURATION_ERROR = 6000, // Lỗi cấu hình ORM
  VALIDATION_ERROR = 6001, // Lỗi validation (nếu ORM hỗ trợ)
  UNKNOWN_ERROR = 9999, // Lỗi không xác định
}
