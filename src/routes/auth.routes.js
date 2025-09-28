import express from 'express';
import sendOtpLimiter from '../middleware/sendOtp.middleware.js';
import * as AuthController from '../controllers/auth.controller.js'
import loginLimiter from '../middleware/loginLimiter.middleware.js'

const router = express.Router();

router.post('/login', loginLimiter, AuthController.login);
router.post('/google', AuthController.googleLogin);
router.post('/register', AuthController.register);
router.post('/send-otp', sendOtpLimiter,  AuthController.sendRegisterOtp);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/logout', AuthController.logout);

// router.post('/send-otp', sendOTP);
// router.post('/forgot-password', resetPassword);

export default router;