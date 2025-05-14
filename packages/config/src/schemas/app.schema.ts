import { z } from "zod";

export const AppEnvSchema = z.object({
  APP_NAME: z.string().default("MyNovelApp"),
  APP_ENV: z
    .enum(["development", "staging", "production"])
    .default("development"),
  APP_PORT: z.coerce.number().positive().default(3000),
  APP_HOST: z.string().ip({ version: "v4" }).default("0.0.0.0"),
});

export type AppEnv = z.infer<typeof AppEnvSchema>;
