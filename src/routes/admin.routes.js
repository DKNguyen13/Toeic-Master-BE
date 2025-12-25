import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import limitRequest from '../middleware/limitRequest.middleware.js';
import * as adminController from "../controllers/admin.controller.js";
import { uploadExcel } from "../middleware/uploadTest.middleware.js";
import * as testImportController from "../controllers/testImport.controller.js";

const router = express.Router();

router.get('/users', authenticate, adminController.getAllUsersController);
router.get("/search-users", authenticate, adminController.searchUsers);
router.get('/dashboard', authenticate, adminController.getAdminDashboardStasts);
router.get("/revenue-stats", authenticate, adminController.getRevenueStatsController);

router.patch('/activate', authenticate, adminController.changeActivateUserController);

router.post('/forgot-password', limitRequest, adminController.adminForgotPassword);
router.post('/reset-password', adminController.adminResetPassword);

// Test import routes
router.post('/tests/import', authenticate, uploadExcel.single('file'), testImportController.importTestFromExcel);
router.get('/tests/import/template', authenticate, testImportController.downloadExcelTemplate);

export default router;