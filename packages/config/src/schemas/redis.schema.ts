import { z } from "zod";

export const RedisEnvSchema = z.object({
  CONFIG_REDIS_HOST: z.string().default("localhost"),
  CONFIG_REDIS_PORT: z.coerce.number().positive().default(6379),
  CONFIG_REDIS_PASSWORD: z.string().optional(),
  CONFIG_REDIS_DBNAME: z.coerce.number().int().min(0).max(15).default(0), // Redis has 16 databases (0-15)
});

export type RedisEnv = z.infer<typeof RedisEnvSchema>;
