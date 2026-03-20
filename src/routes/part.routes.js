import express from 'express';
import { upload } from "../middleware/upload.middleware.js"
import { createPart, deletePart, getAllParts, getPartById, updatePart } from '../controllers/part.controller.js';
import {authenticate, isAdmin} from "../middleware/authenticate.js";

const router = express.Router({ mergeParams: true });

// Get all part
router.get('/', getAllParts);

// Get part by id
router.get('/:partId', getPartById);

// Create part
router.post('/', authenticate, isAdmin, createPart);

// Update part
router.put('/:partId', authenticate, isAdmin, upload.single('file'), updatePart);

// Delete part
router.delete('/:partId', deletePart);

export default router;