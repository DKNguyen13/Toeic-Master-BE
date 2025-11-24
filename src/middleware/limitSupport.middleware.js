import rateLimit from 'express-rate-limit';

const supportLimiters = new Map();

export const limitSupport = (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const userId = req.user.id;

    if (!supportLimiters.has(userId)) {
        supportLimiters.set(userId, {
            count: 1,
            last: Date.now()
        });
        return next();
    }

    const info = supportLimiters.get(userId);
    const now = Date.now();

    // reset mỗi 60 phút
    if (now - info.last > 60 * 60 * 1000) {
        supportLimiters.set(userId, { count: 1, last: now });
        return next();
    }

    if (info.count >= 1) {
        return res.status(429).json({ message: "Bạn chỉ có thể gửi 1 yêu cầu hỗ trợ mỗi 60 phút." });
    }

    info.count += 1;
    supportLimiters.set(userId, info);
    next();
};
