import { z } from "zod";

const stringToArray = (defaultValue: string[]) =>
  z
    .string()
    .transform((val) => val.split(",").map((s) => s.trim()))
    .or(z.array(z.string()))
    .default(defaultValue);

export const CorsEnvSchema = z.object({
  CORS_ALLOWED_ORIGINS: stringToArray([
    "http://localhost:5173",
    "http://localhost:3001",
  ]),
  CORS_ALLOWED_METHODS: stringToArray([
    "GET",
    "POST",
    "PUT",
    "DELETE",
    "PATCH",
    "OPTIONS",
  ]),
  CORS_ALLOWED_HEADERS: stringToArray([
    "Content-Type",
    "Authorization",
    "X-Requested-With",
  ]),
  CORS_EXPOSED_HEADERS: stringToArray(["Content-Length", "Content-Range"]),
  CORS_MAX_AGE: z.coerce.number().positive().default(86400), // 24 hours
  CORS_ALLOW_CREDENTIALS: z
    .string()
    .transform((val) => val === "true")
    .default("true"),
});

export type CorsEnv = z.infer<typeof CorsEnvSchema>;
