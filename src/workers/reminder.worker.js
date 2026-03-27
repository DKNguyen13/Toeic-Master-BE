import { reminderQueue } from "../queues/reminder.queue.js";
import User from "../models/user.model.js";
import { sendReminderEmail } from "../services/mail.service.js";
import { SEVEN_DAYS_IN_MS } from "../utils/constant.js";

reminderQueue.process("sendReminder", 5, async (job) => {
  try {
    const { userId } = job.data;
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      return;
    }
    const now = new Date();
    // check inactive
    if(user.lastLoginAt &&
      (now - new Date(user.lastLoginAt).getTime()) < SEVEN_DAYS_IN_MS) {
        console.log(`User ${user.email} is active, no reminder needed.`);
        return; // Chưa đến 7 ngày, không gửi email
    }
    // check đã gửi email chưa
    if (user.lastRemindedAt &&
      (now.getTime() - new Date(user.lastRemindedAt).getTime()) < SEVEN_DAYS_IN_MS) {
        console.log(`User ${user.email} has already been reminded recently.`);
        return; // Đã gửi email trong 7 ngày qua, không gửi lại
    }
  
    await sendReminderEmail(user.email, user.fullname);
  
    user.lastRemindedAt = new Date();
    await user.save();
    
  } catch (err) {
    console.error("Reminder job failed:", err.message);
    throw err; // để Bull retry
  }
});

reminderQueue.on("completed", (job) => {
  console.log("Job done:", job.id);
});

reminderQueue.on("failed", (job, err) => {
  console.error("Job failed:", err);
});