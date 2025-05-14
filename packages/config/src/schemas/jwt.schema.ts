import { z } from "zod";

export const JwtEnvSchema = z.object({
  JWT_SECRET_KEY: z
    .string()
    .min(32, "JWT_SECRET_KEY must be at least 32 characters long"),
  JWT_REFRESH_SECRET_KEY: z
    .string()
    .min(32, "JWT_REFRESH_SECRET_KEY must be at least 32 characters long"),
  JWT_ACCESS_TOKEN_EXPIRATION: z.string().default("15m"),
  JWT_REFRESH_TOKEN_EXPIRATION: z.string().default("7d"),
  JWT_ISSUER: z.string().optional(),
  JWT_AUDIENCE: z.string().optional(),
});

export type JwtEnv = z.infer<typeof JwtEnvSchema>;
