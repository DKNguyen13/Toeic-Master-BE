import { reminderQueue } from "../queues/reminder.queue.js";
import { SEVEN_DAYS_IN_MS } from "../utils/constant.js";

export const scheduleReminder = async (userId) => {
  // remove job cũ
  await reminderQueue.removeJobs(`reminder:${userId}`);
  await reminderQueue.removeJobs(`reminder:${userId}:*`);

  // add job mới
  await reminderQueue.add(
    "sendReminder",
    { userId },
    {
      delay: SEVEN_DAYS_IN_MS,
      jobId: `reminder:${userId}`,
      removeOnComplete: true,
      removeOnFail: true,
      attempts: 3,
      backoff: 5000,
    }
  );
};