import path from "path";
import multer from "multer";
import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import * as LessonController from '../controllers/lesson.controller.js';

const router = express.Router();

const upload = multer({
  dest: "uploads/",
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== ".docx") {
      return cb(new Error("Vui lòng upload file Word (.docx)!"));
    }
    cb(null, true);
  },
});

router.post('/', LessonController.createLesson);
router.post("/upload", authenticate, upload.single("file"), LessonController.uploadLesson);

router.get("/public", LessonController.getLessonsPublic);
router.get('/public/:id', LessonController.getLessonFreeById);
router.get('/', authenticate, LessonController.getLessons);
router.get('/:id', authenticate, LessonController.getLessonById);

router.put('/:id', authenticate, LessonController.updateLesson);
router.put("/:id/upload", authenticate, upload.single("file"), LessonController.reuploadLesson);

router.patch('/:id/delete', authenticate, LessonController.deleteLesson);
router.patch('/:id/views', LessonController.incrementViews);

export default router;