import express from 'express';

import { authenticate } from '../middleware/authenticate.js';

import {
    getTestSession, getSessionResults, getUserSessions,
    getUserStatistics, pauseSession, resumeSession, startSession,
    submitBulkAnswers, submitSession
} from '../controllers/session.Controller.js';


const router = express.Router();

router.use(authenticate); // use authenticate for this router

router.post("/start", startSession);
router.get('/user', getUserSessions);
router.get('/user/statistics', getUserStatistics);
router.get('/:sessionId', getTestSession);
router.post('/:sessionId/answers/bulk', submitBulkAnswers);
router.post('/:sessionId/submit', submitSession);
router.put('/:sessionId/pause', pauseSession);
router.put('/:sessionId/resume', resumeSession);
router.get('/:sessionId/results', getSessionResults);


export default router;