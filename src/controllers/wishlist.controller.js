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

// Toggle lesson in wishlist
export const toggleWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) return error(res, 'User chưa login', 401);

    const { lessonId } = req.body;

    const lesson = await Lesson.findOne({ _id: lessonId, isDeleted: false });
    if (!lesson) return error(res, 'Bài học không tồn tại', 404);

    const existing = await Wishlist.findOne({ user: userId, lesson: lessonId });

    if (existing) {
      await Wishlist.findByIdAndDelete(existing._id);
      return success(res, 'Đã gỡ khỏi wishlist', { isFavorite: false });
    } else {
      await Wishlist.create({ user: userId, lesson: lessonId });
      return success(res, 'Đã thêm vào wishlist', { isFavorite: true });
    }
  } catch (err) {
    if (err.code === 11000) return error(res, 'Bài học đã có trong wishlist', 400);
    console.log('Toggle wishlist ', err.message);
    return error(res, 'Toggle wishlist error', 500);
  }
};

// Get wishlist for user
export const getLessonFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { lessonId } = req.params;

    const count = await Wishlist.countDocuments({ lesson: lessonId });
    const isFavorite = await Wishlist.exists({ user: userId, lesson: lessonId });

    return success(res, 'Lấy trạng thái thành công', { count, isFavorite: !!isFavorite });
  } catch (err) {
    return error(res, err.message, 500);
  }
};