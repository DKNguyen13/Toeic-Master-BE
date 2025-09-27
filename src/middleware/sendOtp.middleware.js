import rateLimit from 'express-rate-limit'

const sendOtpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // Limit each IP to 5 login requests per windowMs
  message: { message: 'Too many request attempts from this IP, please try again after 60 seconds.' },
  standardHeaders: true, // Return rate limit info in the RateLimit-* headers
  legacyHeaders: false   // Disable the X-RateLimit-* headers
})

export default sendOtpLimiter
