import path from "path";
import multer from "multer";
import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { trackActivityMiddleware } from '../middleware/trackActivity.middleware.js';
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

// public routes
router.get("/public", LessonController.getLessonsPublic);
router.get('/public/:id', LessonController.getLessonFreeById);
router.patch('/:id/views', LessonController.incrementViews);

router.use(authenticate); // use authenticate for routes below
router.use(trackActivityMiddleware); // use track activity middleware for routes below
// protected routes
router.post('/', LessonController.createLesson);
router.post("/upload", upload.single("file"), LessonController.uploadLesson);
router.get('/', LessonController.getLessons);
router.get('/:id', LessonController.getLessonById);
router.put('/:id', LessonController.updateLesson);
router.put("/:id/upload", upload.single("file"), LessonController.reuploadLesson);
router.patch('/:id/delete', LessonController.deleteLesson);

export default router;