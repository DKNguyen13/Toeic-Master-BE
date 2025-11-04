import Lesson from '../models/lesson.model.js';
import Wishlist from '../models/wishlist.model.js';
import { success, error } from "../utils/response.js";

// Add lesson to wishlist
export const addToWishlist = async (req, res) => {
  try {
    const { userId, lessonId } = req.body;

    const wishlistItem = await Wishlist.create({ user: userId, lesson: lessonId });
    return success(res, 'Đã thêm vào wishlist', wishlistItem);
  } catch (err) {
    if (err.code === 11000) {
      return error(res, 'Bài học đã có trong wishlist', 400);
    }
    return error(res, err.message, 500);
  }
};

// Delete lesson from wishlist
export const removeFromWishlist = async (req, res) => {
  try {
    const { userId, lessonId } = req.body;

    const lesson = await Lesson.findOne({ _id: lessonId, isDeleted: false });
    if(!lesson) return error(res, 'Bài học không tồn tại', 404);

    const deleted = await Wishlist.findOneAndDelete({ user: userId, lesson: lessonId });
    if (!deleted) return error(res, 'Bài học không có trong wishlist', 404);

    return success(res, 'Đã xóa khỏi wishlist');
  } catch (err) {
    return error(res, err.message, 500);
  }
};