import { Redis } from "@upstash/redis";
import { config } from "./env.config.js";

const redisClient = new Redis({
  url: config.redisUrl,
  token: config.redisToken,
});

export default redisClient;