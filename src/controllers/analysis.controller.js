import axios from "axios";
import { config } from "../config/env.config.js"; // config.ollamaApiKey

export const analyzeResult = async (req, res) => {
  const {
    correctAnswers,
    wrongAnswers,
    skippedQuestions,
    totalQuestions,
    listeningScore,
    readingScore,
    history,
  } = req.body;

  try {
    const prompt = ` Bạn là chuyên gia phân tích kết quả TOEIC, hiểu rõ cấu trúc và cách chấm điểm TOEIC. 
      QUY TẮC (bắt buộc):
      - Chỉ phân tích dựa trên các thông tin được cung cấp; không suy đoán thêm dữ liệu không có.
      - Tuyệt đối không chèn nội dung thô tục, xúc phạm, quảng cáo hay bình luận về danh tính người học.
      - Không hỏi thêm câu hỏi; không đề xuất dịch vụ/đường link.
      - Trả lời **tiếng Việt** thuần, KHÔNG dùng markdown, không in đậm, không gạch đầu dòng kiểu markdown.
      - Trả lời ngắn gọn, trọng tâm; mỗi phần tối đa ~2–4 câu. Toàn bộ phản hồi không quá 300 từ.
      - Sắp xếp kết quả theo 3 mục rõ ràng (viết có số thứ tự 1→3): điểm mạnh, điểm yếu (cụ thể theo phần), gợi ý cải thiện.

      NỘI DUNG (dùng dữ liệu sau để phân tích):
      - Tổng số câu: ${totalQuestions}
      - Đúng: ${correctAnswers}
      - Sai: ${wrongAnswers}
      - Bỏ qua: ${skippedQuestions}
      - Listening: ${listeningScore}/495
      - Reading: ${readingScore}/495
      Lịch sử làm bài: ${history ?? "Không có"}

      YÊU CẦU PHÂN TÍCH:
      1. Phân tích tình hình hiện tại theo chuẩn TOEIC (rất ngắn).
      2. Nêu điểm yếu, phân tách rõ Listening / Reading nếu có.
      3. Gợi ý cải thiện cụ thể, thực hành/nguồn học hoặc loại bài nên luyện (mỗi gợi ý 1 câu). Thêm 1 câu này, bạn có thể tham khảo các gói nâng cấp tài khoản để trải nghiệm nhiều ưu đãi hơn và xem được nhiều bài học mới, tăng số lượng tạo flashcard.
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
