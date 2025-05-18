export const dbUserConfig = {
  host: process.env.CONFIG_POSTGRESQL_USER_HOST,
  port: process.env.CONFIG_POSTGRESQL_USER_PORT,
  username: process.env.CONFIG_POSTGRESQL_USER_USERNAME,
  password: process.env.CONFIG_POSTGRESQL_USER_PASSWORD,
  dbname: process.env.CONFIG_POSTGRESQL_USER_DBNAME,
};

export const redisConfig = {
  host: process.env.CONFIG_REDIS_HOST,
  port: process.env.CONFIG_REDIS_PORT,
  password: process.env.CONFIG_REDIS_PASSWORD,
  dbname: process.env.CONFIG_REDIS_DBNAME,
};

export const jwtConfig = {
  JWT_SECRET_KEY: process.env.JWT_SECRET_KEY,
  JWT_REFRESH_SECRET_KEY: process.env.JWT_REFRESH_SECRET_KEY,
  JWT_ACCESS_TOKEN_EXPIRATION: process.env.JWT_ACCESS_TOKEN_EXPIRATION,
  JWT_REFRESH_TOKEN_EXPIRATION: process.env.JWT_REFRESH_TOKEN_EXPIRATION,
};

export const appConfig = {
  SERVICE_PORT: parseInt(process.env.SERVICE_PORT ?? "3000"),
  GRPC_PORT: parseInt(process.env.GRPC_PORT ?? "50051"),
};
