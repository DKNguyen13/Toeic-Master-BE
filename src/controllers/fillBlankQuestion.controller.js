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

// Import listening question from excel
export const importListeningQuestions = async (req, res) => {
  try {
    const { questions } = req.body;

    // Validate input
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return error(res, "Dữ liệu không hợp lệ hoặc trống", 400);
    }

    // Check each question
    const validQuestions = [];
    const errors = [];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const idx = i + 1;

      if (!q.sentence || typeof q.sentence !== "string" || q.sentence.trim().length < 10) {
        errors.push(`Câu ${idx}: Câu hỏi không hợp lệ hoặc quá ngắn`);
        continue;
      }

      if (!q.blanks || !Array.isArray(q.blanks) || q.blanks.length === 0) {
        errors.push(`Câu ${idx}: Phải có ít nhất 1 chỗ trống`);
        continue;
      }

      const seenPositions = new Set();
      let hasError = false;

      for (const blank of q.blanks) {
        if (
          typeof blank.position !== "number" ||
          blank.position < 0 ||
          !Number.isInteger(blank.position)
        ) {
          errors.push(`Câu ${idx}: Position phải là số nguyên >= 0`);
          hasError = true;
        }

        if (typeof blank.answer !== "string" || blank.answer.trim() === "") {
          errors.push(`Câu ${idx}: Đáp án không được để trống`);
          hasError = true;
        }

        if (seenPositions.has(blank.position)) {
          errors.push(`Câu ${idx}: Vị trí ${blank.position + 1} bị trùng`);
          hasError = true;
        }

        seenPositions.add(blank.position);
      }

      if (hasError) continue;

      validQuestions.push({
        sentence: q.sentence.trim(),
        blanks: q.blanks.map(b => ({
          position: b.position,
          answer: b.answer.trim().toLowerCase(),
        })),
      });
    }

    if (validQuestions.length === 0) {
      return error(res, "Không có câu hỏi nào hợp lệ để nhập", 400, { errors });
    }

    await ListeningQuestion.deleteMany({});

    const inserted = await ListeningQuestion.insertMany(validQuestions, {
      ordered: false,
    }).catch((err) => {
      if (err.writeErrors) {
        return err.insertedDocs;
      }
      throw err;
    });

    return success(res, `Nhập thành công ${inserted.length} câu hỏi!`, {
      importedCount: inserted.length,
      skippedCount: questions.length - inserted.length,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (err) {
    console.error("Import error:", err);
    return error(res, "Nhập dữ liệu thất bại", 500, err.message);
  }
};