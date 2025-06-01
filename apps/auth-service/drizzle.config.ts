import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { USER_POSTGRES_CONFIG } from "./src/configs/env";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/database/schemas/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: `postgres://${USER_POSTGRES_CONFIG.CONFIG_POSTGRESQL_USER_USERNAME}:${USER_POSTGRES_CONFIG.CONFIG_POSTGRESQL_USER_PASSWORD}@${USER_POSTGRES_CONFIG.CONFIG_POSTGRESQL_USER_HOST}:${USER_POSTGRES_CONFIG.CONFIG_POSTGRESQL_USER_PORT}/${USER_POSTGRES_CONFIG.CONFIG_POSTGRESQL_USER_DBNAME}`,
  },
});
