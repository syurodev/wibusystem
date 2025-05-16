/**
 * Message codes for API responses or internal messaging.
 * TODO: Define actual message codes based on application needs.
 */
export enum MessageCode {
  // Common messages
  SUCCESS = "SUCCESS",
  CREATED = "CREATED",
  UPDATED = "UPDATED",
  DELETED = "DELETED",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",

  // Auth related messages
  AUTH_UNAUTHORIZED = "AUTH_UNAUTHORIZED",
  AUTH_FORBIDDEN = "AUTH_FORBIDDEN",
  AUTH_INVALID_CREDENTIALS = "AUTH_INVALID_CREDENTIALS",
  AUTH_USER_ALREADY_EXISTS = "AUTH_USER_ALREADY_EXISTS",
  AUTH_USER_NOT_FOUND = "AUTH_USER_NOT_FOUND",
  AUTH_INVALID_TOKEN = "AUTH_INVALID_TOKEN",
  AUTH_TOKEN_EXPIRED = "AUTH_TOKEN_EXPIRED",
  AUTH_INVALID_OTP = "AUTH_INVALID_OTP",
  AUTH_REFRESH_TOKEN_INVALID_OR_EXPIRED = "auth_refresh_token_invalid_or_expired",
  AUTH_REFRESH_TOKEN_FAMILY_REUSED = "auth_refresh_token_family_reused",
  AUTH_REFRESH_TOKEN_NOT_FOUND = "auth_refresh_token_not_found",
  AUTH_TOKEN_NOT_YET_VALID = "auth_token_not_yet_valid",

  // User related messages
  // Add specific user-related message codes here, for example:
  // USER_PROFILE_UPDATE_SUCCESS = "USER_PROFILE_UPDATE_SUCCESS",
  // USER_DEACTIVATED = "USER_DEACTIVATED",
}
// Example: USER_NOT_FOUND = 1001,
// Example: INVALID_INPUT = 1002,
