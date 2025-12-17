import axios from "axios";
import { config } from "../config/env.config.js";

// Bảng dữ liệu chuẩn từ ETS
const TOEIC_CONVERSION_TABLE = `
Số câu đúng | Listening Scaled | Reading Scaled
0 | 0 | 0
1 | 15 | 5
2 | 20 | 5
3 | 25 | 10
4 | 30 | 15
5 | 35 | 20
6 | 40 | 25
7 | 45 | 30
8 | 50 | 35
9 | 55 | 40
10 | 60 | 45
11 | 65 | 50
12 | 70 | 55
13 | 75 | 60
14 | 80 | 65
15 | 85 | 70
16 | 90 | 75
17 | 95 | 80
18 | 100 | 85
19 | 105 | 90
20 | 110 | 95
21 | 115 | 100
22 | 120 | 105
23 | 125 | 110
24 | 130 | 115
25 | 135 | 120
26 | 140 | 125
27 | 145 | 130
28 | 150 | 135
29 | 155 | 140
30 | 160 | 145
31 | 165 | 150
32 | 170 | 155
33 | 175 | 160
34 | 180 | 165
35 | 185 | 170
36 | 190 | 175
37 | 195 | 180
38 | 200 | 185
39 | 205 | 190
40 | 210 | 195
41 | 215 | 200
42 | 220 | 205
43 | 225 | 210
44 | 230 | 215
45 | 235 | 220
46 | 240 | 225
47 | 245 | 230
48 | 250 | 235
49 | 255 | 240
50 | 260 | 245
51 | 265 | 250
52 | 270 | 255
53 | 275 | 260
54 | 280 | 265
55 | 285 | 270
56 | 290 | 275
57 | 295 | 280
58 | 300 | 285
59 | 305 | 290
60 | 310 | 295
61 | 315 | 300
62 | 320 | 305
63 | 325 | 310
64 | 330 | 315
65 | 335 | 320
66 | 340 | 325
67 | 345 | 330
68 | 350 | 335
69 | 355 | 340
70 | 360 | 345
71 | 365 | 350
72 | 370 | 355
73 | 375 | 360
74 | 380 | 365
75 | 385 | 370
76 | 395 | 375
77 | 400 | 380
78 | 405 | 385
79 | 410 | 390
80 | 415 | 395
81 | 420 | 400
82 | 425 | 405
83 | 430 | 410
84 | 435 | 415
85 | 440 | 420
86 | 445 | 425
87 | 450 | 430
88 | 455 | 435
89 | 460 | 440
90 | 465 | 445
91 | 470 | 450
92 | 475 | 455
93 | 480 | 460
94 | 485 | 465
95 | 490 | 470
96 | 495 | 475
97 | 495 | 480
98 | 495 | 485
99 | 495 | 490
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
    summary,
    isFullTest,
    answers
  } = req.body;

  if (!summary) {
    return res.status(400).json({ message: "Thiếu summary" });
  }

  if (!Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ message: "Danh sách answers không hợp lệ" });
  }

  const partStats = {};

  answers.forEach(a => {
    if (!partStats[a.part]) {
      partStats[a.part] = {
        total: 0,
        wrong: 0,
        skipped: 0
      };
    }

    partStats[a.part].total ++;

    if (a.isSkipped) {
      partStats[a.part].skipped ++;
    } else if (a.selectedAnswer !== a.correctAnswer) {
      partStats[a.part].wrong ++;
    }
  });

  try {
    const prompt = ` Bạn là chuyên gia phân tích kết quả TOEIC, hiểu rõ cấu trúc và cách chấm điểm TOEIC. 
      QUY TẮC (bắt buộc):
      - Chỉ phân tích dựa trên các thông tin được cung cấp + BẢNG DỮ LIỆU CHUẨN ETS dưới đây; không suy đoán thêm dữ liệu không có.
      - Tuyệt đối không chèn nội dung thô tục, xúc phạm, quảng cáo hay bình luận về danh tính người học.
      - Không hỏi thêm câu hỏi; không đề xuất dịch vụ/đường link.
      - Trả lời **tiếng Việt** thuần, KHÔNG dùng markdown, không in đậm, không gạch đầu dòng kiểu markdown.
      - Với mỗi mục thì nên tóm tắt ngắn gọn, dễ hiểu và xuống dòng chứ thành 1 đoạn.
      - Trả lời ngắn gọn, trọng tâm; mỗi phần tối đa ~2–4 câu. Toàn bộ phản hồi không quá 300 từ.
      - Sắp xếp kết quả theo 3 mục rõ ràng (viết có số thứ tự 1→3): điểm mạnh, điểm yếu (cụ thể theo phần), gợi ý cải thiện.

      BẢNG DỮ LIỆU CHUẨN ETS (sử dụng để phân tích, map levels, descriptors):
      ${TOEIC_CONVERSION_TABLE}
      ${CEFR_MAPPING}
      ${COMMON_ADVICE}

      KẾT QUẢ TỔNG QUAN: (dùng dữ liệu sau để phân tích, kết hợp với bảng trên):
      - Tổng số câu: ${summary.totalQuestions}
      - Đúng: ${summary.correctAnswers}
      - Sai: ${summary.wrongAnswers}
      - Bỏ qua: ${summary.skippedQuestions}
      - Listening: ${summary.listeningScore}/495
      - Reading: ${summary.readingScore}/495

      PHÂN TÍCH THEO PART (số liệu thật):
      ${Object.entries(partStats)
        .map(
          ([part, s]) =>
            `Part ${part}: ${s.total} câu, sai ${s.wrong}, bỏ qua ${s.skipped}`
        )
        .join("\n")}

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