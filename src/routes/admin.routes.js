import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import * as adminController from "../controllers/admin.controller.js";

const router = express.Router();

router.get('/users', authenticate, adminController.getAllUsersController);
router.get("/search-users", authenticate, adminController.searchUsers);

router.patch('/activate', authenticate, adminController.changeActivateUserController);

export default router;
