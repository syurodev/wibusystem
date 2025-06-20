import { logger as elysiaLogger } from "@bogeychan/elysia-logger";
import { DateFormats, getCurrentVietnamTime } from "@repo/utils";

interface LoggerConfig {
  level?: "debug" | "info" | "warn" | "error" | "fatal" | "trace";
  service?: string;
  environment?: string;
  stream?: any;
  colorize?: boolean;
  prettyPrint?: boolean;
  customColors?: Record<string, string>;
}

// Default color scheme cho các log levels
const DEFAULT_COLORS = {
  0: "blueBright", // trace - xanh dương sáng
  10: "cyan", // debug - xanh ngọc
  20: "green", // info - xanh lá
  30: "yellow", // warn - vàng
  40: "red", // error - đỏ
  50: "magentaBright", // fatal - tím sáng
} as const;

// Create logger plugin for Elysia with custom config
export const createLoggerPlugin = (config: LoggerConfig = {}) => {
  const {
    level = "info",
    service = "elysia-service",
    environment = process.env.NODE_ENV ?? "development",
    stream,
    colorize = true,
    prettyPrint = true,
    customColors,
  } = config;

  const isDev = environment === "development";

  // Merge custom colors với default colors
  const colors = customColors
    ? { ...DEFAULT_COLORS, ...customColors }
    : DEFAULT_COLORS;

  // Cấu hình transport cho development với pino-pretty
  const transport =
    isDev && prettyPrint
      ? {
          target: "pino-pretty",
          options: {
            colorize: colorize,
            translateTime: "HH:MM:ss",
            ignore: "pid,hostname",
            messageFormat: `[${service}] {msg}`,
            customColors: colors,
            levelFirst: true,
            singleLine: false,
            // Thêm các options khác cho pino-pretty
            crlf: false,
            hideObject: false,
            errorLikeObjectKeys: ["err", "error"],
          },
        }
      : undefined;

  return elysiaLogger({
    level,
    transport,
    // Fallback stream nếu không dùng transport
    stream: !transport
      ? (stream ??
        (isDev
          ? {
              write: (msg: string) => console.log(msg.trim()),
            }
          : undefined))
      : undefined,
    // Thêm base configuration cho pino
    name: service,
    timestamp: () =>
      `,"time":"${getCurrentVietnamTime(DateFormats.DD_MM_YYYY_HH_MM)}"`,
  });
};

// Utility logger for standalone usage (không cần Elysia instance)
class AppLogger {
  private readonly serviceName: string;
  private readonly environment: string;
  private readonly colorize: boolean;

  constructor(config: LoggerConfig = {}) {
    this.serviceName = config.service ?? "elysia-service";
    this.environment =
      config.environment ?? process.env.NODE_ENV ?? "development";
    this.colorize = config.colorize ?? true;
  }

  private getColoredLevel(level: string): string {
    if (!this.colorize || this.environment !== "development") {
      return level.toUpperCase();
    }

    // Import colorette dynamically để tránh dependency issues
    try {
      const colorette = require("colorette");
      switch (level.toLowerCase()) {
        case "trace":
          return colorette.blueBright("TRACE");
        case "debug":
          return colorette.cyan("DEBUG");
        case "info":
          return colorette.green("INFO");
        case "warn":
          return colorette.yellow("WARN");
        case "error":
          return colorette.red("ERROR");
        case "fatal":
          return colorette.magentaBright("FATAL");
        default:
          return level.toUpperCase();
      }
    } catch {
      // Fallback nếu colorette không available
      return level.toUpperCase();
    }
  }

  private formatMessage(
    level: string,
    message: string,
    meta?: Record<string, any>
  ): string {
    const timestamp = getCurrentVietnamTime(DateFormats.DD_MM_YYYY_HH_MM);
    const logData = {
      timestamp,
      level: level.toUpperCase(),
      service: this.serviceName,
      environment: this.environment,
      message,
      ...(meta && { meta }),
    };

    if (this.environment === "development") {
      const coloredLevel = this.getColoredLevel(level);
      const time = this.colorize
        ? `\x1b[90m${timestamp}\x1b[0m` // Gray color for timestamp
        : timestamp;
      const serviceName = this.colorize
        ? `\x1b[36m${this.serviceName}\x1b[0m` // Cyan for service name
        : this.serviceName;

      return `${coloredLevel} [${time}] (${serviceName}): ${message}${meta ? ` ${JSON.stringify(meta)}` : ""}`;
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
  // Tạo instance mới nếu có config, hoặc return singleton nếu không có config
  if (config) {
    const defaultConfig: LoggerConfig = {
      service: "elysia-service",
      environment: process.env.NODE_ENV ?? "development",
      colorize: (process.env.NODE_ENV ?? "development") === "development",
      ...config,
    };
    return new AppLogger(defaultConfig);
  }

  // Return singleton cho trường hợp không có config
  if (!loggerInstance) {
    const defaultConfig: LoggerConfig = {
      service: "elysia-service",
      environment: process.env.NODE_ENV ?? "development",
      colorize: (process.env.NODE_ENV ?? "development") === "development",
    };
    loggerInstance = new AppLogger(defaultConfig);
  }
  return loggerInstance;
};

// Export logger instance cho standalone usage với colors enabled
export const logger = createLogger();

// Export types và classes
export { AppLogger };
export type { LoggerConfig };

// Export default colors để user có thể reference
export const DEFAULT_LOG_COLORS = DEFAULT_COLORS;

// Utility function để tạo custom color scheme
export const createColorScheme = (
  overrides: Partial<Record<keyof typeof DEFAULT_COLORS, string>>
) => {
  return { ...DEFAULT_COLORS, ...overrides };
};

// Predefined color schemes
export const COLOR_SCHEMES = {
  // Bright and vibrant colors
  bright: {
    0: "cyanBright", // trace
    10: "blueBright", // debug
    20: "greenBright", // info
    30: "yellowBright", // warn
    40: "redBright", // error
    50: "magentaBright", // fatal
  },

  // Subtle colors
  subtle: {
    0: "gray", // trace
    10: "cyan", // debug
    20: "blue", // info
    30: "yellow", // warn
    40: "red", // error
    50: "magenta", // fatal
  },

  // Monochrome with intensity
  mono: {
    0: "gray", // trace
    10: "white", // debug
    20: "whiteBright", // info
    30: "yellowBright", // warn
    40: "redBright", // error
    50: "red", // fatal
  },

  // Default scheme
  default: DEFAULT_COLORS,
} as const;
