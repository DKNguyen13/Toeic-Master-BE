import { success, error } from "../utils/response.js";
import ListeningQuestion from "../models/fillBlankQuestion.model.js";

// Get all question
export const getAllQuestions = async (req, res) => {
  try {
    const questions = await ListeningQuestion.find().sort({ createdAt: -1 });
    console.log("Questions from DB:", questions);
    return success(res, "Tải tất cả câu hỏi thành công", questions);
  } catch (err) {
    console.error("Error fetching questions:", err);
    return error(res, "Lấy câu hỏi thất bại", 500, err.message);
  }
};

// Get random question
export const getRandomQuestions = async (req, res) => {
  try {
    const { count = 10 } = req.query;
    const questions = await ListeningQuestion.aggregate([
      { $sample: { size: parseInt(count) } }
    ]);
    //console.log("Random questions:", questions);
    return success(res, "Lấy ngẫu nhiên câu hỏi thành công", questions);
  } catch (err) {
    console.error("Error:", err);
    return error(res, "Lấy ngẫu nhiên câu hỏi thất bại", 500, err.message);
  }
};

// Create blank question 
export const createBlankQuestion = async (req, res) => {
  try {
    const { sentence, blanks } = req.body;
    if (!sentence || !blanks || !Array.isArray(blanks)) {
      return error(res, "Câu hỏi và mảng blanks là bắt buộc", 400);
    }
    const newQuestion = await ListeningQuestion.create({ sentence, blanks });
    return success(res, "Tạo câu hỏi thành công", newQuestion, 201);
  } catch (err) {
    return error(res, "Tạo câu hỏi thất bại", 500, err.message);
  }
};

// Update blank question
export const updateBlankQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { sentence, blanks } = req.body;
    const updated = await ListeningQuestion.findByIdAndUpdate(
      id,
      { sentence, blanks },
      { new: true }
    );
    if (!updated) return error(res, "Không tìm thấy câu hỏi", 404);
    return success(res, "Cập nhật câu hỏi thành công", updated);
  } catch (err) {
    return error(res, "Cập nhật câu hỏi thất bại", 500, err.message);
  }
};

// Delete blank question
export const deleteBlankQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ListeningQuestion.findByIdAndDelete(id);
    if (!deleted) return error(res, "Không tìm thấy câu hỏi", 404);
    return success(res, "Xóa câu hỏi thành công", deleted);
  } catch (err) {
    return error(res, "Xóa câu hỏi thất bại", 500, err.message);
  }
};
