// Logger system for Elysia backend services using elysia-logger

import { logger as elysiaLogger } from "@bogeychan/elysia-logger";

interface LoggerConfig {
  level?: "debug" | "info" | "warn" | "error" | "fatal" | "trace";
  service?: string;
  environment?: string;
  stream?: any;
}

// Create logger plugin for Elysia with custom config
export const createLoggerPlugin = (config: LoggerConfig = {}) => {
  const {
    level = "info",
    service = "elysia-service",
    environment = process.env.NODE_ENV ?? "development",
    stream,
  } = config;

  const isDev = environment === "development";

  return elysiaLogger({
    level,
    stream:
      stream ??
      (isDev
        ? {
            write: (msg: string) => console.log(msg.trim()),
          }
        : undefined),
  });
};

// Utility logger for standalone usage (không cần Elysia instance)
class AppLogger {
  private readonly serviceName: string;
  private readonly environment: string;

  constructor(config: LoggerConfig = {}) {
    this.serviceName = config.service ?? "elysia-service";
    this.environment =
      config.environment ?? process.env.NODE_ENV ?? "development";
  }

  private formatMessage(
    level: string,
    message: string,
    meta?: Record<string, any>
  ): string {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level: level.toUpperCase(),
      service: this.serviceName,
      environment: this.environment,
      message,
      ...(meta && { meta }),
    };

    if (this.environment === "development") {
      return `[${timestamp}] ${level.toUpperCase()} (${this.serviceName}): ${message}${meta ? ` ${JSON.stringify(meta)}` : ""}`;
    }

    return JSON.stringify(logData);
  }

  info(message: string, meta?: Record<string, any>): void {
    console.log(this.formatMessage("info", message, meta));
  }

  error(message: string, error?: Error | Record<string, any>): void {
    let errorMeta: Record<string, any> = {};

    if (error instanceof Error) {
      errorMeta = {
        error: error.message,
        stack: error.stack,
        name: error.name,
      };
    } else if (error) {
      errorMeta = error;
    }

    console.error(this.formatMessage("error", message, errorMeta));
  }

  warn(message: string, meta?: Record<string, any>): void {
    console.warn(this.formatMessage("warn", message, meta));
  }

  debug(message: string, meta?: Record<string, any>): void {
    if (this.environment === "development") {
      console.debug(this.formatMessage("debug", message, meta));
    }
  }

  child(bindings: Record<string, any>): AppLogger {
    const childLogger = new AppLogger({
      service: this.serviceName,
      environment: this.environment,
    });

    // Override methods to include bindings
    const originalInfo = childLogger.info.bind(childLogger);
    const originalError = childLogger.error.bind(childLogger);
    const originalWarn = childLogger.warn.bind(childLogger);
    const originalDebug = childLogger.debug.bind(childLogger);

    childLogger.info = (message: string, meta?: Record<string, any>) => {
      originalInfo(message, { ...bindings, ...meta });
    };

    childLogger.error = (
      message: string,
      error?: Error | Record<string, any>
    ) => {
      if (error instanceof Error) {
        originalError(message, error);
      } else {
        originalError(message, { ...bindings, ...error });
      }
    };

    childLogger.warn = (message: string, meta?: Record<string, any>) => {
      originalWarn(message, { ...bindings, ...meta });
    };

    childLogger.debug = (message: string, meta?: Record<string, any>) => {
      originalDebug(message, { ...bindings, ...meta });
    };

    return childLogger;
  }

  // Method để tạo request logger với trace ID
  request(requestId: string, method: string, url: string): AppLogger {
    return this.child({
      requestId,
      method,
      url,
      type: "request",
    });
  }

  // Method để log database operations
  database(operation: string, table?: string): AppLogger {
    return this.child({
      operation,
      table,
      type: "database",
    });
  }

  // Method để log GRPC operations
  grpc(service: string, method: string): AppLogger {
    return this.child({
      grpcService: service,
      grpcMethod: method,
      type: "grpc",
    });
  }
}

// Singleton instance cho standalone usage
let loggerInstance: AppLogger;

export const createLogger = (config?: LoggerConfig): AppLogger => {
  if (!loggerInstance) {
    loggerInstance = new AppLogger(config);
  }
  return loggerInstance;
};

// Export logger instance cho standalone usage
export const logger = createLogger();

// Export types và classes
export { AppLogger };
export type { LoggerConfig };
