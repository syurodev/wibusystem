// Configuration management for Elysia services

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  poolSize?: number;
}

interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
}

interface JWTConfig {
  secret: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
  issuer: string;
}

interface ServiceConfig {
  name: string;
  version: string;
  port: number;
  host: string;
  environment: "development" | "production" | "test";
  logLevel: "debug" | "info" | "warn" | "error";
}

interface GrpcServiceConfig {
  host: string;
  port: number;
  protoPath: string;
}

export interface AppConfig {
  service: ServiceConfig;
  database: DatabaseConfig;
  redis: RedisConfig;
  jwt: JWTConfig;
  grpcServices: Record<string, GrpcServiceConfig>;
}

class ConfigManager {
  private readonly config: AppConfig;

  constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  private loadConfig(): AppConfig {
    return {
      service: {
        name: this.getEnv("SERVICE_NAME", "elysia-service"),
        version: this.getEnv("SERVICE_VERSION", "1.0.0"),
        port: this.getEnvAsNumber("PORT", 3000),
        host: this.getEnv("HOST", "0.0.0.0"),
        environment: this.getEnv("NODE_ENV", "development") as any,
        logLevel: this.getEnv("LOG_LEVEL", "info") as any,
      },
      database: {
        host: this.getEnv("DB_HOST", "localhost"),
        port: this.getEnvAsNumber("DB_PORT", 5432),
        database: this.getEnv("DB_NAME", "app"),
        username: this.getEnv("DB_USER", "postgres"),
        password: this.getEnv("DB_PASSWORD", ""),
        ssl: this.getEnvAsBoolean("DB_SSL", false),
        poolSize: this.getEnvAsNumber("DB_POOL_SIZE", 10),
      },
      redis: {
        host: this.getEnv("REDIS_HOST", "localhost"),
        port: this.getEnvAsNumber("REDIS_PORT", 6379),
        password: this.getEnv("REDIS_PASSWORD"),
        db: this.getEnvAsNumber("REDIS_DB", 0),
        keyPrefix: this.getEnv("REDIS_KEY_PREFIX", "app:"),
      },
      jwt: {
        secret: this.getEnv("JWT_SECRET", "your-secret-key"),
        accessTokenExpiresIn: this.getEnv("JWT_ACCESS_EXPIRES_IN", "15m"),
        refreshTokenExpiresIn: this.getEnv("JWT_REFRESH_EXPIRES_IN", "7d"),
        issuer: this.getEnv("JWT_ISSUER", "elysia-app"),
      },
      grpcServices: this.loadGrpcServices(),
    };
  }

  private loadGrpcServices(): Record<string, GrpcServiceConfig> {
    const services: Record<string, GrpcServiceConfig> = {};

    // Parse GRPC_SERVICES environment variable
    // Format: service1:host:port:protoPath,service2:host:port:protoPath
    const grpcServicesEnv = this.getEnv("GRPC_SERVICES", "");

    if (grpcServicesEnv) {
      const serviceConfigs = grpcServicesEnv.split(",");

      for (const serviceConfig of serviceConfigs) {
        const [name, host, port, protoPath] = serviceConfig.split(":");
        if (name && host && port && protoPath) {
          services[name] = {
            host,
            port: parseInt(port, 10),
            protoPath,
          };
        }
      }
    }

    return services;
  }

  private validateConfig(): void {
    const required = ["JWT_SECRET", "DB_PASSWORD"];

    for (const key of required) {
      if (!process.env[key]) {
        throw new Error(`Required environment variable ${key} is not set`);
      }
    }

    // Validate service config
    if (
      !["development", "production", "test"].includes(
        this.config.service.environment
      )
    ) {
      throw new Error("NODE_ENV must be development, production, or test");
    }

    if (
      !["debug", "info", "warn", "error"].includes(this.config.service.logLevel)
    ) {
      throw new Error("LOG_LEVEL must be debug, info, warn, or error");
    }

    // Validate port range
    if (this.config.service.port < 1 || this.config.service.port > 65535) {
      throw new Error("PORT must be between 1 and 65535");
    }
  }

  private getEnv(key: string, defaultValue?: string): string {
    const value = process.env[key];
    if (value === undefined && defaultValue === undefined) {
      throw new Error(`Environment variable ${key} is required`);
    }
    return value ?? defaultValue!;
  }

  private getEnvAsNumber(key: string, defaultValue?: number): number {
    const value = process.env[key];
    if (value === undefined) {
      if (defaultValue === undefined) {
        throw new Error(`Environment variable ${key} is required`);
      }
      return defaultValue;
    }

    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      throw new Error(`Environment variable ${key} must be a number`);
    }

    return parsed;
  }

  private getEnvAsBoolean(key: string, defaultValue?: boolean): boolean {
    const value = process.env[key];
    if (value === undefined) {
      if (defaultValue === undefined) {
        throw new Error(`Environment variable ${key} is required`);
      }
      return defaultValue;
    }

    return value.toLowerCase() === "true";
  }

  get(): AppConfig {
    return this.config;
  }

  getService(): ServiceConfig {
    return this.config.service;
  }

  getDatabase(): DatabaseConfig {
    return this.config.database;
  }

  getRedis(): RedisConfig {
    return this.config.redis;
  }

  getJWT(): JWTConfig {
    return this.config.jwt;
  }

  getGrpcService(name: string): GrpcServiceConfig | undefined {
    return this.config.grpcServices[name];
  }

  isDevelopment(): boolean {
    return this.config.service.environment === "development";
  }

  isProduction(): boolean {
    return this.config.service.environment === "production";
  }

  isTest(): boolean {
    return this.config.service.environment === "test";
  }
}

// Singleton instance
export const config = new ConfigManager();

export type {
  DatabaseConfig,
  GrpcServiceConfig,
  JWTConfig,
  RedisConfig,
  ServiceConfig,
};
