import express from "express";
import { authenticate, isAdmin } from "../middleware/authenticate.js";
import limitRequest from '../middleware/limitRequest.middleware.js';
import * as adminController from "../controllers/admin.controller.js";
import { uploadTestFiles } from "../middleware/uploadTest.middleware.js";
import * as testImportController from "../controllers/testImport.controller.js";
import {
	getMaintenanceStatusAdmin,
	startMaintenance,
	stopMaintenance,
} from "../controllers/maintenance.controller.js";

const router = express.Router();

router.get('/users', authenticate, isAdmin, adminController.getAllUsersController);
router.get("/search-users", authenticate, isAdmin, adminController.searchUsers);
router.get('/user-detail/:id', authenticate, isAdmin, adminController.getUserDetail);
router.get('/dashboard', authenticate, isAdmin, adminController.getAdminDashboardStasts);
router.get("/revenue-stats", authenticate, isAdmin, adminController.getRevenueStatsController);
router.get("/users/export", authenticate, isAdmin, adminController.exportAllUsersController);
router.patch('/activate', authenticate, isAdmin, adminController.changeActivateUserController);
router.get('/maintenance', authenticate, isAdmin, getMaintenanceStatusAdmin);
router.post('/maintenance', authenticate, isAdmin, startMaintenance);
router.delete('/maintenance', authenticate, isAdmin, stopMaintenance);

router.post('/forgot-password', limitRequest, adminController.adminForgotPassword);
router.post('/reset-password', adminController.adminResetPassword);

// Test import routes
router.post('/tests/import', authenticate, isAdmin, uploadTestFiles.fields([{ name: 'file', maxCount: 1 }, { name: 'audio', maxCount: 1 }]), testImportController.importTestFromExcel);
router.get('/tests/import/template', authenticate, testImportController.downloadExcelTemplate);

export default router;