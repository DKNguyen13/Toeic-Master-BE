import rateLimit from 'express-rate-limit'

const limitRequest = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // Limit each IP to 5 login requests per windowMs
    message: { message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 60 giây.' },
    standardHeaders: true, // Return rate limit info in the RateLimit-* headers
    legacyHeaders: false   // Disable the X-RateLimit-* headers
})

export default limitRequest;
