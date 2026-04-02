import User from '../models/user.model.js';

/**
 * Middleware để track activity của user
 * - Cập nhật lastActivityAt mỗi 1 giờ một lần (tránh hit DB quá nhiều)
 * - Không block request nếu có lỗi
 * - Chỉ track cho authenticated users
 */
export const trackActivityMiddleware = async (req, res, next) => {
  try {
    // Chỉ track nếu user đã authenticate
    if (!req.user || !req.user.id) {
      return next();
    }

    const now = new Date();
    const ONE_HOUR_MS = 60 * 60 * 1000; // 1 giờ
    const oneHourAgo = new Date(now.getTime() - ONE_HOUR_MS);

    // Kiểm tra xem có cần cập nhật lastActivityAt không
    // Nếu không có lastActivityAt hoặc quá 1 giờ kể từ lần cuối thì cập nhật
    if (!req.user.lastActivityAt || new Date(req.user.lastActivityAt) < oneHourAgo) {
      // Cập nhật DB asynchronously (không await, không block request)
      User.findByIdAndUpdate(
        req.user.id,
        {
          lastActivityAt: now,
        },
        { new: false } // Không cần return updated doc
      ).catch((err) => {
        // Log error nhưng không interrupt request
        console.error(`[TrackActivity] Error updating activity for user ${req.user.id}:`, err.message);
      });

      // Cập nhật req.user ngay lập tức (in-memory) để avoid duplicate updates
      req.user.lastActivityAt = now;
    }

    next();
  } catch (err) {
    // Nếu có lỗi bất ngờ, vẫn cho request đi tiếp
    // không return error response để không làm ảnh hưởng UX
    console.error('[TrackActivity] Middleware error:', err.message);
    next();
  }
};
