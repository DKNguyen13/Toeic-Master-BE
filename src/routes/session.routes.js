import express from 'express';

import { authenticate } from '../middleware/authenticate.js';
import { trackActivityMiddleware } from '../middleware/trackActivity.middleware.js';

import {
    getTestSession, getSessionResults, getUserSessions,
    getUserStatistics, pauseSession, resumeSession, startSession,
    submitBulkAnswers, submitSession
} from '../controllers/session.controller.js';


const router = express.Router();

router.use(authenticate); // use authenticate for this router
router.use(trackActivityMiddleware); // Middleware để track hoạt động của user, đặt sau authenticate để có user info

router.post("/start", startSession);
router.get('/user', getUserSessions);
router.get('/user/statistics', getUserStatistics);
router.get('/:sessionId', getTestSession);
router.post('/:sessionId/answers/bulk', submitBulkAnswers);
router.post('/:sessionId/submit', submitSession);
router.post('/:sessionId/pause', pauseSession);
router.put('/:sessionId/resume', resumeSession);
router.get('/:sessionId/results', getSessionResults);


export default router;