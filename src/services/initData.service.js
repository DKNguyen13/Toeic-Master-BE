import fs from "fs";
import path from "path";
import bcrypt from 'bcryptjs';
import mongoose from "mongoose";
import User from "../models/user.model.js";
import Lesson from "../models/lesson.model.js";
import Flashcard from "../models/flashcard.model.js";
import VipPackage from "../models/vipPackage.model.js";
import { syncUsersToMeili } from "../utils/meiliSync.js";
import PaymentOrder from "../models/paymentOrder.model.js";
import FlashcardSet from "../models/flashcardSet.model.js";
import ScoreMapping from "../models/scoreMapping.model.js";
import { estimateScore } from "../services/score.service.js";
import NotificationService from "../services/notification.service.js";

const __dirname = path.resolve();

// Sync mail
export const syncMeiliUsersOnce = async () => {
  try {
    console.log("Syncing existing users to Meilisearch...");
    await syncUsersToMeili();
    console.log("Meilisearch sync complete!");
  } catch (err) {
    console.error("Error syncing Meilisearch:", err);
  }
};

// Test VIP expiry notification
export const testVIPExpiryNotification = async (notificationService) => {
  try{
    console.log('Testing VIP expiry notifications...');
    await notificationService.sendVIPExpiryNotification();
  }
  catch (err){
    console.error("Error test notification:", err);
  }

};

// Seed revenue
export const seedRevenue = async () => {
  const count = await PaymentOrder.countDocuments();
  if (count > 0) {
    console.log("PaymentOrders already exist, skip seeding...");
    return;
  }

  const fakeOrders = [];

  for (let year of [2023, 2024, 2025]) {
    for (let month = 1; month <= 12; month++) {
      const orderCount = Math.floor(Math.random() * 8) + 3; // 3-10 orders / tháng

      for (let i = 0; i < orderCount; i++) {
        const price = [249000, 399000, 599000][Math.floor(Math.random() * 3)];

        fakeOrders.push({
          orderId: new mongoose.Types.ObjectId().toString(), // random id
          userId: new mongoose.Types.ObjectId(),             // fake user
          packageId: new mongoose.Types.ObjectId(),          // fake package
          pricePaid: price,
          status: "success",
          isActive: true,
          startDate: new Date(year, month - 1, 1),
          endDate: new Date(year, month - 1, 28),
          createdAt: new Date(year, month - 1, Math.floor(Math.random() * 28) + 1),
          updatedAt: new Date(year, month - 1, Math.floor(Math.random() * 28) + 1),
        });
      }
    }
  }

  await PaymentOrder.insertMany(fakeOrders);
  console.log(`Seeded ${fakeOrders.length} fake PaymentOrders`);
};

//Create admin if not exist
export const createAdminIfNotExist = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin@', 10);
      const admin = new User({
        fullname: 'Super Admin',
        email: 'admin@admin.com',
        password: hashedPassword,
        phone: '0123456789',
        role: 'admin',
        isActive: true
      });
      await admin.save();
      console.log('Admin mặc định đã được tạo: admin@admin.com / admin@');
    } else {
      console.log('Admin đã tồn tại, không cần tạo lại.');
    }
  } catch (err) {
    console.error('Lỗi khi tạo admin mặc định:', err);
  }
};

//Auto seed packages if not exist
export const seedPackages = async () => {
  const packages = [
    {
      name: "Basic",
      durationMonths: 1,
      originalPrice: 199000,
      discountedPrice: 99000,
      description: "Truy cập cơ bản, giới hạn flashcard và tính năng. Phù hợp cho người mới bắt đầu.",
      type: "basic",
    },
    {
      name: "Advanced",
      durationMonths: 6,
      originalPrice: 599000,
      discountedPrice: 399000,
      description: "Toàn bộ bài học và luyện tập nâng cao. Tạo tối đa 500 flashcard, phù hợp người học trung cấp.",
      type: "advanced",
    },
    {
      name: "Premium",
      durationMonths: 12,
      originalPrice: 999000,
      discountedPrice: 699000,
      description: "Truy cập không giới hạn tất cả tính năng, ưu tiên VIP, tạo tối đa 1000 flashcard. Dành cho học chuyên sâu.",
      type: "premium",
    },
  ];

  for (const pkg of packages) {
    const exists = await VipPackage.findOne({ type: pkg.type });
    if (!exists) await VipPackage.create(pkg);
  }
};

// Seed flash card
export const seedFlashcards = async () => {
  try {
    // Lấy admin
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log("Admin không tồn tại, vui lòng chạy createAdminIfNotExist trước.");
      return;
    }
    const adminId = admin._id;
    const existingSets = await FlashcardSet.countDocuments();
    if (existingSets > 0) {
      console.log("Flashcard sets đã tồn tại, bỏ qua seed flashcards.");
      return;
    }

    const topics = [
    {
      name: "Business Vocabulary",
      description: "Important words for business contexts.",
      words: [
        { word: "appointment", meaning: "Cuộc hẹn", example: "I have an appointment with the manager at 10 am." },
        { word: "contract", meaning: "Hợp đồng", example: "The company signed a new contract with the supplier." },
        { word: "invoice", meaning: "Hóa đơn", example: "Please send me the invoice for last month's order." },
        { word: "conference", meaning: "Hội nghị", example: "The annual sales conference is next week." },
        { word: "promotion", meaning: "Thăng chức / Khuyến mãi", example: "She received a promotion to team leader." },
        { word: "negotiation", meaning: "Đàm phán", example: "The negotiation lasted all afternoon." },
        { word: "proposal", meaning: "Đề xuất", example: "He submitted a proposal for the new project." },
        { word: "client", meaning: "Khách hàng", example: "The client requested changes to the contract." },
        { word: "strategy", meaning: "Chiến lược", example: "We need a new marketing strategy." },
        { word: "budget", meaning: "Ngân sách", example: "We need to stick to the budget." },
        { word: "deadline", meaning: "Hạn chót", example: "The report deadline is Friday." },
        { word: "task", meaning: "Nhiệm vụ", example: "Complete this task before leaving." },
        { word: "teamwork", meaning: "Làm việc nhóm", example: "Good teamwork leads to success." },
        { word: "report", meaning: "Báo cáo", example: "Please submit the report by Tuesday." },
        { word: "schedule", meaning: "Lịch trình", example: "Check your schedule before booking." },
        { word: "meeting", meaning: "Cuộc họp", example: "The weekly meeting is scheduled for Monday." },
        { word: "clientele", meaning: "Khách hàng thân thiết", example: "Our clientele expects high-quality service." },
        { word: "revenue", meaning: "Doanh thu", example: "Revenue increased by 10% last quarter." },
        { word: "expense", meaning: "Chi phí", example: "Travel expenses will be reimbursed." },
        { word: "profit", meaning: "Lợi nhuận", example: "The company reported a profit this year." },
        { word: "loss", meaning: "Lỗ", example: "The company suffered a loss due to market decline." },
        { word: "shareholder", meaning: "Cổ đông", example: "Shareholders attended the annual meeting." },
        { word: "investment", meaning: "Khoản đầu tư", example: "The company made a new investment in technology." },
        { word: "market", meaning: "Thị trường", example: "Our product is targeted at the global market." },
        { word: "stock", meaning: "Cổ phiếu", example: "The stock price increased after the announcement." },
        { word: "profit margin", meaning: "Biên lợi nhuận", example: "We aim to increase our profit margin." },
        { word: "merger", meaning: "Sáp nhập", example: "The merger of the two companies was finalized." },
        { word: "acquisition", meaning: "Mua lại", example: "The acquisition will expand our market share." },
        { word: "policy", meaning: "Chính sách", example: "Company policy requires ID badges." },
        { word: "procedure", meaning: "Thủ tục", example: "Follow the proper procedure when submitting forms." },
        { word: "agenda", meaning: "Chương trình / Lịch trình họp", example: "The meeting agenda was sent to all staff." },
        { word: "presentation", meaning: "Bài thuyết trình", example: "She gave an impressive presentation on sales trends." },
        { word: "feedback", meaning: "Phản hồi", example: "We value customer feedback." },
        { word: "reporting", meaning: "Báo cáo", example: "The reporting process takes two weeks." },
        { word: "supervisor", meaning: "Người giám sát", example: "Contact your supervisor for guidance." },
        { word: "manager", meaning: "Quản lý", example: "The manager approved the budget." },
        { word: "employee", meaning: "Nhân viên", example: "Employees must complete mandatory training." },
        { word: "staff", meaning: "Nhân viên", example: "The office has a staff of 50 people." },
        { word: "department", meaning: "Phòng ban", example: "The marketing department launched a new campaign." },
        { word: "recruitment", meaning: "Tuyển dụng", example: "The HR department manages recruitment." },
        { word: "interview", meaning: "Phỏng vấn", example: "He has an interview scheduled tomorrow." },
        { word: "candidate", meaning: "Ứng viên", example: "The candidate has excellent qualifications." },
        { word: "training", meaning: "Đào tạo", example: "Employees attend training sessions weekly." },
        { word: "seminar", meaning: "Hội thảo", example: "The seminar covered financial topics." },
        { word: "workshop", meaning: "Buổi hội thảo thực hành", example: "She attended a workshop on negotiation skills." },
        { word: "deadline extension", meaning: "Gia hạn hạn chót", example: "They requested a deadline extension." },
        { word: "audit", meaning: "Kiểm toán", example: "The company passed the financial audit." },
        { word: "compliance", meaning: "Tuân thủ", example: "Ensure compliance with regulations." },
        { word: "contractor", meaning: "Nhà thầu", example: "The contractor completed the project on time." },
        { word: "supplier", meaning: "Nhà cung cấp", example: "We have a reliable supplier for materials." },
        { word: "inventory", meaning: "Hàng tồn kho", example: "Inventory must be checked regularly." },
        { word: "shipment", meaning: "Lô hàng", example: "The shipment arrived on time." }
      ]
    },
    {
      name: "Travel & Transportation",
      description: "TOEIC words related to travel and transport.",
      words: [
        { word: "airport", meaning: "Sân bay", example: "We arrived at the airport early." },
        { word: "flight", meaning: "Chuyến bay", example: "Our flight was delayed due to weather." },
        { word: "boarding pass", meaning: "Thẻ lên máy bay", example: "Please show your boarding pass at the gate." },
        { word: "luggage", meaning: "Hành lý", example: "Keep your luggage close." },
        { word: "baggage claim", meaning: "Nơi nhận hành lý", example: "Go to baggage claim to collect your bags." },
        { word: "passport", meaning: "Hộ chiếu", example: "Check your passport before departure." },
        { word: "visa", meaning: "Thị thực", example: "You need a visa to enter the country." },
        { word: "customs", meaning: "Hải quan", example: "We passed through customs quickly." },
        { word: "security", meaning: "An ninh", example: "Security checks are mandatory." },
        { word: "gate", meaning: "Cổng (sân bay)", example: "The flight departs from gate 12." },
        { word: "arrival", meaning: "Đến nơi", example: "The arrival was on time." },
        { word: "departure", meaning: "Khởi hành", example: "The departure is scheduled for 9 am." },
        { word: "delay", meaning: "Sự chậm trễ", example: "The train delay caused problems." },
        { word: "ticket", meaning: "Vé", example: "I bought a ticket for the concert." },
        { word: "reservation", meaning: "Đặt trước", example: "I made a hotel reservation." },
        { word: "hotel", meaning: "Khách sạn", example: "The hotel was very comfortable." },
        { word: "check-in", meaning: "Nhận phòng / đăng ký", example: "Check-in starts at 3 pm." },
        { word: "check-out", meaning: "Trả phòng", example: "Check-out is at noon." },
        { word: "room service", meaning: "Dịch vụ phòng", example: "We ordered room service." },
        { word: "taxi", meaning: "Xe taxi", example: "We took a taxi to the station." },
        { word: "bus", meaning: "Xe buýt", example: "The bus arrived on time." },
        { word: "train", meaning: "Tàu hỏa", example: "The train leaves at 8 am." },
        { word: "subway", meaning: "Tàu điện ngầm", example: "Take the subway to downtown." },
        { word: "platform", meaning: "Sân ga / Sân đợi", example: "Wait on platform 3." },
        { word: "schedule", meaning: "Lịch trình", example: "Check the train schedule." },
        { word: "lounge", meaning: "Phòng chờ", example: "Passengers can use the VIP lounge." },
        { word: "ticket counter", meaning: "Quầy vé", example: "Buy your ticket at the counter." },
        { word: "baggage", meaning: "Hành lý", example: "Check your baggage allowance." },
        { word: "conveyor belt", meaning: "Băng chuyền", example: "Pick up your luggage from the conveyor belt." },
        { word: "departure lounge", meaning: "Phòng chờ khởi hành", example: "Wait in the departure lounge." },
        { word: "customs officer", meaning: "Nhân viên hải quan", example: "The customs officer checked our bags." },
        { word: "boarding gate", meaning: "Cổng lên máy bay", example: "Go to the boarding gate." },
        { word: "car rental", meaning: "Thuê xe", example: "We booked a car rental in advance." },
        { word: "itinerary", meaning: "Lịch trình chuyến đi", example: "The itinerary includes all destinations." },
        { word: "travel agency", meaning: "Công ty du lịch", example: "I booked the tour via a travel agency." },
        { word: "tour guide", meaning: "Hướng dẫn viên du lịch", example: "The tour guide explained the landmarks." },
        { word: "reservation number", meaning: "Mã đặt phòng / vé", example: "Check your reservation number." },
        { word: "boarding time", meaning: "Thời gian lên máy bay", example: "Boarding time is 15 minutes before departure." },
        { word: "flight attendant", meaning: "Tiếp viên hàng không", example: "The flight attendant welcomed passengers." },
        { word: "pilot", meaning: "Phi công", example: "The pilot announced the flight details." },
        { word: "emergency exit", meaning: "Cửa thoát hiểm", example: "Locate the emergency exit." },
        { word: "luggage trolley", meaning: "Xe đẩy hành lý", example: "Use the luggage trolley for heavy bags." },
        { word: "visa application", meaning: "Đơn xin visa", example: "Submit your visa application online." },
        { word: "departure board", meaning: "Bảng thông tin chuyến bay", example: "Check the departure board for updates." },
        { word: "arrival hall", meaning: "Sảnh đến", example: "Wait in the arrival hall." },
        { word: "customs declaration", meaning: "Khai báo hải quan", example: "Complete the customs declaration form." },
        { word: "travel insurance", meaning: "Bảo hiểm du lịch", example: "We bought travel insurance for safety." },
        { word: "boarding procedure", meaning: "Quy trình lên máy bay", example: "Follow the boarding procedure." },
        { word: "security check", meaning: "Kiểm tra an ninh", example: "Go through the security check." },
        { word: "lounge access", meaning: "Quyền sử dụng phòng chờ", example: "VIP passengers have lounge access." },
        { word: "carry-on bag", meaning: "Hành lý xách tay", example: "Take your carry-on bag on board." },
        { word: "check-in counter", meaning: "Quầy làm thủ tục", example: "Go to the check-in counter." },
        { word: "gate number", meaning: "Số cổng", example: "Check your gate number." },
        { word: "ticket price", meaning: "Giá vé", example: "The ticket price is reasonable." },
        { word: "boarding sequence", meaning: "Thứ tự lên máy bay", example: "Follow the boarding sequence." },
        { word: "flight schedule", meaning: "Lịch trình chuyến bay", example: "Check the flight schedule." }
      ]
    },
    {
      name: "Office & Work",
      description: "Common vocabulary used in office environment.",
      words: [
        { word: "document", meaning: "Tài liệu", example: "Please review the document before submitting." },
        { word: "file", meaning: "Hồ sơ / Tệp tin", example: "Organize the file in alphabetical order." },
        { word: "printer", meaning: "Máy in", example: "The printer is out of ink." },
        { word: "scanner", meaning: "Máy quét", example: "Use the scanner to digitize the documents." },
        { word: "copier", meaning: "Máy photocopy", example: "The copier is available on the second floor." },
        { word: "desk", meaning: "Bàn làm việc", example: "My desk is near the window." },
        { word: "chair", meaning: "Ghế", example: "Adjust your chair for comfort." },
        { word: "meeting room", meaning: "Phòng họp", example: "The meeting room is on the third floor." },
        { word: "whiteboard", meaning: "Bảng trắng", example: "Write the plan on the whiteboard." },
        { word: "projector", meaning: "Máy chiếu", example: "The projector is set up for the presentation." },
        { word: "computer", meaning: "Máy tính", example: "The computer crashed during the work." },
        { word: "laptop", meaning: "Máy tính xách tay", example: "Take your laptop to the meeting." },
        { word: "email", meaning: "Thư điện tử", example: "Send the email to all staff." },
        { word: "calendar", meaning: "Lịch", example: "Check your calendar for appointments." },
        { word: "schedule", meaning: "Lịch trình", example: "Update your schedule regularly." },
        { word: "deadline", meaning: "Hạn chót", example: "Meet the project deadline." },
        { word: "task", meaning: "Nhiệm vụ", example: "Complete all assigned tasks." },
        { word: "assignment", meaning: "Bài tập / Nhiệm vụ", example: "The assignment is due next week." },
        { word: "report", meaning: "Báo cáo", example: "Submit the monthly report." },
        { word: "presentation", meaning: "Bài thuyết trình", example: "Prepare the presentation slides." },
        { word: "meeting", meaning: "Cuộc họp", example: "Schedule the team meeting." },
        { word: "minutes", meaning: "Biên bản cuộc họp", example: "Write the meeting minutes." },
        { word: "memo", meaning: "Bản ghi nhớ", example: "Send a memo to all employees." },
        { word: "notice", meaning: "Thông báo", example: "Post the notice on the bulletin board." },
        { word: "supervisor", meaning: "Người giám sát", example: "Ask your supervisor for help." },
        { word: "manager", meaning: "Quản lý", example: "The manager approved the project." },
        { word: "colleague", meaning: "Đồng nghiệp", example: "Discuss with your colleague." },
        { word: "team", meaning: "Nhóm", example: "The team completed the project on time." },
        { word: "department", meaning: "Phòng ban", example: "The HR department handles recruitment." },
        { word: "employee", meaning: "Nhân viên", example: "The employee received training." },
        { word: "intern", meaning: "Thực tập sinh", example: "The intern is learning office tasks." },
        { word: "task list", meaning: "Danh sách nhiệm vụ", example: "Check the task list every morning." },
        { word: "workflow", meaning: "Quy trình công việc", example: "The workflow needs optimization." },
        { word: "office hours", meaning: "Giờ làm việc", example: "Office hours are from 9 am to 6 pm." },
        { word: "break", meaning: "Giờ giải lao", example: "Take a short break." },
        { word: "lunch break", meaning: "Giờ nghỉ trưa", example: "Lunch break is at noon." },
        { word: "coffee machine", meaning: "Máy pha cà phê", example: "The coffee machine is in the pantry." },
        { word: "stationery", meaning: "Văn phòng phẩm", example: "Buy new stationery supplies." },
        { word: "fax", meaning: "Máy fax", example: "Send the fax immediately." },
        { word: "telephone", meaning: "Điện thoại", example: "Answer the telephone politely." },
        { word: "voicemail", meaning: "Hộp thư thoại", example: "Check your voicemail." },
        { word: "printer cartridge", meaning: "Hộp mực máy in", example: "Replace the printer cartridge." },
        { word: "network", meaning: "Mạng lưới / Mạng máy tính", example: "The network is down." },
        { word: "server", meaning: "Máy chủ", example: "The server needs maintenance." },
        { word: "database", meaning: "Cơ sở dữ liệu", example: "Update the database regularly." },
        { word: "file cabinet", meaning: "Tủ hồ sơ", example: "Store the documents in the file cabinet." },
        { word: "label", meaning: "Nhãn / Tem", example: "Label all boxes clearly." },
        { word: "signature", meaning: "Chữ ký", example: "Sign the document with your signature." },
        { word: "contract", meaning: "Hợp đồng", example: "The contract needs review." },
        { word: "policy", meaning: "Chính sách", example: "Follow the company policy." },
        { word: "procedure", meaning: "Thủ tục", example: "The procedure is documented clearly." },
        { word: "request", meaning: "Yêu cầu", example: "Submit a request form." },
        { word: "approval", meaning: "Sự phê duyệt", example: "Get manager approval before proceeding." }
      ]
    }
  ];

    for (const topic of topics) {
      const flashcardSet = new FlashcardSet({
        user: adminId,
        name: topic.name,
        description: topic.description,
        count: topic.words.length
      });
      await flashcardSet.save();

      const flashcards = topic.words.map(word => ({
        user: adminId,
        set: flashcardSet._id,
        word: word.word,
        meaning: word.meaning,
        example: word.example,
        note: ""
      }));

      await Flashcard.insertMany(flashcards);
    }
    console.log("Seeded all TOEIC flashcards successfully!");
  } catch (err) {
    console.error("Error seeding flashcards:", err);
  }
};

// Auto seed lessons
export const seedLessons = async () => {
  const count = await Lesson.countDocuments();
  if (count > 0) {
    console.log("Lessons already exist, skipping...");
    return;
  }

  // Folder chứa HTML bài học
  const lessonsDir = path.join(__dirname, "../Toeic-Master-BE/src/storage/lessons");
  const lessonFiles = fs.readdirSync(lessonsDir).filter(f => f.endsWith(".html"));

  const lessonTitles = [
    "Bài 1: Từ vựng & cấu trúc bản",
    "Bài 2: Ngữ pháp cơ bản",
    "Bài 3: Mẫu câu giao tiếp, email",
    "Bài 4: Từ vựng & hội thoại thương mại",
    "Bài 5: Tổng hợp từ vựng nâng cao",
    "Bài 6: Đọc hiểu văn bản thương mại",
    "Bài 7: Đọc hiểu tin tức danh nghiệp",
    "Bài 8: Luyện đọc hiểu (tt)",
    "Bài 9: Luyện đọc hiểu nâng cao",
    "Bài 10: Luyện đọc hiểu nâng cao (tt)"
  ];

  const lessons = lessonFiles.map((file, index) => ({
    title: lessonTitles[index] || `Bài ${index + 1}`,
    path: `src/storage/lessons/${file}`,
    content: ``,
    type: index < 5 ? "vocabulary" : "reading",
    views: Math.floor(Math.random() * (185 - 100 + 1)) + 100,
    accessLevel: index < 5 ? "free" : "basic",
    createdBy: null,
    isDeleted: false,
  }));

  await Lesson.insertMany(lessons);
  console.log(`Seeded ${lessons.length} lessons (paths only) successfully!`);
};

// Seed score mappings
export const seedScoreMappings = async () => {
  const mappings = [];

  const listeningMapping = [
    { correctAnswers: 0, scaledScore: 5 },
    { correctAnswers: 10, scaledScore: 55 },
    { correctAnswers: 20, scaledScore: 110 },
    { correctAnswers: 30, scaledScore: 170 },
    { correctAnswers: 40, scaledScore: 230 },
    { correctAnswers: 50, scaledScore: 285 },
    { correctAnswers: 60, scaledScore: 345 },
    { correctAnswers: 70, scaledScore: 400 },
    { correctAnswers: 80, scaledScore: 455 },
    { correctAnswers: 90, scaledScore: 485 },
    { correctAnswers: 100, scaledScore: 495 },
  ];

  const readingMapping = [
    { correctAnswers: 0, scaledScore: 5 },
    { correctAnswers: 10, scaledScore: 60 },
    { correctAnswers: 20, scaledScore: 120 },
    { correctAnswers: 30, scaledScore: 175 },
    { correctAnswers: 40, scaledScore: 230 },
    { correctAnswers: 50, scaledScore: 285 },
    { correctAnswers: 60, scaledScore: 340 },
    { correctAnswers: 70, scaledScore: 390 },
    { correctAnswers: 80, scaledScore: 440 },
    { correctAnswers: 90, scaledScore: 480 },
    { correctAnswers: 100, scaledScore: 495 },
  ];

  // Create mappings for both sections
  for (const mapping of listeningMapping) {
    mappings.push({
      section: 'listening',
      correctAnswers: mapping.correctAnswers,
      scaledScore: mapping.scaledScore,
      version: 'estimated-v1',
      source: 'Custom',
      isActive: true,
      effectiveFrom: new Date(),
      createdBy: null // System generated
    });
  }

  for (const mapping of readingMapping) {
    mappings.push({
      section: 'reading',
      correctAnswers: mapping.correctAnswers,
      scaledScore: mapping.scaledScore,
      version: 'estimated-v1',
      source: 'Custom',
      isActive: true,
      effectiveFrom: new Date(),
      createdBy: null // System generated
    });
  }

  // Fill in intermediate values
  for (let section of ['listening', 'reading']) {
    const sectionMappings = mappings.filter(m => m.section === section);

    for (let i = 0; i < 100; i++) {
      if (!sectionMappings.find(m => m.correctAnswers === i)) {
        // Interpolate score
        const score = estimateScore(section, i);
        mappings.push({
          section,
          correctAnswers: i,
          scaledScore: score,
          version: 'estimated-v1',
          source: 'Custom',
          isActive: true,
          effectiveFrom: new Date(),
          createdBy: null
        });
      }
    }
  }

  try {
    await ScoreMapping.deleteMany({}); // clear old data
    await ScoreMapping.insertMany(mappings);
    console.log('Score mappings seeded successfully!');
  } catch (err) {
    console.error('Error seeding score mappings:', err);
  }
};
