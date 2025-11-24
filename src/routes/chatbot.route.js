import express from "express";
import {chatWithGemini} from "../controllers/gemini.controller.js";

const router = express.Router();

router.post("/", chatWithGemini)

export default router;