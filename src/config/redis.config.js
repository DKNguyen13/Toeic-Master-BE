import { createClient } from "redis";
import { config } from "./env.config.js";

/*
    Redis CLI
    Get all key: KEYS *
    Get otp send to email: GET otp:test@gmail.com
*/

let redisClient;
async function connectRedis() {
  try {
    redisClient = createClient({ url: config.redisUrl });

    redisClient.on('error', (err) => {
      console.warn('Redis connection error:', err.message);
    });

    await redisClient.connect();
    console.log('Redis connected');
  } catch (err) {
    console.warn('Redis not connected. Maybe server is not running on', config.redisUrl);
    redisClient = null; // Không kết nối được thì gán null để tránh crash
  }
}

connectRedis();

export default redisClient;
