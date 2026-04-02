import cron from 'node-cron';
import User from '../models/user.model.js';
import { reminderQueue } from "../queues/reminder.queue.js";
import { SEVEN_DAYS_IN_MS } from "../utils/constant.js";

/**
 * Initialize reminder scheduler
 * Chạy mỗi ngày lúc 10:00 sáng để check inactive users
 * --- * * * * * --- : phút(0-59), giờ(0-23), ngày trong tháng(1-31), tháng(1-12), thứ(0-7) (0 & 7 = Chủ nhật)
 * Cron expression "0 10 * * *" có nghĩa là chạy vào phút 0 của giờ 10 hàng ngày (tức là 10:00 AM mỗi ngày)
 */
export const initReminderScheduler = () => {
  cron.schedule("0 10 * * *", async () => {
    console.log("[ReminderScheduler] Running daily inactive user check...")

    try {
      const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_IN_MS)

      // Tìm users thỏa mãn:
      // 1. isActive = true
      // 2. lastActivityAt <= 7 ngày trước
      // 3. Chưa được nhắc nhở hoặc được nhắc nhở >= 7 ngày trước
      const inactiveUsers = await User.find({
        isActive: true,
        lastActivityAt: {
          $lte: sevenDaysAgo,
          $exists: true,
          $ne: null,
        },
        $or: [
          { lastRemindedAt: null },
          { lastRemindedAt: { $lte: sevenDaysAgo } },
        ],
      }).lean()

      console.log(
        `[ReminderScheduler] Found ${inactiveUsers.length} inactive users to remind`,
      )

      // Thêm job vào queue cho mỗi user
      for (const user of inactiveUsers) {
        try {
          await reminderQueue.add(
            "sendReminder",
            {
              userId: user._id,
              userEmail: user.email,
              fullname: user.fullname,
            },
            {
              jobId: `reminder:${user._id}:${Date.now()}`,
              removeOnComplete: true,
              removeOnFail: false, // Giữ lại failed jobs để debug
              attempts: 3,
              backoff: {
                type: "exponential",
                delay: 2000,
              },
            },
          )
        } catch (err) {
          console.error(
            `[ReminderScheduler] Error queuing reminder for user ${user._id}:`,
            err.message,
          )
        }
      }
    } catch (err) {
      console.error("[ReminderScheduler] Error:", err)
    }
  })

  console.log('[ReminderScheduler] Reminder scheduler initialized (runs daily at 10:00 AM)');
};