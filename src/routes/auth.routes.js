import express from 'express';
import loginLimiter from '../middleware/loginLimiter.middleware.js'
import * as AuthController from '../controllers/auth.controller.js'

const router = express.Router();

router.post('/login', loginLimiter, AuthController.login);
router.post('/register', AuthController.register);
router.post('/send-otp', AuthController.sendRegisterOtp);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/logout', AuthController.logout);

// router.post('/send-otp', sendOTP);
// router.post('/forgot-password', resetPassword);

export default router;