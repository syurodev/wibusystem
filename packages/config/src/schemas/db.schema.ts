import { z } from "zod";

// Schema for User PostgreSQL Instance
const PostgresqlUserEnvSchema = z.object({
  CONFIG_POSTGRESQL_USER_HOST: z.string(),
  CONFIG_POSTGRESQL_USER_PORT: z.coerce.number().positive(),
  CONFIG_POSTGRESQL_USER_USERNAME: z.string(),
  CONFIG_POSTGRESQL_USER_PASSWORD: z.string(),
  CONFIG_POSTGRESQL_USER_DBNAME: z.string(),
});

// Schema for Novel PostgreSQL Instance
const PostgresqlNovelEnvSchema = z.object({
  CONFIG_POSTGRESQL_NOVEL_HOST: z.string(),
  CONFIG_POSTGRESQL_NOVEL_PORT: z.coerce.number().positive(),
  CONFIG_POSTGRESQL_NOVEL_USERNAME: z.string(),
  CONFIG_POSTGRESQL_NOVEL_PASSWORD: z.string(),
  CONFIG_POSTGRESQL_NOVEL_DBNAME: z.string(),
});

// Combined Database Environment Schema
export const DatabaseEnvSchema = PostgresqlUserEnvSchema.merge(
  PostgresqlNovelEnvSchema
).extend({
  // Common DB settings if any, can be added here. For now, we assume SSL mode is not instance-specific.
  // If SSL_MODE needs to be specific per instance, it should be added to individual schemas above.
  DB_SSL_MODE: z
    .enum(["disable", "allow", "prefer", "require", "verify-ca", "verify-full"])
    .default("prefer")
    .optional(),
});

export type DatabaseEnv = z.infer<typeof DatabaseEnvSchema>;

// Specific types for structured config, these are not directly inferred from DatabaseEnvSchema
// but represent the desired structure in the final config object.
export interface PostgresqlConfig {
  host: string;
  port: number;
  username: string;
  password?: string; // Password might be sensitive and not always directly in config objects
  dbname: string;
  sslMode?:
    | "disable"
    | "allow"
    | "prefer"
    | "require"
    | "verify-ca"
    | "verify-full";
}
