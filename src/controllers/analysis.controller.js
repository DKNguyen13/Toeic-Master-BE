import axios from "axios";
import { config } from "../config/env.config.js";

// Official ETS CEFR mapping
const ETS_CEFR_MAPPING = {
  listening: {
    C1: 490,
    B2: 400,
    B1: 275,
    A2: 110,
    A1: 60
  },
  reading: {
    C1: 455,
    B2: 385,
    B1: 275,
    A2: 115,
    A1: 60
  }
};

const OFFICIAL_CEFR_GUIDELINES = `
Theo bảng mapping ETS TOEIC-CEFR chính thức (minimum scores cho mỗi level):
LISTENING (5-495):
+ C1: từ 490 điểm
+ B2: từ 400 điểm
+ B1: từ 275 điểm
+ A2: từ 110 điểm
+ A1: từ 60 điểm
READING (5-495):
+ C1: từ 455 điểm
+ B2: từ 385 điểm
+ B1: từ 275 điểm
+ A2: từ 115 điểm
+ A1: từ 60 điểm
Can-do descriptors theo section score (dựa ETS Score Descriptors):
Listening 400+: Hiểu rõ đa số chi tiết hội thoại công việc, infer được ý định và mục đích người nói.
Listening 275-399: Hiểu ý chính trong tình huống quen thuộc, nắm được context cơ bản.
Listening dưới 275: Nhận diện được thông tin đơn giản, cần luyện thêm ngữ cảnh phức tạp.
Reading 385+: Hiểu sâu văn bản nghiệp vụ, xử lý thông tin phức tạp, infer ý định tác giả.
Reading 275-384: Đọc hiểu tài liệu công việc cơ bản, nắm ý chính trong văn bản rõ ràng.
Reading dưới 275: Hiểu câu và đoạn đơn giản, cần nâng cao vocabulary và grammar.
`;

// Calculate CEFR level for a section
const calculateSectionCEFR = (score, section) => {
  const mapping = ETS_CEFR_MAPPING[section];
  if (!mapping || score === undefined || score === null) return "N/A";

  if (score >= mapping.C1) return "C1";
  if (score >= mapping.B2) return "B2";
  if (score >= mapping.B1) return "B1";
  if (score >= mapping.A2) return "A2";
  if (score >= mapping.A1) return "A1";
  return "Pre-A1";
};

// Calculate overall CEFR (lower of the two sections)
const calculateOverallCEFR = (listeningScore, readingScore) => {
  const listeningCEFR = calculateSectionCEFR(listeningScore, 'listening');
  const readingCEFR = calculateSectionCEFR(readingScore, 'reading');

  const levels = ["Pre-A1", "A1", "A2", "B1", "B2", "C1"];
  const listeningIndex = levels.indexOf(listeningCEFR);
  const readingIndex = levels.indexOf(readingCEFR);

  return levels[Math.min(listeningIndex, readingIndex)];
};

export const analyzeResult = async (req, res) => {
  const { summary, isFullTest, answers } = req.body;

  // Validation
  if (!summary) return res.status(400).json({ message: "Thiếu summary" });
  if (!Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ message: "Danh sách answers không hợp lệ" });
  }

  // Tính tổng số câu đúng từ answers (an toàn)
  const totalCorrect = answers.filter(a => 
    !a.isSkipped && a.selectedAnswer === a.correctAnswer
  ).length;

  const totalQuestions = answers.length;

  // Tính accuracy Listening và Reading
  const listeningParts = [1, 2, 3, 4];
  const readingParts = [5, 6, 7];

  const listeningCorrect = answers.filter(a => 
    listeningParts.includes(a.part) && 
    !a.isSkipped && 
    a.selectedAnswer === a.correctAnswer
  ).length;

  const listeningTotal = answers.filter(a => listeningParts.includes(a.part)).length;

  const readingCorrect = answers.filter(a => 
    readingParts.includes(a.part) && 
    !a.isSkipped && 
    a.selectedAnswer === a.correctAnswer
  ).length;

  const readingTotal = answers.filter(a => readingParts.includes(a.part)).length;

  const listeningAccuracy = listeningTotal > 0 
    ? Math.round((listeningCorrect / listeningTotal) * 100) 
    : 0;

  const readingAccuracy = readingTotal > 0 
    ? Math.round((readingCorrect / readingTotal) * 100) 
    : 0;

  // Calculate scores
  const totalScaled = (summary.listeningScore || 0) + (summary.readingScore || 0);
  const listeningCEFR = calculateSectionCEFR(summary.listeningScore, 'listening');
  const readingCEFR = calculateSectionCEFR(summary.readingScore, 'reading');
  const overallCEFR = calculateOverallCEFR(summary.listeningScore, summary.readingScore);

  try {
    const prompt = `Bạn là chuyên gia phân tích TOEIC, sử dụng CHÍNH XÁC dữ liệu thực tế và bảng mapping ETS chính thức.
QUY TẮC BẮT BUỘC:
- CHỈ dùng scaled scores có sẵn và bảng mapping ETS chính thức
- KHÔNG đề cập đến bất kỳ Part nào (Part 1-7)
- KHÔNG bịa thêm con số hay claim nào
- KHÔNG quảng cáo, link, dịch vụ hay file tải về
- Giọng điệu: tích cực, khích lệ, chuyên nghiệp
- Ngôn ngữ: Tiếng Việt thuần túy, không markdown heading, không **bold**
- Cấu trúc: 3 mục đánh số rõ ràng

CẤU TRÚC PHÂN TÍCH:
1. ƯU ĐIỂM (chi tiết và cụ thể):
+ Listening: ${summary.listeningScore}/495 (CEFR: ${listeningCEFR}) - độ chính xác khoảng ${listeningAccuracy}%
+ Reading: ${summary.readingScore}/495 (CEFR: ${readingCEFR}) - độ chính xác khoảng ${readingAccuracy}%
+ Tổng điểm: ${totalScaled}/990 (CEFR tổng thể: ${overallCEFR})
+ Tổng câu đúng: ${totalCorrect}/${totalQuestions}

2. NHƯỢC ĐIỂM (khách quan, tập trung vào cơ hội cải thiện):
+ Listening và Reading đang ở giai đoạn khởi đầu ${listeningCEFR === readingCEFR ? '- đây là cơ hội tuyệt vời để xây dựng nền tảng vững chắc từ đầu' : 
  summary.listeningScore < summary.readingScore 
    ? '- Listening có nhiều tiềm năng tiến bộ nhanh để cân bằng với Reading' 
    : '- Reading có nhiều tiềm năng tiến bộ nhanh để cân bằng với Listening'}

3. GỢI Ý CẢI THIỆN VÀ NHẬN XÉT:
Lộ trình học tập 30 ngày tiếp theo:
+ Tuần 1-2: Tập trung cải thiện kỹ năng yếu hơn - luyện 60 phút/ngày với ETS official materials
+ Mỗi ngày học 15-20 từ vựng TOEIC mới (từ bài đọc, câu sai, hoặc sách ETS)
+ Tuần 3: Làm 1-2 full tests, review kỹ câu sai và ghi lại từ vựng chưa biết
+ Tuần 4: Luyện tổng hợp, ôn lại từ vựng đã học qua flashcard hoặc ngữ cảnh
${summary.listeningScore < 275 ? '+ Listening bổ sung: Nghe podcast/business news 20 phút/ngày, luyện shadowing và note từ mới' : '+ Listening bổ sung: Nghe thêm tài liệu thực tế 20 phút/ngày để củng cố'}
${summary.readingScore < 275 ? '+ Reading bổ sung: Đọc bài báo kinh doanh 20-30 phút/ngày, chú ý tra và ghi nhớ từ vựng chuyên ngành' : '+ Reading bổ sung: Đọc thêm văn bản nghiệp vụ để mở rộng từ vựng và tốc độ đọc'}
+ Xây dựng thói quen học từ vựng bền vững: học qua ngữ cảnh, ôn lại theo phương pháp spaced repetition
Mục tiêu khả thi trong 3 tháng:
+ Từ ${overallCEFR} hiện tại, hướng tới ${
  overallCEFR === 'C1' ? 'C1 cao điểm (900+)' :
  overallCEFR === 'B2' ? 'C1 (Listening ≥490, Reading ≥455)' :
  overallCEFR === 'B1' ? 'B2 (Listening ≥400, Reading ≥385)' :
  overallCEFR === 'A2' ? 'B1 (Listening ≥275, Reading ≥275)' :
  'A2 trở lên'
}
+ Tăng khoảng ${Math.max(0, 850 - totalScaled)} điểm để đạt mốc 850 phổ biến ở doanh nghiệp
+ Nâng vốn từ vựng TOEIC lên thêm 800-1000 từ phổ biến nhất
Đánh giá tiềm năng:
+ ${totalScaled >= 700 ? 'Bạn đã có nền tảng rất vững, chỉ cần duy trì và mở rộng từ vựng là có thể đạt 900+' :
     totalScaled >= 500 ? 'Nền tảng tốt, kết hợp học từ vựng đều đặn sẽ giúp tăng điểm nhanh' :
     totalScaled >= 300 ? 'Đang tiến bộ rõ rệt, học từ vựng mỗi ngày sẽ tạo bước ngoặt lớn' :
     'Bạn đang bắt đầu rất tốt, việc học từ vựng đều đặn sẽ mang lại kết quả rõ rệt'}

THÔNG TIN ETS CHÍNH THỨC:
${OFFICIAL_CEFR_GUIDELINES}

YÊU CẦU ĐỊNH DẠNG:
- Mỗi ý bắt đầu bằng dấu +
- Câu ngắn gọn, dễ đọc
- Giọng điệu khích lệ, tích cực
- Kết thúc bằng 2-3 câu động viên mạnh mẽ, chân thành

Hãy viết phân tích dựa hoàn toàn vào dữ liệu trên, không thêm thông tin ngoài.`;

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
        },
        timeout: 60000
      }
    );

    if (!response.data || !response.data.response) {
      throw new Error("Invalid AI response");
    }

    res.json({
      feedback: response.data.response.trim(),
      metadata: {
        overallCEFR,
        listeningCEFR,
        readingCEFR,
        totalScore: totalScaled,
        listeningScore: summary.listeningScore || 0,
        readingScore: summary.readingScore || 0,
        listeningAccuracy,
        readingAccuracy,
        totalCorrect,
        totalQuestions
      }
    });
  } catch (err) {
    console.error("AI Analysis Error:", err.message);
    res.status(500).json({
      message: "Phân tích AI thất bại",
      error: err.message
    });
  }
};