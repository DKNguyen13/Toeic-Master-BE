import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import * as PackageController from '../controllers/vipPackage.controller.js';

const router = express.Router();

router.get('/', PackageController.getAllPackages);
router.get('/:id', authenticate, PackageController.getPackageById);

router.put('/:id', authenticate, PackageController.updatePackage);

export default router;