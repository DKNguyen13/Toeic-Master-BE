import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import * as FlashcardController from '../controllers/flashcard.controller.js';

const router = express.Router();

router.post('/', authenticate, FlashcardController.createSet);

router.get('/', authenticate, FlashcardController.getAllFlashcardSet);
router.get('/free', FlashcardController.getAllFlashcardSetFree);

router.delete('/:id', authenticate, FlashcardController.deleteSet);

export default router;