import { createClient, RedisClientType } from 'redis';
import { redisConfig } from '../configs';

/**
 * Tạo Redis client dùng cho toàn bộ service
 * Sử dụng singleton để tránh tạo nhiều kết nối
 */
let redisClient: RedisClientType | undefined;

export function getRedisClient(): RedisClientType {
  if (!redisClient) {
    redisClient = createClient({
      socket: {
        host: redisConfig.host,
        port: Number(redisConfig.port),
      },
      password: redisConfig.password,
      database: redisConfig.dbname ? Number(redisConfig.dbname) : 0,
    });
    redisClient.connect().catch(console.error);
  }
  return redisClient;
}

export default getRedisClient;
