import dotenv from 'dotenv';
dotenv.config();

export const config = {
    mongodbUri: process.env.MONGODB_URI,
    port: process.env.PORT || 8080,

    // JWT
    accessTokenKey: process.env.ACCESS_TOKEN_KEY,
    accessTokenLife: process.env.ACCESS_TOKEN_LIFE || '1d',
    refreshTokenKey: process.env.REFRESH_TOKEN_KEY,
    refreshTokenLife: process.env.REFRESH_TOKEN_LIFE || '7d',

    // Redis
    redisUrl: process.env.REDIS_URL || 'redis://127.0.0.1:6379',

    // Mail
    mailHost: process.env.MAIL_HOST,
    mailPort: process.env.MAIL_PORT,
    mailUser: process.env.MAIL_USER,
    mailPass: process.env.MAIL_PASS,

    // Google reCAPTCHA
    recaptchaSecret: process.env.RECAPTCHA_SECRET_KEY,

    // Google OAuth
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    googleServerCallback: process.env.GOOGLE_SERVER_CALLBACK,

    // Cookie options
    cookieSecure: process.env.COOKIE_SECURE === 'false', // true => chỉ gửi qua https
    cookieSameSite: process.env.COOKIE_SAMESITE || 'strict',
    cookieHttpOnly: process.env.COOKIE_HTTPONLY !== 'false', // default: true

    // Cloudinary
    cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
    cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
    cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,

    // Frontend url
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",

    // VNPay
    paymentSuccessPath: process.env.PAYMENT_SUCCESS_PATH || "/payment/success",
    paymentFailPath: process.env.PAYMENT_FAIL_PATH || "/payment/fail",
    vnp_TmnCode: process.env.VNP_TMNCODE,
    vnp_HashSecret: process.env.VNP_HASHSECRET,
    vnp_Url: process.env.VNP_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    vnp_ReturnUrl: process.env.VNP_RETURNURL || "http://localhost:3000/api/payment/return",
    
    // GroqCloud AI
    groqApiKey: process.env.GROQ_API_KEY,

    // Ollama
    ollamaApiKey: process.env.OLLAMA_API_KEY,
    ollama_model: process.env.OLLAMA_MODEL,

    // Meilisearch
    meili_master_key: process.env.MEILI_MASTER_KEY,
    meili_host: process.env.MEILI_HOST,
};