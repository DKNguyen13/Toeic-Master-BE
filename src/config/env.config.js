import dotenv from 'dotenv';
dotenv.config();

const parseBoolean = (value, defaultValue = false) => {
  if (value === undefined) return defaultValue;
  return String(value).toLowerCase() === 'true';
};

const parseSameSite = (value) => {
  const normalized = String(value || 'lax').toLowerCase();
  if (normalized === 'none') return 'none';
  if (normalized === 'strict') return 'strict';
  return 'lax';
};

export const config = {
  mongodbUri: process.env.MONGODB_URI,
  port: process.env.PORT || 8080,

  // JWT
  accessTokenKey: process.env.ACCESS_TOKEN_KEY,
    accessTokenLife: process.env.ACCESS_TOKEN_LIFE || '1d',
  refreshTokenKey: process.env.REFRESH_TOKEN_KEY,
    refreshTokenLife: process.env.REFRESH_TOKEN_LIFE || '7d',

  // Admin key
  resetTokenKey: process.env.RESET_TOKEN_KEY,
  resetTokenLife: process.env.RESET_TOKEN_LIFE,

  // Redis
  redisUrl: process.env.REDIS_URL,
  redisToken: process.env.REDIS_TOKEN,

  // Mail
  resendApiKey: process.env.RESEND_API_KEY,
  mailFromEmail: process.env.MAIL_FROM_EMAIL,
  mailFromName: process.env.MAIL_FROM_NAME || "Toeic Master",
  adminEmail: process.env.ADMIN_EMAIL,
  supportEmail: process.env.SUPPORT_EMAIL,

  // Google reCAPTCHA
  recaptchaSecret: process.env.RECAPTCHA_SECRET_KEY,

  // Google OAuth
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleServerCallback: process.env.GOOGLE_SERVER_CALLBACK,

  // Cookie options
  cookieSecure: parseBoolean(
    process.env.COOKIE_SECURE,
    process.env.NODE_ENV === 'production'
  ),
  cookieSameSite: parseSameSite(process.env.COOKIE_SAME_SITE),
  cookieHttpOnly: true,

  // Cloudinary
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,

  // Website URLs
  frontendUrl: process.env.FRONTEND_URL,
  adminUrl: process.env.ADMIN_URL,
  backendUrl: process.env.BACKEND_URL,

  // VNPay
  paymentSuccessPath: process.env.PAYMENT_SUCCESS_PATH || "/payment/success",
  paymentFailPath: process.env.PAYMENT_FAIL_PATH || "/payment/fail",
  vnp_TmnCode: process.env.VNP_TMNCODE,
  vnp_HashSecret: process.env.VNP_HASHSECRET,
    vnp_Url: process.env.VNP_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
  vnp_ReturnUrl: process.env.VNP_RETURNURL,

  // GroqCloud AI
  groqApiKey: process.env.GROQ_API_KEY,

  // Ollama
  ollamaApiKey: process.env.OLLAMA_API_KEY,
  ollama_model: process.env.OLLAMA_MODEL,

  // Redis cloud
  redisCloudHost: process.env.REDIS_CLOUD_HOST,
  redisCloudPort: process.env.REDIS_CLOUD_PORT,
  redisCloudPassword: process.env.REDIS_CLOUD_PASSWORD,
};