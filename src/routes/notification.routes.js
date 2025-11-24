import express from 'express';
import { authenticate } from "../middleware/authenticate.js";
import { getAllNotifications, markNotificationAsRead } from "../controllers/notification.controller.js";

const router = express.Router({ mergeParams: true });

router.get('/', authenticate, getAllNotifications);

router.patch('/:id/read', authenticate, markNotificationAsRead);

export default router;