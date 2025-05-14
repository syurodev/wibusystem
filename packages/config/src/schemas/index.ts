import { z } from "zod";
import { AppEnvSchema } from "./app.schema";
import { CorsEnvSchema } from "./cors.schema";
import { DatabaseEnvSchema } from "./db.schema";
import { GrpcEnvSchema } from "./grpc.schema";
import { JwtEnvSchema } from "./jwt.schema";
import { LoggingEnvSchema } from "./logging.schema";
import { RedisEnvSchema } from "./redis.schema";

export const FullEnvSchema = AppEnvSchema.merge(DatabaseEnvSchema)
  .merge(CorsEnvSchema)
  .merge(JwtEnvSchema)
  .merge(LoggingEnvSchema)
  .merge(RedisEnvSchema)
  .merge(GrpcEnvSchema); // GrpcEnvSchema should be last if it uses .catchall()

export type FullEnv = z.infer<typeof FullEnvSchema>;

export type { AppEnv } from "./app.schema";
export type { CorsEnv } from "./cors.schema";
export type { DatabaseEnv, PostgresqlConfig } from "./db.schema";
export type { GrpcEnv } from "./grpc.schema";
export type { JwtEnv } from "./jwt.schema";
export type { LoggingEnv } from "./logging.schema";
export type { RedisEnv } from "./redis.schema";
