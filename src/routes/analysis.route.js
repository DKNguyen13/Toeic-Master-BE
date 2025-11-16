import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import { analyzeResult } from "../controllers/analysis.controller.js";

const router = express.Router();

router.post("/result", authenticate, analyzeResult);

export default router;