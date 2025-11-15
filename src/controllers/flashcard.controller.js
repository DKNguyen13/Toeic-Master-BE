import User from '../models/user.model.js';
import Flashcard from '../models/flashcard.model.js';
import { success, error } from '../utils/response.js';
import FlashcardSet from '../models/flashcardSet.model.js';

// Create flashcard set
export const createSet = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, description } = req.body;

        if (!name) return error(res, 'Tên set là bắt buộc!', 400);
        const user = await User.findById(userId);
        
        let limit = 1;

        if(user.role !== 'admin'){
            if (user.vip.isActive) {
                switch (user.vip.type) {
                    case 'basic': limit = 2; break;
                    case 'advanced': limit = 5; break;
                    case 'premium': limit = 10; break;
                }
            }
            const count = await FlashcardSet.countDocuments({ user: userId });
            if (count >= limit && limit > 0) {
                if (limit < 10) {
                    return error(res, `Bạn đã đạt giới hạn ${limit} bộ flashcard. Nâng cấp VIP để tạo thêm!`, 403);
                } else {
                    return error(res, `Bạn đã đạt giới hạn ${limit} bộ flashcard.`, 403);
                }
            }
        }
      
        const newSet = await FlashcardSet.create({
            user: userId,
            name,
            description,
            count: 0
        });
        return success(res, 'Tạo set thành công', newSet, 201);
    } catch (err) {
        console.error(err);
        return error(res, 'Lỗi khi tạo set');
    }
};

// Create flashcard
export const createFlashcard = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        
        if (!user) return error(res, 'Không tìm thấy người dùng!', 404);
        
        const { set: setId } = req.body;
        if (!setId) return error(res, 'Bạn phải chọn một set để tạo flashcard!', 400);
        
        const set = await FlashcardSet.findOne({ _id: setId, user: userId });
        if (!set) return error(res, 'Set không tồn tại hoặc không thuộc bạn!', 404);
        
        const count = await Flashcard.countDocuments({ user: userId });

        let limit = 5;
        if(user.role !== 'admin'){
            if (user.vip.isActive) {
                switch (user.vip.type) {
                    case 'basic': limit = 50; break;
                    case 'advanced': limit = 60; break;
                    case 'premium': limit = 100; break;
                }
            }
            if (count >= limit) {
                const msg = limit < 100 
                        ? `Bạn đã đạt giới hạn tạo ${limit} flashcard. Nâng cấp VIP để tạo thêm!` 
                        : `Bạn đã đạt giới hạn tạo ${limit} flashcard.`;
                    return error(res, msg, 403);
            }        
        }

        const flashcard = await Flashcard.create({
            user: userId,
            set: set._id,
            word: req.body.word,
            meaning: req.body.meaning,
            example: req.body.example,
            note: req.body.note
        });

        await FlashcardSet.findByIdAndUpdate(set._id, { $inc: { count: 1 } });

        return success(res, 'Tạo flash card thành công', flashcard, 201);
    } catch (err) {
        console.error(err);
        return error(res, 'Lỗi khi tạo flashcard.');
    }
};

// Get all flashcards of current user
export const getAllFlashcards = async (req, res) => {
    try {
        const userId = req.user.id;
        const { set: setId } = req.query;

        const query = { user: userId };
        if (setId) query.set = setId;

        const flashcards = await Flashcard.find(query).sort({ createdAt: -1 });

        return success(res, 'Lấy danh sách flashcard thành công', flashcards);
    } catch (err) {
        console.error(err);
        return error(res, 'Lỗi khi lấy danh sách flashcard.');
    }
};

// Get all flashcard set
export const getAllFlashcardSet = async (req, res) => {
    try {
        const userId = req.user.id;
        const sets = await FlashcardSet.find({ user: userId }).sort({ createdAt: -1 });
        return success(res, 'Lấy danh sách bộ flashcard thành công', sets);
    } catch (err) {
        console.error(err);
        return error(res, 'Lỗi khi lấy danh sách bộ flashcard.');
    }
};

// Get all flashcardset free
export const getAllFlashcardSetFree = async (req, res) => {
    try{
        const admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            console.log("Admin không tồn tại, vui lòng chạy createAdminIfNotExist trước.");
            return error(res, 'Hiện tại chưa có dữ liệu.');;
        }
        const sets = await FlashcardSet.find({ user: admin._id }).sort({ createdAt: -1 });
        return success(res, 'Lấy danh sách bộ từ thành công', sets);
    }
    catch (err){
        console.error(err);
        return error(res, 'Lỗi khi lấy danh sách flashcard.');
    }
}

// Get all flashcard free
export const getAllFlashcardsFree = async (req, res) => {
    try{
        const admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            console.log("Admin không tồn tại, vui lòng chạy createAdminIfNotExist trước.");
            return error(res, 'Hiện tại chưa có dữ liệu.');;
        }
        const { set: setId } = req.query;
        const query = { user: admin._id };

        if (setId) query.set = setId;

        const flashcards = await Flashcard.find(query).sort({ createdAt: -1 });
        return success(res, 'Lấy danh sách flashcard thành công', flashcards);
    }
    catch (err){
        console.error(err);
        return error(res, 'Lỗi khi lấy danh sách flashcard.');
    }
}

// Delete flashcard
export const deleteFlashcard = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const flashcard = await Flashcard.findOneAndDelete({ _id: id, user: userId });
        if (!flashcard) return error(res, 'Không tìm thấy flashcard để xóa!', 404);
        
        if (flashcard.set) {
            await FlashcardSet.findByIdAndUpdate(flashcard.set, { $inc: { count: -1 } });
        }

        return success(res, 'Xóa flashcard thành công');
    } catch (err) {
        console.error(err);
        return error(res, 'Lỗi khi xóa flashcard.');
    }
};

// Delete flashcard set
export const deleteSet = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const set = await FlashcardSet.findOne({ _id: id, user: userId });
        if (!set) return error(res, 'Set không tồn tại hoặc không thuộc bạn!', 404);

        await Flashcard.deleteMany({ set: set._id, user: userId });

        await FlashcardSet.findByIdAndDelete(set._id);

        return success(res, 'Đã xóa set và tất cả flashcard liên quan!');
    } catch (err) {
        console.error(err);
        return error(res, 'Lỗi khi xóa set.');
    }
};