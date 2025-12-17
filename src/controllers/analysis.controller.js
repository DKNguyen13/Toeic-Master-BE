import axios from "axios";
import { config } from "../config/env.config.js";

// Bảng dữ liệu chuẩn từ ETS
const TOEIC_CONVERSION_TABLE = `
Số câu đúng | Listening Scaled | Reading Scaled
1 | 5 | 5
2 | 5 | 5
... (thêm full bảng từ source Scribd - tôi paste ngắn gọn, bạn copy full từ log)
100 | 495 | 495
`;

// Mapping TOEIC scores to CEFR levels
const CEFR_MAPPING = `
CEFR | Listening Min | Reading Min | Total Approx | Descriptors
A1 | 60 | 60 | 120-224 | Basic: Understand simple sentences in work contexts.
A2 | 110 | 115 | 225-549 | Elementary: Handle basic workplace interactions.
B1 | 275 | 275 | 550-784 | Intermediate: Manage most situations in English-speaking environments.
B2 | 400 | 385 | 785-944 | Upper-Intermediate: Effective in professional settings.
C1 | 490 | 455 | 945-990 | Advanced: Near-native fluency in complex topics.
`;

// Common weaknesses
const COMMON_ADVICE = `
Nếu Listening < 275: Weak in audio comprehension - Practice short talks, conversations.
Nếu Reading < 275: Weak in grammar/vocab - Focus on incomplete sentences, text completion.
Gợi ý chung: Luyện daily 30min, use ETS sample tests.
`;

export const analyzeResult = async (req, res) => {
  const {
    correctAnswers,
    wrongAnswers,
    skippedQuestions,
    totalQuestions,
    listeningScore,
    readingScore,
  } = req.body;

  try {
    const prompt = ` Bạn là chuyên gia phân tích kết quả TOEIC, hiểu rõ cấu trúc và cách chấm điểm TOEIC. 
      QUY TẮC (bắt buộc):
      - Chỉ phân tích dựa trên các thông tin được cung cấp + BẢNG DỮ LIỆU CHUẨN ETS dưới đây; không suy đoán thêm dữ liệu không có.
      - Tuyệt đối không chèn nội dung thô tục, xúc phạm, quảng cáo hay bình luận về danh tính người học.
      - Không hỏi thêm câu hỏi; không đề xuất dịch vụ/đường link.
      - Trả lời **tiếng Việt** thuần, KHÔNG dùng markdown, không in đậm, không gạch đầu dòng kiểu markdown.
      - Trả lời ngắn gọn, trọng tâm; mỗi phần tối đa ~2–4 câu. Toàn bộ phản hồi không quá 300 từ.
      - Sắp xếp kết quả theo 3 mục rõ ràng (viết có số thứ tự 1→3): điểm mạnh, điểm yếu (cụ thể theo phần), gợi ý cải thiện.

      BẢNG DỮ LIỆU CHUẨN ETS (sử dụng để phân tích, map levels, descriptors):
      ${TOEIC_CONVERSION_TABLE}
      ${CEFR_MAPPING}
      ${COMMON_ADVICE}

      NỘI DUNG (dùng dữ liệu sau để phân tích, kết hợp với bảng trên):
      - Tổng số câu: ${totalQuestions}
      - Đúng: ${correctAnswers}
      - Sai: ${wrongAnswers}
      - Bỏ qua: ${skippedQuestions}
      - Listening: ${listeningScore}/495
      - Reading: ${readingScore}/495

      YÊU CẦU PHÂN TÍCH:
      1. Phân tích tình hình hiện tại theo chuẩn TOEIC/CEFR (rất ngắn, dùng descriptors từ bảng).
      2. Nêu điểm yếu, phân tách rõ Listening / Reading nếu có (dựa trên min scores).
      3. Gợi ý cải thiện cụ thể, thực hành/nguồn học hoặc loại bài nên luyện (mỗi gợi ý 1 câu, từ COMMON_ADVICE). Thêm 1 câu này, bạn có thể tham khảo các gói nâng cấp tài khoản để trải nghiệm nhiều ưu đãi hơn và xem được nhiều bài học mới, tăng số lượng tạo flashcard.
      1 câu động viên khích lệ.

      Chỉ trả về nội dung theo cấu trúc trên, không thêm chú thích, không in thêm meta hoặc JSON.
  `;

    const response = await axios.post(
      "https://ollama.com/api/generate",
      {
        model: `${config.ollama_model}`,
        prompt,
        stream: false
      },
      {
        headers: {
          "Authorization": `Bearer ${config.ollamaApiKey}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.json({ feedback: response.data.response });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "AI analysis failed" });
  }
};