import express from 'express';

import { createTest, getAllTest, getAllTestbyAdmin, getTestDetail, modifyStatus, updateTest } from '../controllers/test.controller.js';
import {authenticate, isAdmin} from "../middleware/authenticate.js";
import { upload } from '../middleware/upload.middleware.js';
import { getTestInfo } from '../controllers/test.controller.js';
const router = express.Router();

router.get('/', getAllTest);
router.get('/admin', authenticate, isAdmin, getAllTestbyAdmin);
router.get('/:slug', getTestDetail);
router.get('/:slug/edit', getTestInfo);
router.post('/', authenticate, isAdmin , upload.single("audio"), createTest);
router.put('/:slug', updateTest);
router.patch('/:slug', authenticate, isAdmin, modifyStatus);

export default router;
