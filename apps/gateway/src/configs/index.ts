export const APP_CONFIG = {
  PORT: process.env.SERVICE_PORT ?? 3100,
  AUTH_SERVICE_GRPC_PORT: process.env.AUTH_SERVICE_GRPC_PORT ?? 31001,
};

export const PROXY = {
  AUTH_SERVICE_URL: process.env.CONFIG_AUTH_SERVICE_URL ?? "localhost:3001",
  NOVEL_SERVICE_URL: process.env.CONFIG_NOVEL_SERVICE_URL ?? "localhost:3002",
};
