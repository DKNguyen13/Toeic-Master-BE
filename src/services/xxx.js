import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import { writeFile, utils } from 'xlsx';
// Lấy __dirname trong ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const lessonsDir = path.join(__dirname, "../../uploads");  // Điều chỉnh đường dẫn về đúng vị trí thư mục uploads

    const questionsData = [
    {
      sentence: "The train will arrive at the station by 3 PM, and passengers should prepare their tickets.",
      blanks: [
        { position: 1, answer: "train" },
        { position: 10, answer: "prepare" }
      ]
    },
    {
      sentence: "Please submit the documents before the deadline tomorrow morning.",
      blanks: [
        { position: 1, answer: "submit" },
        { position: 7, answer: "deadline" }
      ]
    },
    {
      sentence: "She enjoys reading books in the library during the quiet afternoons.",
      blanks: [
        { position: 2, answer: "reading" },
        { position: 5, answer: "library" }
      ]
    },
    {
      sentence: "The company will announce the results of the project next Monday.",
      blanks: [
        { position: 4, answer: "results" },
        { position: 7, answer: "project" }
      ]
    },
    {
      sentence: "Students must complete their assignments and submit them on time.",
      blanks: [
        { position: 3, answer: "assignments" },
        { position: 6, answer: "submit" }
      ]
    },
    {
      sentence: "He bought a new laptop to improve his productivity and work efficiency.",
      blanks: [
        { position: 3, answer: "laptop" },
        { position: 9, answer: "productivity" }
      ]
    },
    {
      sentence: "Traveling abroad requires a valid passport and proper visa documentation.",
      blanks: [
        { position: 2, answer: "passport" },
        { position: 6, answer: "visa" }
      ]
    },
    {
      sentence: "The chef prepared a delicious meal for all the guests at the restaurant.",
      blanks: [
        { position: 2, answer: "prepared" },
        { position: 7, answer: "guests" }
      ]
    },
    {
      sentence: "The manager will review the sales report before the meeting.",
      blanks: [
        { position: 3, answer: "review" },
        { position: 5, answer: "report" }
      ]
    },
    {
      sentence: "Our company plans to expand into international markets next year.",
      blanks: [
        { position: 4, answer: "expand" },
        { position: 6, answer: "markets" }
      ]
    },
    {
      sentence: "She always arrives early to prepare for her classes.",
      blanks: [
        { position: 2, answer: "arrives" },
        { position: 6, answer: "prepare" }
      ]
    },
    {
      sentence: "The technician fixed the computer before the client arrived.",
      blanks: [
        { position: 2, answer: "fixed" },
        { position: 7, answer: "arrived" }
      ]
    },
    {
      sentence: "Employees are required to wear their ID badges at all times.",
      blanks: [
        { position: 5, answer: "wear" },
        { position: 7, answer: "badges" }
      ]
    },
    {
      sentence: "We need to schedule a meeting to discuss the project timeline.",
      blanks: [
        { position: 3, answer: "schedule" },
        { position: 8, answer: "timeline" }
      ]
    },
    {
      sentence: "The teacher asked the students to complete their homework before Friday.",
      blanks: [
        { position: 4, answer: "complete" },
        { position: 7, answer: "homework" }
      ]
    },
    {
      sentence: "The new policy will affect all employees starting next month.",
      blanks: [
        { position: 3, answer: "affect" },
        { position: 6, answer: "employees" }
      ]
    },
    {
      sentence: "He organized a team-building event to boost morale.",
      blanks: [
        { position: 2, answer: "organized" },
        { position: 7, answer: "morale" }
      ]
    },
    {
      sentence: "Please ensure that all the files are backed up before leaving.",
      blanks: [
        { position: 4, answer: "files" },
        { position: 7, answer: "backed" }
      ]
    },
    {
      sentence: "The customer service representative answered all questions politely.",
      blanks: [
        { position: 4, answer: "answered" },
        { position: 6, answer: "questions" }
      ]
    },
    {
      sentence: "We should analyze the data carefully to make accurate predictions.",
      blanks: [
        { position: 2, answer: "analyze" },
        { position: 8, answer: "predictions" }
      ]
    },
    {
      sentence: "The software update improved the system's security and stability.",
      blanks: [
        { position: 3, answer: "improved" },
        { position: 7, answer: "security" }
      ]
    },
    {
      sentence: "He was promoted to senior manager due to his excellent performance.",
      blanks: [
        { position: 4, answer: "promoted" },
        { position: 8, answer: "performance" }
      ]
    },
    {
      sentence: "The marketing team launched a new campaign last week.",
      blanks: [
        { position: 3, answer: "launched" },
        { position: 6, answer: "campaign" }
      ]
    },
    {
      sentence: "Please submit your application before the deadline ends.",
      blanks: [
        { position: 2, answer: "submit" },
        { position: 6, answer: "deadline" }
      ]
    },
    {
      sentence: "The flight was delayed due to bad weather conditions.",
      blanks: [
        { position: 3, answer: "delayed" },
        { position: 7, answer: "weather" }
      ]
    },
    {
      sentence: "She decided to attend the conference in New York next month.",
      blanks: [
        { position: 3, answer: "attend" },
        { position: 7, answer: "conference" }
      ]
    },
    {
      sentence: "The IT department installed new software on all company computers.",
      blanks: [
        { position: 3, answer: "installed" },
        { position: 9, answer: "computers" }
      ]
    },
    {
      sentence: "Employees must follow the safety regulations at the workplace.",
      blanks: [
        { position: 3, answer: "follow" },
        { position: 7, answer: "regulations" }
      ]
    },
    {
      sentence: "The manager held a meeting to discuss the quarterly budget.",
      blanks: [
        { position: 3, answer: "held" },
        { position: 8, answer: "budget" }
      ]
    },
    {
      sentence: "Students should review their notes before taking the final exam.",
      blanks: [
        { position: 2, answer: "review" },
        { position: 8, answer: "exam" }
      ]
    },
    {
      sentence: "The accountant prepared the financial report for the board meeting.",
      blanks: [
        { position: 2, answer: "prepared" },
        { position: 6, answer: "report" }
      ]
    },
    {
      sentence: "Our team plans to expand our business into new regions.",
      blanks: [
        { position: 4, answer: "expand" },
        { position: 8, answer: "regions" }
      ]
    },
    {
      sentence: "Please confirm your attendance by replying to this email.",
      blanks: [
        { position: 1, answer: "confirm" },
        { position: 6, answer: "replying" }
      ]
    },
    {
      sentence: "The manager emphasized the importance of punctuality for all staff.",
      blanks: [
        { position: 3, answer: "emphasized" },
        { position: 7, answer: "punctuality" }
      ]
    },
    {
      sentence: "He purchased new office supplies for the upcoming project.",
      blanks: [
        { position: 2, answer: "purchased" },
        { position: 6, answer: "project" }
      ]
    },
    {
      sentence: "The receptionist greeted visitors and provided necessary information.",
      blanks: [
        { position: 2, answer: "greeted" },
        { position: 6, answer: "information" }
      ]
    },
    {
      sentence: "Employees are encouraged to attend workshops for professional growth.",
      blanks: [
        { position: 3, answer: "attend" },
        { position: 8, answer: "growth" }
      ]
    },
    {
      sentence: "The IT team resolved the network issues within a few hours.",
      blanks: [
        { position: 3, answer: "resolved" },
        { position: 5, answer: "network" }
      ]
    },
    {
      sentence: "She prepared a detailed presentation for the annual conference.",
      blanks: [
        { position: 2, answer: "prepared" },
        { position: 8, answer: "conference" }
      ]
    },
    {
      sentence: "The project manager monitored the progress of all ongoing tasks.",
      blanks: [
        { position: 3, answer: "monitored" },
        { position: 8, answer: "tasks" }
      ]
    },
    {
      sentence: "Please make sure to submit all forms before the office closes.",
      blanks: [
        { position: 6, answer: "submit" },
        { position: 9, answer: "closes" }
      ]
    },
    {
      sentence: "He attended the training session to improve his technical skills.",
      blanks: [
        { position: 2, answer: "attended" },
        { position: 9, answer: "skills" }
      ]
    }
    ];
// Tạo dữ liệu cho file Excel
const generateExcelData = () => {
  return questionsData.map((item, idx) => {
    // Tạo các cột Blank 1, Blank 2,... cho từng câu hỏi
    const blanks = {};
    item.blanks.forEach((b, index) => {
      blanks[`Blank ${index + 1}`] = `${b.position}: ${b.answer}`;
    });

    // Thêm các cột còn lại nếu câu hỏi ít blanks hơn
    for (let i = item.blanks.length; i < 10; i++) {
      blanks[`Blank ${i + 1}`] = ''; // Nếu ít hơn 10 blank, fill bằng chuỗi rỗng
    }

    return {
      STT: idx + 1,
      "Câu hỏi": item.sentence,
      ...blanks, // Spread các cột blank vào đối tượng kết quả
    };
  });
};

// Hàm tạo file Excel và lưu vào thư mục
export const generateExcelFile = async () => {
  try {
    // Dữ liệu sẽ được chuyển đổi thành Excel
    const excelData = generateExcelData();
    const ws = utils.json_to_sheet(excelData);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Questions");

    // Tạo tên file dựa trên thời gian hiện tại
    const fileName = `questions-${Date.now()}.xlsx`;
    const filePath = path.join(lessonsDir, fileName);

    // Ghi file vào thư mục uploads
    writeFile(wb, filePath);

    console.log(`File Excel đã được tạo tại: ${filePath}`);

    // Trả về đường dẫn đến file Excel
    return filePath;
  } catch (error) {
    console.error("Lỗi khi tạo file Excel:", error);
    throw new Error("Không thể tạo file Excel");
  }
};
