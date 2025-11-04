import express from 'express';
import { authenticate } from "../middleware/authenticate.js";
import * as WishlistController from "../controllers/wishlist.controller.js";

const router = express.Router()

router.patch('/toggle', authenticate, WishlistController.toggleWishlist);
router.get('/:lessonId', authenticate, WishlistController.getLessonFavorite);

export default router;