// Server exports
export * from "./server/index.js";

// Client exports
export * from "./client/index.js";

// Generated proto types and services
export * from "./generated/auth.js";

// Utilities
export * from "./utils/index.js";

// Proto definitions
export const PROTO_PATHS = {
  AUTH: "./src/protos/auth.proto",
} as const;

// Common types
export interface GrpcConfig {
  host: string;
  port: number;
}

// Utility functions
export function createServerAddress(host: string, port: number): string {
  return `${host}:${port}`;
}

export function parseServerAddress(address: string): {
  host: string;
  port: number;
} {
  const parts = address.split(":");
  if (parts.length !== 2) {
    throw new Error(`Invalid server address format: ${address}`);
  }

  const host = parts[0]!;
  const portStr = parts[1]!;
  const port = parseInt(portStr, 10);

  if (!host || isNaN(port)) {
    throw new Error(`Invalid server address: ${address}`);
  }

  return { host, port };
}
