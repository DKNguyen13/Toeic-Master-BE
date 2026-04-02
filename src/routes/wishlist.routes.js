import express from 'express';
import { authenticate } from "../middleware/authenticate.js";
import { trackActivityMiddleware } from "../middleware/trackActivity.middleware.js";
import * as WishlistController from "../controllers/wishlist.controller.js";

const router = express.Router()
router.use(authenticate); // use authenticate for this router
router.use(trackActivityMiddleware); // use track activity middleware for this router

router.patch('/toggle', WishlistController.toggleWishlist);
router.get('/:lessonId', WishlistController.getLessonFavorite);

export default router;