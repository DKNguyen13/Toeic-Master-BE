import express from 'express';
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
router.put('/:partId', updatePart);

// Delete part
router.delete('/:partId', deletePart);

export default router;