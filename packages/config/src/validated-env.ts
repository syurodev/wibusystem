import dotenv from "dotenv";
import path from "path";
import { FullEnvSchema, type FullEnv } from "./schemas";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const parsedEnv = FullEnvSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error(
    "❌ Invalid environment variables:",
    JSON.stringify(parsedEnv.error.flatten().fieldErrors, null, 2)
  );
  // Depending on the environment, you might want to throw an error or exit the process
  // For production, it's generally recommended to exit if config is invalid.
  if (
    process.env.NODE_ENV === "production" ||
    process.env.APP_ENV === "production"
  ) {
    process.exit(1);
  }
  // For development/staging, you might allow it to proceed with defaults or throw a less critical error.
  // However, for consistency and to catch errors early, exiting might still be a good strategy.
  // throw new Error("Invalid environment variables");
}

// We provide a default empty object for validatedEnv if parsing fails and we don't exit.
// This helps prevent runtime errors if the application somehow continues.
// However, the `if (!parsedEnv.success)` block should ideally handle critical failures.
export const validatedEnv: FullEnv = parsedEnv.success
  ? parsedEnv.data
  : ({} as FullEnv);
