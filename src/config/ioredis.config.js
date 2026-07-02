import IORedis from "ioredis";
import { config } from "./env.config.js";

export const redisConnection = () => {
  return new IORedis({
    host: config.redisCloudHost,
    port: config.redisCloudPort,
    password: config.redisCloudPassword,
    enableReadyCheck: false,
    maxRetriesPerRequest: null, // Vô hạn retries
  })
};