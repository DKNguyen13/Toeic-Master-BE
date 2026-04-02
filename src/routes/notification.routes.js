import express from 'express';
import { authenticate } from "../middleware/authenticate.js";
import { trackActivityMiddleware } from "../middleware/trackActivity.middleware.js";
import { getAllNotifications, markNotificationAsRead } from "../controllers/notification.controller.js";

const router = express.Router({ mergeParams: true });
// public routes no need authenticate
/* eg: GET /api/notifications/ */
router.use(authenticate); // use authenticate for this router
router.use(trackActivityMiddleware); // use track activity middleware for this router

router.get('/', getAllNotifications);
router.patch('/:id/read', markNotificationAsRead);

export default router;