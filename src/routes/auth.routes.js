import express from 'express';
import loginLimiter from '../middleware/loginLimiter.middleware.js'
import * as AuthController from '../controllers/auth.controller.js'

const router = express.Router();

router.post('/login', loginLimiter, AuthController.login);
router.post('/logout', AuthController.logout);
// router.post('/register', register);
// router.post('/send-otp', sendOTP);
// router.post('/forgot-password', resetPassword);
// router.post('/refresh-token', refreshToken);

export default router;