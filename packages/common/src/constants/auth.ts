// Authentication and JWT constants

export const JWT = {
  ACCESS_TOKEN_EXPIRES_IN: "15m",
  REFRESH_TOKEN_EXPIRES_IN: "7d",
  ALGORITHM: "HS256",
  ISSUER: "elysia-app",
} as const;

export const AUTH = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  TOKEN_TYPES: {
    ACCESS: "access",
    REFRESH: "refresh",
  },
  ROLES: {
    USER: "user",
    ADMIN: "admin",
    MODERATOR: "moderator",
  },
} as const;
