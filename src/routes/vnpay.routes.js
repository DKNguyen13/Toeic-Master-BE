import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import { createPayment, returnPayment } from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/create", authenticate, createPayment);
router.get("/return", returnPayment);

export default router;
