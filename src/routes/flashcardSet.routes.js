import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { trackActivityMiddleware } from '../middleware/trackActivity.middleware.js';
import * as FlashcardController from '../controllers/flashcard.controller.js';

const router = express.Router();
// public routes
router.get('/free', FlashcardController.getAllFlashcardSetFree);

router.use(authenticate); // use authenticate for routes below
router.use(trackActivityMiddleware); // use track activity middleware for routes below

router.post('/', FlashcardController.createSet);
router.get('/', FlashcardController.getAllFlashcardSet);
router.delete('/:id', FlashcardController.deleteSet);

export default router;