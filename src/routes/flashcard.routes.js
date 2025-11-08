import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import * as FlashcardController from '../controllers/flashcard.controller.js';

const router = express.Router();

router.post('/', authenticate, FlashcardController.createFlashcard);

router.get('/', authenticate, FlashcardController.getAllFlashcards);
router.get('/free', FlashcardController.getAllFlashcardsFree);

router.delete('/:id', authenticate, FlashcardController.deleteFlashcard);

export default router;