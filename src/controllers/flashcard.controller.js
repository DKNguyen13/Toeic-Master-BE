import User from '../models/user.model.js';
import Flashcard from '../models/flashcard.model.js';
import { success, error } from '../utils/response.js';
import FlashcardSet from '../models/flashcardSet.model.js';

// Limit
export const getSetLimit = (user) => {
  if (user.role === "admin") return Infinity;

  let limit = 1;

  if (user.vip?.isActive) {
    switch (user.vip.type) {
      case "basic": return 3;
      case "advanced": return 5;
      case "premium": return 10;
    }
  }

  return limit;
};

export const getFlashcardLimit = (user) => {
  if (user.role === "admin") return Infinity;

  let limit = 5;

  if (user.vip?.isActive) {
    switch (user.vip.type) {
      case "basic": return 30;
      case "advanced": return 50;
      case "premium": return 70;
    }
  }

  return limit;
};

export const checkLimit = ({ count, limit, type, user }) => {
  if (limit === Infinity) return null;

  if (count >= limit) {
    const isMaxVip = user.vip?.isActive && user.vip.type === "premium";
    if (isMaxVip) return `Bạn đã đạt giới hạn ${limit} ${type} của gói Premium.`;
    return `Bạn đã đạt giới hạn ${limit} ${type}. Nâng cấp VIP để tạo thêm!`;
  }

  return null;
};

// Create flashcard set
export const createSet = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, description } = req.body;

        if (!name) return error(res, 'Tên set là bắt buộc!', 400);
        const user = await User.findById(userId);
        
        const limit = getSetLimit(user);
        const count = await FlashcardSet.countDocuments({ user: userId });
        const limitError = checkLimit({count, limit, type: "bộ flashcard", user});

        if (limitError) return error(res, limitError, 403);
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

// Update flashcard set
export const updateSet = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name?.trim()) {
      return error(res, "Tên bộ flashcard là bắt buộc!", 400);
    }

    const set = await FlashcardSet.findOne({
      _id: id,
      user: userId,
    });

    if (!set) {
      return error(res, "Không tìm thấy bộ flashcard!", 404);
    }

    set.name = name.trim();
    set.description = description?.trim() || "";

    await set.save();

    return success(
      res,
      "Cập nhật bộ flashcard thành công!",
      set
    );
  } catch (err) {
    console.error(err);
    return error(res, "Lỗi khi cập nhật bộ flashcard!");
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
        let limit = getFlashcardLimit(user);
        const limitError = checkLimit({count, limit, type: "flashcard", user});

        if (limitError) return error(res, limitError, 403);

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

// Update flashcard
export const updateFlashcard = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { word, meaning, example, note } = req.body;

    const flashcard = await Flashcard.findOneAndUpdate(
      {
        _id: id,
        user: userId,
      },
      {
        word,
        meaning,
        example,
        note,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!flashcard) return error(res, "Không tìm thấy flashcard!", 404);

    return success(res, "Cập nhật flashcard thành công", flashcard);
  } catch (err) {
    console.error(err);
    return error(res, "Lỗi khi cập nhật flashcard");
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
            return error(res, 'Hiện tại chưa có dữ liệu.');
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

// Import flashcards (Only admin)
export const importFlashcardsJSON = async (req, res) => {
  try {
    if (req.user.role !== "admin") return error(res, "Không có quyền truy cập", 403);
    const userId = req.user.id;
    const { setId, flashcards } = req.body;

    if (!setId || !flashcards || !Array.isArray(flashcards)) return error(res, 'Dữ liệu không hợp lệ', 400);

    let created = 0;
    for (const data of flashcards) {
      if (!data.word || !data.meaning) continue;
      await Flashcard.create({ user: userId, set: setId, ...data });
      created++;
    }

    await FlashcardSet.findByIdAndUpdate(setId, { $inc: { count: created } });
    return success(res, `${created} flashcards đã được import`, flashcards);
  } catch (err) {
    console.error(err);
    return error(res, 'Import flashcard lỗi!');
  }
};

// Bulk create flashcards (user)
export const createFlashcardsBulk = async (req, res) => {
  try {
    const userId = req.user.id;
    const { setId, flashcards } = req.body;

    if (!setId || !Array.isArray(flashcards)) return error(res, "Dữ liệu không hợp lệ", 400);

    const user = await User.findById(userId);

    const set = await FlashcardSet.findOne({ _id: setId, user: userId });
    if (!set) return error(res, "Set không tồn tại!", 404);

    const validCards = flashcards.filter(f => f.word && f.meaning);

    if (validCards.length === 0) return error(res, "Không có flashcard hợp lệ!", 400);

    const count = await Flashcard.countDocuments({ user: userId });
    const limit = getFlashcardLimit(user);

    const remaining = limit - count;
    const isMaxVip = user.vip?.isActive && user.vip.type === "premium";

    if (limit !== Infinity && remaining <= 0) {
      return error(res,
        isMaxVip
          ? `Bạn đã đạt giới hạn ${limit} flashcard của gói Premium.`
          : `Bạn đã đạt giới hạn ${limit} flashcard. Nâng cấp VIP để tạo thêm!`, 403);
    }

    if (limit !== Infinity && validCards.length > remaining)
      return error(res, `Bạn chỉ có thể tạo tối đa ${remaining} flashcard nữa.`, 403);

    const docs = validCards.map(f => ({
      user: userId,
      set: setId,
      word: f.word,
      meaning: f.meaning,
      example: f.example || "",
      note: f.note || ""
    }));

    const createdFlashcards = await Flashcard.insertMany(docs);

    await FlashcardSet.findByIdAndUpdate(setId, {
      $inc: { count: docs.length }
    });

    return success(res, `Đã tạo ${docs.length} flashcards`, createdFlashcards, 201);

  } catch (err) {
    console.error(err);
    return error(res, "Lỗi khi tạo hàng loạt flashcard");
  }
};