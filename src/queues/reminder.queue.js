import Queue from "bull";
import { redisConnection } from "../config/ioredis.config.js";

export const reminderQueue = new Queue("reminder-queue", {
  createClient: function (type) {
    switch (type) {
      case "client":
        return redisConnection();
      case "subscriber":
        return redisConnection();
      case "bclient":
        return redisConnection();
      default:
        return redisConnection();
    }
  }
});