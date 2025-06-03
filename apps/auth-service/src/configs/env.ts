/**
 * Environment Configuration cho Auth Service
 * Hỗ trợ development, staging, và production environments
 */

import { logger } from "@repo/elysia-common";

// Validate required environment variables
function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name] || defaultValue;
  if (!value) {
    throw new Error(`Environment variable ${name} is required`);
  }
  return value;
}

function getEnvNumber(name: string, defaultValue: number): number {
  const value = process.env[name];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a valid number`);
  }
  return parsed;
}

function getEnvBoolean(name: string, defaultValue: boolean): boolean {
  const value = process.env[name];
  if (!value) return defaultValue;
  return value.toLowerCase() === "true";
}

// App Configuration
export const APP_CONFIG = {
  NODE_ENV: getEnvVar("NODE_ENV", "development") as
    | "development"
    | "staging"
    | "production",
  SERVICE_NAME: getEnvVar("SERVICE_NAME", "wibus-auth-service"),
  SERVICE_VERSION: getEnvVar("SERVICE_VERSION", "1.0.0"),
  SERVICE_PORT: getEnvNumber("SERVICE_PORT", 3001),

  // Security
  DEVICE_TOKEN_SECRET: getEnvVar(
    "DEVICE_TOKEN_SECRET",
    "dev-secret-change-in-production"
  ),
  JWT_SECRET: getEnvVar("JWT_SECRET", "dev-jwt-secret-change-in-production"),
  ENCRYPTION_KEY: getEnvVar(
    "ENCRYPTION_KEY",
    "dev-encryption-key-change-in-production"
  ),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: getEnvNumber("RATE_LIMIT_WINDOW_MS", 60000),
  RATE_LIMIT_MAX_REQUESTS: getEnvNumber("RATE_LIMIT_MAX_REQUESTS", 100),
  RATE_LIMIT_DEVICE_REGISTRATION: getEnvNumber(
    "RATE_LIMIT_DEVICE_REGISTRATION",
    10
  ),

  // Device Security
  MAX_DEVICES_PER_FINGERPRINT: getEnvNumber("MAX_DEVICES_PER_FINGERPRINT", 3),
  HIGH_RISK_THRESHOLD: getEnvNumber("HIGH_RISK_THRESHOLD", 80),
  TOKEN_EXPIRY_HOURS: getEnvNumber("TOKEN_EXPIRY_HOURS", 24),
  REFRESH_TOKEN_EXPIRY_DAYS: getEnvNumber("REFRESH_TOKEN_EXPIRY_DAYS", 7),

  // Monitoring
  LOG_LEVEL: getEnvVar("LOG_LEVEL", "debug") as
    | "debug"
    | "info"
    | "warn"
    | "error",
  ENABLE_METRICS: getEnvBoolean("ENABLE_METRICS", true),
  METRICS_PORT: getEnvNumber("METRICS_PORT", 9090),

  // External Services
  REDIS_URL: process.env.REDIS_URL,
  GEOLOCATION_API_KEY: process.env.GEOLOCATION_API_KEY,

  // Performance & Security (CORS handled by gateway)
  MAX_CONCURRENT_CONNECTIONS: getEnvNumber("MAX_CONCURRENT_CONNECTIONS", 1000),
  REQUEST_TIMEOUT_MS: getEnvNumber("REQUEST_TIMEOUT_MS", 30000),
  KEEP_ALIVE_TIMEOUT_MS: getEnvNumber("KEEP_ALIVE_TIMEOUT_MS", 5000),

  // Cleanup
  CLEANUP_INTERVAL_MINUTES: getEnvNumber("CLEANUP_INTERVAL_MINUTES", 60),
  CLEANUP_EXPIRED_TOKENS: getEnvBoolean("CLEANUP_EXPIRED_TOKENS", true),
  CLEANUP_BLOCKED_DEVICES_DAYS: getEnvNumber(
    "CLEANUP_BLOCKED_DEVICES_DAYS",
    30
  ),
} as const;

// Database Configuration
export const USER_POSTGRES_CONFIG = {
  CONFIG_POSTGRESQL_USER_HOST: getEnvVar(
    "CONFIG_POSTGRESQL_USER_HOST",
    "localhost"
  ),
  CONFIG_POSTGRESQL_USER_PORT: getEnvNumber(
    "CONFIG_POSTGRESQL_USER_PORT",
    5432
  ),
  CONFIG_POSTGRESQL_USER_DBNAME: getEnvVar(
    "CONFIG_POSTGRESQL_USER_DBNAME",
    "wibus_auth"
  ),
  CONFIG_POSTGRESQL_USER_USERNAME: getEnvVar(
    "CONFIG_POSTGRESQL_USER_USERNAME",
    "postgres"
  ),
  CONFIG_POSTGRESQL_USER_PASSWORD: getEnvVar(
    "CONFIG_POSTGRESQL_USER_PASSWORD",
    "password"
  ),
} as const;

// Validation for production
if (APP_CONFIG.NODE_ENV === "production") {
  const productionChecks = [
    {
      key: "DEVICE_TOKEN_SECRET",
      value: APP_CONFIG.DEVICE_TOKEN_SECRET,
      defaultCheck: "dev-secret",
    },
    {
      key: "JWT_SECRET",
      value: APP_CONFIG.JWT_SECRET,
      defaultCheck: "dev-jwt-secret",
    },
    {
      key: "ENCRYPTION_KEY",
      value: APP_CONFIG.ENCRYPTION_KEY,
      defaultCheck: "dev-encryption",
    },
  ];

  productionChecks.forEach(({ key, value, defaultCheck }) => {
    if (value.includes(defaultCheck)) {
      throw new Error(
        `🚨 PRODUCTION ERROR: ${key} is using default development value. Please set a secure production secret!`
      );
    }
  });

  console.log("✅ Production environment validation passed");
}

// Development warnings
if (APP_CONFIG.NODE_ENV === "development") {
  logger.info("🔧 Running in development mode");
  if (APP_CONFIG.DEVICE_TOKEN_SECRET.includes("dev-secret")) {
    logger.info("⚠️  Using development secrets - not suitable for production");
  }
}

// Export computed values
export const COMPUTED_CONFIG = {
  IS_DEVELOPMENT: APP_CONFIG.NODE_ENV === "development",
  IS_PRODUCTION: APP_CONFIG.NODE_ENV === "production",
  IS_STAGING: APP_CONFIG.NODE_ENV === "staging",

  TOKEN_EXPIRY_MS: APP_CONFIG.TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
  REFRESH_TOKEN_EXPIRY_MS:
    APP_CONFIG.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  CLEANUP_INTERVAL_MS: APP_CONFIG.CLEANUP_INTERVAL_MINUTES * 60 * 1000,

  DATABASE_URL: `postgres://${USER_POSTGRES_CONFIG.CONFIG_POSTGRESQL_USER_USERNAME}:${USER_POSTGRES_CONFIG.CONFIG_POSTGRESQL_USER_PASSWORD}@${USER_POSTGRES_CONFIG.CONFIG_POSTGRESQL_USER_HOST}:${USER_POSTGRES_CONFIG.CONFIG_POSTGRESQL_USER_PORT}/${USER_POSTGRES_CONFIG.CONFIG_POSTGRESQL_USER_DBNAME}`,
} as const;

// Log configuration summary
logger.info("📋 Auth Service Configuration:");
logger.info(`   Environment: ${APP_CONFIG.NODE_ENV}`);
logger.info(
  `   Service: ${APP_CONFIG.SERVICE_NAME} v${APP_CONFIG.SERVICE_VERSION}`
);
logger.info(`   Port: ${APP_CONFIG.SERVICE_PORT}`);
logger.info(
  `   Database: ${USER_POSTGRES_CONFIG.CONFIG_POSTGRESQL_USER_HOST}:${USER_POSTGRES_CONFIG.CONFIG_POSTGRESQL_USER_PORT}/${USER_POSTGRES_CONFIG.CONFIG_POSTGRESQL_USER_DBNAME}`
);
logger.info(`   Log Level: ${APP_CONFIG.LOG_LEVEL}`);
logger.info(
  `   Metrics: ${APP_CONFIG.ENABLE_METRICS ? "Enabled" : "Disabled"}`
);

export type AppConfig = typeof APP_CONFIG;
export type DatabaseConfig = typeof USER_POSTGRES_CONFIG;
