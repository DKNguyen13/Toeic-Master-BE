import { createClient } from "redis";
import { config } from "./env.config.js";

/*
    Redis CLI
    Get all key: KEYS *
    Get otp send to email: GET otp:test@gmail.com
*/
const redisClient = createClient({ url: config.redisUrl });
redisClient.on('error', (err) => console.error('Redis Client Error', err));

async function connectRedis() {
    try {
        await redisClient.connect();
        console.log('Redis connected');
    } catch (err) {
        console.error('Cannot connect to Redis! Check if Redis server is running.', err);
        process.exit(1);
    }
}

connectRedis();

export default redisClient;
