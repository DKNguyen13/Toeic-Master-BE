import multer from 'multer';
import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import * as authController from '../controllers/auth.controller.js';
import limitRequest from '../middleware/limitRequest.middleware.js';
import { getUserPurchaseHistory } from '../controllers/payment.controller.js'
import { limitSupport } from '../middleware/limitSupport.middleware.js';

const router = express.Router();
const upload = multer();

router.post('/login', limitRequest, authController.login);
router.post('/admin-login', limitRequest, authController.adminLogin);
router.post('/google', authController.googleLogin);
router.post('/send-otp', limitRequest, authController.sendOTP);
router.post('/send-register-otp', limitRequest, authController.sendRegiOTP);
router.post('/register', authController.register);
router.post('/forgot-password', authController.resetPassword);
router.post('/refresh-token', authController.refreshToken);
router.post('/support',  authenticate, limitSupport, authController.sendSupportEmail);
router.post('/logout', authController.logout);

router.patch('/change-password', authenticate, authController.changePassword);
router.patch('/update-profile', authenticate, upload.single('avatar'), authController.updateProfileController);

router.get('/profile', authenticate, authController.getProfile);
router.get('/check-role', authController.checkRole);
router.get('/purchase-history', authenticate, getUserPurchaseHistory);
router.get('/check-vip', authenticate, authController.checkPremiumAccess);

export default router;
