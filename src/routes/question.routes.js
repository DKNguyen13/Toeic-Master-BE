import express from 'express';
import { createQuestions, getAllQuestionByPart, getAllQuestionByTest } from '../controllers/question.controller.js';
import { upload } from '../middleware/upload.middleware.js';

const router = express.Router({ mergeParams: true });

// Lấy tất cả questions trong 1 test
router.get('/', getAllQuestionByTest);

// Lấy tất cả questions trong 1 part (thuộc test)
router.get('/parts', getAllQuestionByPart);

// Lấy chi tiết 1 question
// router.get('/api/question/:questionId', getQuestionById);

// Tạo question trong part
router.post('/', upload.any(), createQuestions);

// Cập nhật question
// router.put('/api/question/:questionId', updateQuestion);

// Xóa question
// router.delete('/api/question/:questionId', deleteQuestion);

export default router;