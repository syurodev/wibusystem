export const SERVICE_CONFIG = {
  SERVICE_NAME: "gateway",
  SERVICE_PORT: process.env.SERVICE_PORT ?? 3100,
  SERVICE_GRPC_PORT: process.env.SERVICE_GRPC_PORT ?? 31000,

  // Service mapping cho reverse proxy
  SERVICES: {
    "3101": {
      name: "auth-service",
      host: process.env.AUTH_SERVICE_HOST ?? "localhost",
      port: process.env.AUTH_SERVICE_PORT ?? 3101,
    },
    "3102": {
      name: "novel-service",
      host: process.env.NOVEL_SERVICE_HOST ?? "localhost",
      port: process.env.NOVEL_SERVICE_PORT ?? 3102,
    },
  } as Record<string, { name: string; host: string; port: string | number }>,
};
