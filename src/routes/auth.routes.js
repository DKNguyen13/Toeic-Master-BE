import express from 'express';
import loginLimiter from '../middleware/loginLimiter.js'
import * as AuthController from '../controllers/auth.controller.js'

const router = express.Router();

router.post('/login', loginLimiter, AuthController.login);
// router.post('/register', register);
// router.post('/send-otp', sendOTP);
// router.post('/forgot-password', resetPassword);
// router.post('/refresh-token', refreshToken);
// router.post('/logout', logout);

export default router;