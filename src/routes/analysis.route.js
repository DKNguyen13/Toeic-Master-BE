import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import { trackActivityMiddleware } from "../middleware/trackActivity.middleware.js";
import { analyzeResult } from "../controllers/analysis.controller.js";

const router = express.Router();


router.use(authenticate); // use authenticate for routes below
router.use(trackActivityMiddleware); // use track activity middleware for routes below
router.post("/result", analyzeResult);

export default router;