import express from 'express';

import { authenticate } from '../middleware/authenticate.js';
import { getSession, getSessionQuestions, getSessionResults, getUserSessions, getUserStatistics, pauseSession, resumeSession, startSession, submitAnswer, submitBulkAnswers, submitSession } from '../controllers/sessionController.js';

const router = express.Router();

router.use(authenticate); // use authenticate for this router

router.post("/start", startSession);
router.get('/user', getUserSessions);
router.get('/user/statistics', getUserStatistics);
router.get('/:sessionId', getSession);
router.get('/:sessionId/questions', getSessionQuestions);
router.post('/:sessionId/answers', submitAnswer);
router.post('/:sessionId/answers/bulk', submitBulkAnswers);
router.post('/:sessionId/submit', submitSession);
router.put('/:sessionId/pause', pauseSession);
router.put('/:sessionId/resume', resumeSession);
router.get('/:sessionId/results', getSessionResults);


export default router;