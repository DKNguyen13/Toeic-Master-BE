import express from "express";
import { getPublicMaintenanceStatus } from "../controllers/maintenance.controller.js";

const router = express.Router();

router.get("/maintenance", getPublicMaintenanceStatus);

export default router;
