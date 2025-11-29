import express from "express";
import { getAllQuestions, getRandomQuestions, createBlankQuestion, updateBlankQuestion, deleteBlankQuestion } from "../controllers/fillBlankQuestion.controller.js";

const router = express.Router();

router.get("/", getAllQuestions);
router.get("/random", getRandomQuestions);

router.post("/", createBlankQuestion);

router.put("/:id", updateBlankQuestion);

router.delete("/:id", deleteBlankQuestion);

export default router;
