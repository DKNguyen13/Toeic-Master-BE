import { reminderQueue } from "../queues/reminder.queue.js";
import User from "../models/user.model.js";
import { sendReminderEmail } from "../services/mail.service.js";
import { SEVEN_DAYS_IN_MS } from "../utils/constant.js";
import connectDB from '../config/db.config.js';

await connectDB();

/**
 * Process reminder jobs
 * - Kiểm tra lại user active hay không
 * - Gửi email reminder
 * - Cập nhật lastRemindedAt
 */
reminderQueue.process('sendReminder', 5, async (job) => {
  try {
    const { userId, userEmail, fullname } = job.data;

    // Fetch user từ DB để check trạng thái hiện tại
    const user = await User.findById(userId).lean();

    if (!user) {
      console.log(`[ReminderWorker] User ${userId} not found`);
      return { status: 'user_not_found' };
    }

    if (!user.isActive) {
      console.log(`[ReminderWorker] User ${userId} is not active`);
      return { status: 'user_inactive' };
    }

    // Double-check: Kiểm tra lại xem user có thực sự inactive không
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - SEVEN_DAYS_IN_MS);

    if (user.lastActivityAt && new Date(user.lastActivityAt) > sevenDaysAgo) {
      console.log(`[ReminderWorker] User ${userEmail} is still active (lastActivityAt: ${user.lastActivityAt})`);
      return { status: 'user_active' };
    }

    // Kiểm tra xem đã gửi email trong 7 ngày gần đây chưa
    if (user.lastRemindedAt && (now - new Date(user.lastRemindedAt)) < SEVEN_DAYS_IN_MS) {
      console.log(`[ReminderWorker] User ${userEmail} was reminded recently (lastRemindedAt: ${user.lastRemindedAt})`);
      return { status: 'already_reminded' };
    }

    // Gửi email
    await sendReminderEmail(userEmail || user.email, fullname || user.fullname);
    console.log(`[ReminderWorker] Reminder email sent to ${userEmail || user.email}`);

    // Cập nhật lastRemindedAt
    await User.findByIdAndUpdate(
      userId,
      { lastRemindedAt: now },
      { new: false }
    );

    return { status: 'email_sent', user: userEmail };
  } catch (err) {
    console.error(`[ReminderWorker] Job failed:`, err.message);
    throw err; // Bull sẽ retry dựa trên config attempts
  }
});

/**
 * Event listeners
 */
reminderQueue.on('completed', (job) => {
  console.log(`[ReminderQueue] Job completed - ID: ${job.id}, Result:`, job.returnvalue);
});

reminderQueue.on('failed', (job, err) => {
  console.error(`[ReminderQueue] Job failed - ID: ${job.id}, Attempts: ${job.attemptsMade}, Error:`, err.message);
});

reminderQueue.on('error', (err) => {
  console.error('[ReminderQueue] Queue error:', err);
});