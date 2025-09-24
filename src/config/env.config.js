import dotenv from 'dotenv';
dotenv.config();

export const config = {
    mongodbUri: process.env.MONGODB_URI,
    port: process.env.PORT || 8080,

    // JWT
    accessTokenKey: process.env.ACCESS_TOKEN_KEY,
    accessTokenLife: process.env.ACCESS_TOKEN_LIFE || '5m',
    refreshTokenKey: process.env.REFRESH_TOKEN_KEY,
    refreshTokenLife: process.env.REFRESH_TOKEN_LIFE || '7d',

    // Redis
    redisUrl: process.env.REDIS_URL || 'redis://127.0.0.1:6379',

    // Mail
    mailHost: process.env.MAIL_HOST,
    mailPort: process.env.MAIL_PORT || 587,
    mailUser: process.env.MAIL_USER,
    mailPass: process.env.MAIL_PASS,

    // Google reCAPTCHA
    recaptchaSecret: process.env.RECAPTCHA_SECRET_KEY,

    // Cookie options
    cookieSecure: process.env.COOKIE_SECURE === 'false', // true => chỉ gửi qua https
    cookieSameSite: process.env.COOKIE_SAMESITE || 'strict',
    cookieHttpOnly: process.env.COOKIE_HTTPONLY !== 'false', // default: true

    // Cloudinary
    cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
    cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
    cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
};
