import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import * as adminController from "../controllers/admin.controller.js";
import * as testImportController from "../controllers/testImport.controller.js";
import { uploadExcel } from "../middleware/uploadTest.middleware.js";

const router = express.Router();

router.get('/users', authenticate, adminController.getAllUsersController);
router.get("/search-users", authenticate, adminController.searchUsers);
router.get('/dashboard', authenticate, adminController.getAdminDashboard);
router.get("/revenue-stats", authenticate, adminController.getRevenueStatsController);

router.patch('/activate', authenticate, adminController.changeActivateUserController);

// Test import routes
router.post('/tests/import', authenticate, uploadExcel.single('file'), testImportController.importTestFromExcel);
router.get('/tests/import/template', authenticate, testImportController.downloadExcelTemplate);

export default router;
