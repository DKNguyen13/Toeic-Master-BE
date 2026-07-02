import cron from 'node-cron';
import UserTestSession from '../models/userTestSession.model.js';
import UserAnswer from '../models/userAnswer.model.js';
import { SESSION_STATUS } from '../constants/sessionTest.constants.js';

/**
 * Clean up expired test sessions and their answers
 * Expired sessions are those with `expiredAt` <= current date/time AND status !== completed
 */
export const cleanExpiredSessions = async () => {
  console.log('[SessionCleanup] Running expired test sessions check...');
  try {
    const now = new Date();

    // Query for expired, non-completed sessions
    const expiredSessions = await UserTestSession.find({
      expiredAt: { $lte: now },
      status: { $ne: SESSION_STATUS.COMPLETED }
    }, { _id: 1 }).lean();

    if (expiredSessions.length === 0) {
      console.log('[SessionCleanup] No expired non-completed sessions found.');
      return;
    }

    const sessionIds = expiredSessions.map(session => session._id);
    console.log(`[SessionCleanup] Found ${sessionIds.length} expired sessions to clean up.`);

    // Cascading delete corresponding user answers
    const answersDeleteResult = await UserAnswer.deleteMany({
      sessionId: { $in: sessionIds }
    });
    console.log(`[SessionCleanup] Deleted ${answersDeleteResult.deletedCount} user answers.`);

    // Delete the sessions
    const sessionsDeleteResult = await UserTestSession.deleteMany({
      _id: { $in: sessionIds }
    });
    console.log(`[SessionCleanup] Deleted ${sessionsDeleteResult.deletedCount} expired sessions.`);

  } catch (err) {
    console.error('[SessionCleanup] Error during daily cleanup job:', err);
  }
};

/**
 * Initialize daily clean up scheduler
 * Runs daily at 01:00 AM
 */
export const initSessionCleanupScheduler = () => {
  // Cron pattern: 0 1 * * * -> Minute 0, Hour 1 (01:00 AM), every day
  cron.schedule('0 1 * * *', async () => {
    await cleanExpiredSessions();
  });

  console.log('[SessionCleanup] Session cleanup scheduler initialized (runs daily at 01:00 AM)');
};
