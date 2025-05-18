import { dbUserConfig } from "./src/configs";

export default {
  schema: "./src/database/schema/**/*.schema.ts",
  out: "./src/database/migrations",
  dialect: "postgresql",
  dbCredentials: {
    host: dbUserConfig.host,
    port: Number(dbUserConfig.port), // Đảm bảo port là number
    user: dbUserConfig.username,
    password: dbUserConfig.password, // password có thể là undefined nếu optional
    database: dbUserConfig.dbname,
    ssl: false,
  },
  verbose: true,
  strict: true,
};
