import type {
  AppEnv,
  CorsEnv,
  DatabaseEnv, // Ensure this is imported for the export line
  FullEnv,
  GrpcEnv,
  JwtEnv,
  LoggingEnv,
  PostgresqlConfig, // Import the new interface
  RedisEnv,
} from "./schemas";
import { validatedEnv } from "./validated-env";

const {
  APP_NAME,
  APP_ENV,
  APP_PORT,
  APP_HOST,

  // User DB Vars
  CONFIG_POSTGRESQL_USER_HOST,
  CONFIG_POSTGRESQL_USER_PORT,
  CONFIG_POSTGRESQL_USER_USERNAME,
  CONFIG_POSTGRESQL_USER_PASSWORD,
  CONFIG_POSTGRESQL_USER_DBNAME,

  // Novel DB Vars
  CONFIG_POSTGRESQL_NOVEL_HOST,
  CONFIG_POSTGRESQL_NOVEL_PORT,
  CONFIG_POSTGRESQL_NOVEL_USERNAME,
  CONFIG_POSTGRESQL_NOVEL_PASSWORD,
  CONFIG_POSTGRESQL_NOVEL_DBNAME,
  DB_SSL_MODE, // Common SSL mode if defined

  CORS_ALLOWED_ORIGINS,
  CORS_ALLOWED_METHODS,
  CORS_ALLOWED_HEADERS,
  CORS_EXPOSED_HEADERS,
  CORS_MAX_AGE,
  CORS_ALLOW_CREDENTIALS,
  JWT_SECRET_KEY,
  JWT_REFRESH_SECRET_KEY,
  JWT_ACCESS_TOKEN_EXPIRATION,
  JWT_REFRESH_TOKEN_EXPIRATION,
  JWT_ISSUER,
  JWT_AUDIENCE,
  LOG_LEVEL,
  LOG_PRETTY_PRINT,
  LOG_SERVICE_NAME,

  // Redis Vars
  CONFIG_REDIS_HOST,
  CONFIG_REDIS_PORT,
  CONFIG_REDIS_PASSWORD,
  CONFIG_REDIS_DBNAME,

  GRPC_SERVER_HOST,
  GRPC_SERVER_PORT,
  ...otherGrpcUrls
} = validatedEnv as FullEnv; // Cast to FullEnv which includes all new validated vars

const grpcClientUrls: Record<string, string> = {};
for (const key in otherGrpcUrls) {
  if (key.startsWith("GRPC_") && key.endsWith("_URL")) {
    const serviceName = key
      .replace("GRPC_", "")
      .replace("_URL", "")
      .toLowerCase();
    if (otherGrpcUrls[key]) {
      grpcClientUrls[serviceName] = otherGrpcUrls[key];
    }
  }
}

export const config = {
  app: {
    name: APP_NAME,
    env: APP_ENV,
    port: APP_PORT,
    host: APP_HOST,
  },
  db: {
    user: {
      host: CONFIG_POSTGRESQL_USER_HOST,
      port: CONFIG_POSTGRESQL_USER_PORT,
      username: CONFIG_POSTGRESQL_USER_USERNAME,
      password: CONFIG_POSTGRESQL_USER_PASSWORD,
      dbname: CONFIG_POSTGRESQL_USER_DBNAME,
      sslMode: DB_SSL_MODE, // Apply common SSL mode, or make it specific if needed
    } as PostgresqlConfig,
    novel: {
      host: CONFIG_POSTGRESQL_NOVEL_HOST,
      port: CONFIG_POSTGRESQL_NOVEL_PORT,
      username: CONFIG_POSTGRESQL_NOVEL_USERNAME,
      password: CONFIG_POSTGRESQL_NOVEL_PASSWORD,
      dbname: CONFIG_POSTGRESQL_NOVEL_DBNAME,
      sslMode: DB_SSL_MODE, // Apply common SSL mode, or make it specific if needed
    } as PostgresqlConfig,
  },
  cors: {
    allowedOrigins: CORS_ALLOWED_ORIGINS,
    allowedMethods: CORS_ALLOWED_METHODS,
    allowedHeaders: CORS_ALLOWED_HEADERS,
    exposedHeaders: CORS_EXPOSED_HEADERS,
    maxAge: CORS_MAX_AGE,
    allowCredentials: CORS_ALLOW_CREDENTIALS,
  },
  jwt: {
    secretKey: JWT_SECRET_KEY,
    refreshSecretKey: JWT_REFRESH_SECRET_KEY,
    accessTokenExpiration: JWT_ACCESS_TOKEN_EXPIRATION,
    refreshTokenExpiration: JWT_REFRESH_TOKEN_EXPIRATION,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  },
  log: {
    level: LOG_LEVEL,
    prettyPrint: LOG_PRETTY_PRINT,
    serviceName: LOG_SERVICE_NAME,
  },
  redis: {
    host: CONFIG_REDIS_HOST,
    port: CONFIG_REDIS_PORT,
    password: CONFIG_REDIS_PASSWORD,
    dbname: CONFIG_REDIS_DBNAME, // Changed from 'db' to 'dbname' to match env var
  },
  grpc: {
    server: {
      host: GRPC_SERVER_HOST,
      port: GRPC_SERVER_PORT,
    },
    clients: grpcClientUrls,
  },
  isDevelopment: APP_ENV === "development",
  isProduction: APP_ENV === "production",
  isStaging: APP_ENV === "staging",
  raw: validatedEnv,
};

// Export the structured config types, and also the raw Zod-inferred types if needed elsewhere
export type {
  AppEnv,
  CorsEnv, // Represents all validated flat env vars
  DatabaseEnv,
  FullEnv, // Represents all validated flat DB env vars from Zod schema
  GrpcEnv,
  JwtEnv,
  LoggingEnv,
  PostgresqlConfig, // This is the interface for structured DB parts
  RedisEnv,
};

// It might be useful to also export a more structured DB config type if consuming code expects it
export interface StructuredDbConfig {
  user: PostgresqlConfig;
  novel: PostgresqlConfig;
}
