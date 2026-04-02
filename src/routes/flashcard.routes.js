import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { trackActivityMiddleware } from '../middleware/trackActivity.middleware.js';
import * as FlashcardController from '../controllers/flashcard.controller.js';

const router = express.Router();

router.get('/free', FlashcardController.getAllFlashcardsFree);

router.use(authenticate); // use authenticate for routes below
router.use(trackActivityMiddleware); // use track activity middleware for routes below

router.post('/', FlashcardController.createFlashcard);
router.post('/import', FlashcardController.importFlashcardsJSON);
router.post("/bulk", FlashcardController.createFlashcardsBulk);
router.get('/', FlashcardController.getAllFlashcards);
router.delete('/:id', FlashcardController.deleteFlashcard);

export default router;