/**
 * Message codes for API responses or internal messaging.
 */
export enum MessageCode {
  // Common messages
  SUCCESS = 1000,
  CREATED = 1001,
  UPDATED = 1002,
  DELETED = 1003,
  VALIDATION_ERROR = 1004,
  RESOURCE_NOT_FOUND = 1005,
  INTERNAL_SERVER_ERROR = 1006,

  // Auth related messages
  AUTH_UNAUTHORIZED = 2000,
  AUTH_FORBIDDEN = 2001,
  AUTH_INVALID_CREDENTIALS = 2002,
  AUTH_USER_ALREADY_EXISTS = 2003,
  AUTH_USER_NOT_FOUND = 2004,
  AUTH_INVALID_TOKEN = 2005,
  AUTH_TOKEN_EXPIRED = 2006,
  AUTH_INVALID_OTP = 2007,
  AUTH_REFRESH_TOKEN_INVALID_OR_EXPIRED = 2008,
  AUTH_REFRESH_TOKEN_FAMILY_REUSED = 2009,
  AUTH_REFRESH_TOKEN_NOT_FOUND = 2010,
  AUTH_TOKEN_NOT_YET_VALID = 2011,
  EMAIL_EXISTS = 2012,
  USER_NOT_FOUND = 2013, // Thêm cho lỗi đăng nhập
  INVALID_PASSWORD = 2014, // Thêm cho lỗi đăng nhập
  AUTHENTICATION_FAILED = 2015, // Thêm cho lỗi đăng nhập chung

  // User related messages
  // Add specific user-related message codes here, for example:
  // USER_PROFILE_UPDATE_SUCCESS = 3000,
  // USER_DEACTIVATED = 3001,
}
// Example: USER_NOT_FOUND = 1001,
// Example: INVALID_INPUT = 1002,
