import { z } from "zod";

export const LoggingEnvSchema = z.object({
  LOG_LEVEL: z
    .enum(["error", "warn", "info", "http", "verbose", "debug", "silly"])
    .default("info"),
  LOG_PRETTY_PRINT: z
    .string()
    .transform((val) => val === "true")
    .default("false"),
  LOG_SERVICE_NAME: z.string().default("app-service"),
});

export type LoggingEnv = z.infer<typeof LoggingEnvSchema>;
