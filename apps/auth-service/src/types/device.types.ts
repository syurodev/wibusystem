/**
 * Device Authentication Types
 * Shared types cho device auth system
 */

// Request types
export interface DeviceRegistrationRequest {
  device_id: string; // UUID từ client
  device_fingerprint: {
    user_agent: string;
    screen_resolution?: string;
    timezone?: string;
    language?: string;
    platform?: string;
    vendor?: string;
    additional_info?: Record<string, unknown>;
  };
  device_info?: {
    name?: string;
    type?: "mobile" | "desktop" | "tablet" | "unknown";
    os?: string;
    browser?: string;
  };
}

export interface TokenValidationRequest {
  access_token: string;
}

export interface TokenRefreshRequest {
  device_id: string;
  refresh_token?: string;
}

// Response types
export interface DeviceTokenResponse {
  access_token: string;
  expires_at: number;
  permissions: string[];
  device_id: string;
  token_type: "device_token";
  refresh_token?: string;
  expires_in?: number;
  risk_score?: number;
}

export interface TokenValidationResponse {
  device_id: string;
  is_valid: boolean;
  permissions: string[];
  risk_score: number;
  expires_at: Date;
}

export interface DeviceInfoResponse {
  device_id: string;
  device_fingerprint: string;
  device_info: Record<string, unknown>;
  risk_score: number;
  permissions: string[];
  is_blocked: boolean;
  created_at: Date;
  last_used_at: Date | null;
  usage_count: number;
}

// API Response wrappers
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code: string;
  details?: unknown;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// Error codes
export const ErrorCodes = {
  DEVICE_ALREADY_REGISTERED: "DEVICE_ALREADY_REGISTERED",
  INVALID_DEVICE_FINGERPRINT: "INVALID_DEVICE_FINGERPRINT",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  DEVICE_REGISTRATION_FAILED: "DEVICE_REGISTRATION_FAILED",
  DEVICE_NOT_FOUND: "DEVICE_NOT_FOUND",
  DEVICE_BLOCKED: "DEVICE_BLOCKED",
  REFRESH_TOKEN_EXPIRED: "REFRESH_TOKEN_EXPIRED",
  TOKEN_REFRESH_FAILED: "TOKEN_REFRESH_FAILED",
  GET_DEVICE_INFO_FAILED: "GET_DEVICE_INFO_FAILED",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
