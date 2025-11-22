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
      name: "Environment & Nature",
      description: "Vocabulary related to the environment, ecology, and nature.",
      words: [
        { word: "ecosystem", meaning: "Hệ sinh thái", example: "The rainforest is a diverse ecosystem." },
        { word: "pollution", meaning: "Ô nhiễm", example: "Air pollution affects our health." },
        { word: "recycle", meaning: "Tái chế", example: "We need to recycle plastic and paper." },
        { word: "sustainable", meaning: "Bền vững", example: "Sustainable energy sources are important." },
        { word: "conservation", meaning: "Bảo tồn", example: "Wildlife conservation is vital." },
        { word: "deforestation", meaning: "Phá rừng", example: "Deforestation affects climate change." },
        { word: "climate change", meaning: "Biến đổi khí hậu", example: "Climate change leads to rising temperatures." },
        { word: "global warming", meaning: "Hiện tượng nóng lên toàn cầu", example: "Global warming melts glaciers." },
        { word: "solar energy", meaning: "Năng lượng mặt trời", example: "Solar energy reduces electricity bills." },
        { word: "wind energy", meaning: "Năng lượng gió", example: "Wind energy is renewable." },
        { word: "fossil fuel", meaning: "Nhiên liệu hóa thạch", example: "Coal is a common fossil fuel." },
        { word: "organic", meaning: "Hữu cơ", example: "Organic farming avoids chemicals." },
        { word: "biodiversity", meaning: "Đa dạng sinh học", example: "Biodiversity is crucial for ecosystems." },
        { word: "greenhouse gas", meaning: "Khí nhà kính", example: "Carbon dioxide is a greenhouse gas." },
        { word: "ozone layer", meaning: "Tầng ozone", example: "Ozone layer protects Earth from UV rays." },
        { word: "endangered species", meaning: "Loài nguy cấp", example: "Tigers are an endangered species." },
        { word: "wildlife", meaning: "Động vật hoang dã", example: "Wildlife must be protected." },
        { word: "habitat", meaning: "Môi trường sống", example: "Deforestation destroys animal habitats." },
        { word: "compost", meaning: "Phân hữu cơ", example: "Compost enriches the soil." },
        { word: "emission", meaning: "Khí thải", example: "Car emissions pollute the air." },
        { word: "landfill", meaning: "Bãi rác", example: "Landfill sites produce methane gas." },
        { word: "rainforest", meaning: "Rừng nhiệt đới", example: "Rainforests are rich in biodiversity." },
        { word: "ozone depletion", meaning: "Suy giảm tầng ozone", example: "CFCs cause ozone depletion." },
        { word: "acid rain", meaning: "Mưa axit", example: "Acid rain damages buildings and crops." },
        { word: "reforestation", meaning: "Trồng rừng lại", example: "Reforestation restores ecosystems." },
        { word: "environmental impact", meaning: "Tác động môi trường", example: "The project has a significant environmental impact." },
        { word: "carbon footprint", meaning: "Dấu chân carbon", example: "Reduce your carbon footprint by walking more." },
        { word: "biodegradable", meaning: "Phân hủy sinh học", example: "Use biodegradable packaging." },
        { word: "wildfire", meaning: "Cháy rừng", example: "Wildfires destroy forests." },
        { word: "flood", meaning: "Lũ lụt", example: "Heavy rains caused a flood." },
        { word: "drought", meaning: "Hạn hán", example: "Drought affects crop production." },
        { word: "tsunami", meaning: "Sóng thần", example: "The tsunami hit coastal areas." },
        { word: "earthquake", meaning: "Động đất", example: "The earthquake damaged buildings." },
        { word: "volcano", meaning: "Núi lửa", example: "The volcano erupted last night." },
        { word: "natural disaster", meaning: "Thiên tai", example: "Natural disasters require emergency plans." },
        { word: "pollutant", meaning: "Chất ô nhiễm", example: "Factories release pollutants into the river." },
        { word: "erosion", meaning: "Xói mòn", example: "Erosion damages farmland." },
        { word: "water conservation", meaning: "Bảo tồn nước", example: "Water conservation is important in dry regions." },
        { word: "air quality", meaning: "Chất lượng không khí", example: "Air quality is monitored daily." },
        { word: "noise pollution", meaning: "Ô nhiễm tiếng ồn", example: "Noise pollution affects health." },
        { word: "reusable", meaning: "Tái sử dụng", example: "Bring reusable bags when shopping." },
        { word: "green energy", meaning: "Năng lượng xanh", example: "Invest in green energy solutions." },
        { word: "eco-friendly", meaning: "Thân thiện môi trường", example: "Use eco-friendly products." },
        { word: "sustainability", meaning: "Sự bền vững", example: "Sustainability is key for future generations." },
        { word: "organic farming", meaning: "Nông nghiệp hữu cơ", example: "Organic farming avoids pesticides." },
        { word: "climate action", meaning: "Hành động vì khí hậu", example: "Governments take climate action seriously." },
        { word: "environmental policy", meaning: "Chính sách môi trường", example: "Environmental policies regulate pollution." },
        { word: "greenhouse effect", meaning: "Hiệu ứng nhà kính", example: "Greenhouse effect contributes to global warming." }
      ]
    },
    {
      name: "Food & Cooking",
      description: "Vocabulary related to food, ingredients, and cooking.",
      words: [
        { word: "ingredient", meaning: "Nguyên liệu", example: "Check the ingredient list before cooking." },
        { word: "recipe", meaning: "Công thức nấu ăn", example: "Follow the recipe step by step." },
        { word: "bake", meaning: "Nướng", example: "Bake the cake for 30 minutes." },
        { word: "boil", meaning: "Luộc", example: "Boil the eggs for 10 minutes." },
        { word: "fry", meaning: "Chiên", example: "Fry the chicken until golden brown." },
        { word: "grill", meaning: "Nướng trên vỉ", example: "Grill the steak to your liking." },
        { word: "steam", meaning: "Hấp", example: "Steam the vegetables for 5 minutes." },
        { word: "roast", meaning: "Quay", example: "Roast the turkey for the party." },
        { word: "chop", meaning: "Thái / Cắt nhỏ", example: "Chop the onions finely." },
        { word: "slice", meaning: "Cắt lát", example: "Slice the bread before serving." },
        { word: "dice", meaning: "Cắt hạt lựu", example: "Dice the tomatoes for the salad." },
        { word: "mix", meaning: "Trộn", example: "Mix all ingredients together." },
        { word: "stir", meaning: "Khuấy", example: "Stir the soup continuously." },
        { word: "season", meaning: "Nêm nếm", example: "Season the food with salt and pepper." },
        { word: "marinate", meaning: "Ướp", example: "Marinate the meat overnight." },
        { word: "simmer", meaning: "Kho / Ninh nhỏ lửa", example: "Simmer the sauce for 20 minutes." },
        { word: "whisk", meaning: "Đánh trứng / Kem", example: "Whisk the eggs until fluffy." },
        { word: "knead", meaning: "Nhồi bột", example: "Knead the dough thoroughly." },
        { word: "peel", meaning: "Gọt vỏ", example: "Peel the potatoes before boiling." },
        { word: "crush", meaning: "Nghiền", example: "Crush the garlic cloves." },
        { word: "blend", meaning: "Xay / Pha trộn", example: "Blend the fruits for a smoothie." },
        { word: "rosemary", meaning: "Hương thảo", example: "Add rosemary for flavor." },
        { word: "thyme", meaning: "Húng tây", example: "Thyme enhances the taste of meat." },
        { word: "basil", meaning: "Húng quế", example: "Basil is used in Italian dishes." },
        { word: "oregano", meaning: "Kinh giới", example: "Oregano goes well with pizza." },
        { word: "cumin", meaning: "Cumin", example: "Cumin adds aroma to curry." },
        { word: "paprika", meaning: "Ớt bột", example: "Sprinkle paprika on top." },
        { word: "sugar", meaning: "Đường", example: "Add sugar to taste." },
        { word: "salt", meaning: "Muối", example: "A pinch of salt is enough." },
        { word: "pepper", meaning: "Tiêu", example: "Season with black pepper." },
        { word: "olive oil", meaning: "Dầu ô liu", example: "Use olive oil for salad." },
        { word: "butter", meaning: "Bơ", example: "Melt the butter before cooking." },
        { word: "cheese", meaning: "Phô mai", example: "Grate the cheese over pasta." },
        { word: "yogurt", meaning: "Sữa chua", example: "Mix yogurt into the dressing." },
        { word: "egg", meaning: "Trứng", example: "Boil the eggs for breakfast." },
        { word: "milk", meaning: "Sữa", example: "Add milk to the batter." },
        { word: "cream", meaning: "Kem", example: "Whip the cream until stiff peaks form." },
        { word: "vegetable", meaning: "Rau củ", example: "Chop the vegetables for stir-fry." },
        { word: "fruit", meaning: "Trái cây", example: "Eat fresh fruit every day." },
        { word: "meat", meaning: "Thịt", example: "Grill the meat until cooked." },
        { word: "fish", meaning: "Cá", example: "Steam the fish with ginger." },
        { word: "seafood", meaning: "Hải sản", example: "We had seafood for dinner." },
        { word: "pasta", meaning: "Mì ống", example: "Boil the pasta until al dente." },
        { word: "rice", meaning: "Gạo / Cơm", example: "Cook rice in a rice cooker." },
        { word: "soup", meaning: "Súp", example: "Serve hot soup in bowls." },
        { word: "salad", meaning: "Salad", example: "Toss the salad with dressing." },
        { word: "dessert", meaning: "Tráng miệng", example: "Chocolate cake is a popular dessert." },
        { word: "beverage", meaning: "Đồ uống", example: "Offer a cold beverage to guests." },
        { word: "knife", meaning: "Dao", example: "Use a sharp knife for chopping." },
        { word: "fork", meaning: "Nĩa", example: "Use a fork to eat salad." }
      ]
    },
    {
      name: "Sports & Fitness",
      description: "Vocabulary related to sports, exercise, and fitness.",
      words: [
        { word: "exercise", meaning: "Tập thể dục", example: "Regular exercise improves health." },
        { word: "gym", meaning: "Phòng tập", example: "Go to the gym three times a week." },
        { word: "workout", meaning: "Bài tập", example: "Follow a workout plan." },
        { word: "cardio", meaning: "Bài tập tim mạch", example: "Cardio exercises increase endurance." },
        { word: "strength training", meaning: "Tập sức mạnh", example: "Strength training builds muscles." },
        { word: "yoga", meaning: "Yoga", example: "Practice yoga for flexibility." },
        { word: "pilates", meaning: "Pilates", example: "Pilates improves core strength." },
        { word: "running", meaning: "Chạy bộ", example: "Running every morning is healthy." },
        { word: "jogging", meaning: "Chạy chậm", example: "Jogging is easier than sprinting." },
        { word: "sprinting", meaning: "Chạy nước rút", example: "Sprinting builds explosive power." },
        { word: "cycling", meaning: "Đạp xe", example: "Cycling is good for legs." },
        { word: "swimming", meaning: "Bơi lội", example: "Swimming is a full-body workout." },
        { word: "team sport", meaning: "Môn thể thao đồng đội", example: "Football is a team sport." },
        { word: "individual sport", meaning: "Môn thể thao cá nhân", example: "Tennis is an individual sport." },
        { word: "competition", meaning: "Cuộc thi / Thi đấu", example: "Join a local competition." },
        { word: "tournament", meaning: "Giải đấu", example: "The tournament lasts a week." },
        { word: "coach", meaning: "Huấn luyện viên", example: "The coach plans training sessions." },
        { word: "athlete", meaning: "Vận động viên", example: "Athletes train daily." },
        { word: "referee", meaning: "Trọng tài", example: "The referee calls fouls." },
        { word: "score", meaning: "Điểm số", example: "The score was tied at halftime." },
        { word: "goal", meaning: "Bàn thắng", example: "He scored a goal." },
        { word: "point", meaning: "Điểm", example: "She earned 10 points." },
        { word: "medal", meaning: "Huy chương", example: "He won a gold medal." },
        { word: "trophy", meaning: "Cúp", example: "The team received a trophy." },
        { word: "stretching", meaning: "Kéo giãn cơ", example: "Stretching prevents injuries." },
        { word: "warm-up", meaning: "Khởi động", example: "Do a warm-up before running." },
        { word: "cool-down", meaning: "Hạ nhiệt", example: "Cool-down helps recovery." },
        { word: "hydration", meaning: "Bù nước", example: "Hydration is important during exercise." },
        { word: "endurance", meaning: "Sức bền", example: "Long-distance running requires endurance." },
        { word: "flexibility", meaning: "Sự linh hoạt", example: "Yoga improves flexibility." },
        { word: "strength", meaning: "Sức mạnh", example: "Lift weights to build strength." },
        { word: "balance", meaning: "Cân bằng", example: "Balance exercises prevent falls." },
        { word: "agility", meaning: "Sự nhanh nhẹn", example: "Agility is crucial in basketball." },
        { word: "resistance", meaning: "Kháng lực", example: "Use resistance bands for training." },
        { word: "weights", meaning: "Tạ", example: "Lift weights in the gym." },
        { word: "dumbbell", meaning: "Tạ tay", example: "Use dumbbells for bicep curls." },
        { word: "treadmill", meaning: "Máy chạy bộ", example: "Run on the treadmill for cardio." },
        { word: "elliptical", meaning: "Máy đi bộ elip", example: "The elliptical works legs and arms." },
        { word: "jump rope", meaning: "Nhảy dây", example: "Jump rope for 10 minutes daily." },
        { word: "pedometer", meaning: "Máy đếm bước chân", example: "Use a pedometer to track steps." },
        { word: "personal trainer", meaning: "Huấn luyện viên cá nhân", example: "Hire a personal trainer for guidance." },
        { word: "nutrition", meaning: "Dinh dưỡng", example: "Proper nutrition improves performance." },
        { word: "protein", meaning: "Protein", example: "Protein helps build muscles." },
        { word: "carbohydrate", meaning: "Tinh bột", example: "Carbohydrates provide energy." },
        { word: "fat", meaning: "Chất béo", example: "Limit saturated fat intake." },
        { word: "vitamin", meaning: "Vitamin", example: "Vitamin supplements support health." },
        { word: "mineral", meaning: "Khoáng chất", example: "Minerals strengthen bones." },
        { word: "rest day", meaning: "Ngày nghỉ tập luyện", example: "Take a rest day for recovery." }
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
    },
    {
      name: "Technology & IT",
      description: "Vocabulary related to computers, software, and IT.",
      words: [
        { word: "software", meaning: "Phần mềm", example: "Install the latest software update." },
        { word: "hardware", meaning: "Phần cứng", example: "The computer hardware needs upgrading." },
        { word: "network", meaning: "Mạng", example: "The office network is down today." },
        { word: "server", meaning: "Máy chủ", example: "The server hosts our website." },
        { word: "database", meaning: "Cơ sở dữ liệu", example: "Update the database regularly." },
        { word: "application", meaning: "Ứng dụng", example: "This application helps manage tasks." },
        { word: "cloud computing", meaning: "Điện toán đám mây", example: "Our files are stored in cloud computing services." },
        { word: "encryption", meaning: "Mã hóa", example: "Encryption secures our data." },
        { word: "firewall", meaning: "Tường lửa", example: "The firewall blocks unauthorized access." },
        { word: "login", meaning: "Đăng nhập", example: "Please login with your credentials." },
        { word: "password", meaning: "Mật khẩu", example: "Change your password regularly." },
        { word: "username", meaning: "Tên đăng nhập", example: "Enter your username to login." },
        { word: "protocol", meaning: "Giao thức", example: "HTTP is a common web protocol." },
        { word: "IP address", meaning: "Địa chỉ IP", example: "Each device has a unique IP address." },
        { word: "router", meaning: "Bộ định tuyến", example: "The router connects all devices to the internet." },
        { word: "switch", meaning: "Bộ chuyển mạch", example: "The switch manages network traffic." },
        { word: "bandwidth", meaning: "Băng thông", example: "High bandwidth improves network speed." },
        { word: "latency", meaning: "Độ trễ", example: "Low latency is critical for online gaming." },
        { word: "backup", meaning: "Sao lưu", example: "Always backup your important files." },
        { word: "recovery", meaning: "Phục hồi dữ liệu", example: "Data recovery can save lost files." },
        { word: "malware", meaning: "Phần mềm độc hại", example: "Install antivirus to prevent malware." },
        { word: "virus", meaning: "Vi-rút máy tính", example: "The computer was infected by a virus." },
        { word: "update", meaning: "Cập nhật", example: "Update your software to fix bugs." },
        { word: "patch", meaning: "Bản vá", example: "Install the security patch immediately." },
        { word: "debug", meaning: "Gỡ lỗi", example: "The developer debugged the program." },
        { word: "compile", meaning: "Biên dịch", example: "Compile the code before running it." },
        { word: "algorithm", meaning: "Thuật toán", example: "The algorithm sorts the data efficiently." },
        { word: "script", meaning: "Kịch bản / Script", example: "Write a script to automate tasks." },
        { word: "frontend", meaning: "Giao diện người dùng", example: "Frontend development focuses on design." },
        { word: "backend", meaning: "Phần máy chủ", example: "Backend handles database operations." },
        { word: "API", meaning: "Giao diện lập trình ứng dụng", example: "Use the API to connect services." },
        { word: "framework", meaning: "Khung phát triển", example: "React is a popular frontend framework." },
        { word: "library", meaning: "Thư viện", example: "Use a library to simplify coding." },
        { word: "debugger", meaning: "Công cụ gỡ lỗi", example: "The debugger helps find errors." },
        { word: "IDE", meaning: "Môi trường phát triển tích hợp", example: "VSCode is a common IDE." },
        { word: "open source", meaning: "Mã nguồn mở", example: "Linux is an open source OS." },
        { word: "repository", meaning: "Kho mã nguồn", example: "Push your code to the repository." },
        { word: "commit", meaning: "Ghi lại thay đổi", example: "Commit changes with a descriptive message." },
        { word: "branch", meaning: "Nhánh", example: "Create a new branch for features." },
        { word: "merge", meaning: "Hợp nhất", example: "Merge the branch into main after review." },
        { word: "deployment", meaning: "Triển khai", example: "Deployment moves code to production." },
        { word: "serverless", meaning: "Không máy chủ", example: "Serverless architecture reduces infrastructure costs." },
        { word: "virtualization", meaning: "Ảo hóa", example: "Virtualization allows multiple OS on one machine." },
        { word: "container", meaning: "Container", example: "Docker container isolates apps." },
        { word: "DevOps", meaning: "Phát triển và vận hành", example: "DevOps improves development cycles." },
        { word: "CI/CD", meaning: "Tích hợp liên tục / Triển khai liên tục", example: "CI/CD automates builds and tests." },
        { word: "bandwidth throttling", meaning: "Giới hạn băng thông", example: "ISPs may apply bandwidth throttling." },
        { word: "token", meaning: "Mã xác thực", example: "Use an access token for API calls." },
        { word: "session", meaning: "Phiên làm việc", example: "Session expires after 30 minutes of inactivity." },
        { word: "cookie", meaning: "Cookie", example: "Cookies store user preferences." }
      ]
    },
    {
      name: "Health & Medical",
      description: "Vocabulary related to health, medical, and hospitals.",
      words: [
        { word: "doctor", meaning: "Bác sĩ", example: "The doctor examined the patient." },
        { word: "nurse", meaning: "Y tá", example: "The nurse checked the patient's vital signs." },
        { word: "hospital", meaning: "Bệnh viện", example: "He was admitted to the hospital." },
        { word: "medicine", meaning: "Thuốc", example: "Take the medicine twice a day." },
        { word: "prescription", meaning: "Đơn thuốc", example: "The doctor wrote a prescription." },
        { word: "appointment", meaning: "Cuộc hẹn khám bệnh", example: "I have a doctor's appointment tomorrow." },
        { word: "surgery", meaning: "Phẫu thuật", example: "The surgery was successful." },
        { word: "vaccine", meaning: "Vắc-xin", example: "Get vaccinated to prevent disease." },
        { word: "symptom", meaning: "Triệu chứng", example: "He has flu-like symptoms." },
        { word: "emergency", meaning: "Cấp cứu / Khẩn cấp", example: "Call the emergency number immediately." },
        { word: "diagnosis", meaning: "Chẩn đoán", example: "The diagnosis was confirmed after tests." },
        { word: "treatment", meaning: "Điều trị", example: "The patient received treatment for flu." },
        { word: "therapy", meaning: "Liệu pháp", example: "Physical therapy helps recovery." },
        { word: "infection", meaning: "Nhiễm trùng", example: "He has a bacterial infection." },
        { word: "antibiotic", meaning: "Thuốc kháng sinh", example: "The doctor prescribed antibiotics." },
        { word: "clinic", meaning: "Phòng khám", example: "Visit the clinic for check-ups." },
        { word: "blood test", meaning: "Xét nghiệm máu", example: "The blood test results are normal." },
        { word: "X-ray", meaning: "Chụp X-quang", example: "The X-ray shows no fractures." },
        { word: "scan", meaning: "Quét / Chụp", example: "The MRI scan was completed." },
        { word: "emergency room", meaning: "Phòng cấp cứu", example: "Patients are rushed to the emergency room." },
        { word: "ICU", meaning: "Phòng chăm sóc đặc biệt", example: "The patient was moved to ICU." },
        { word: "ward", meaning: "Khoa / phòng bệnh", example: "The ward has 20 beds." },
        { word: "pharmacy", meaning: "Nhà thuốc", example: "Buy medicine from the pharmacy." },
        { word: "blood pressure", meaning: "Huyết áp", example: "Monitor your blood pressure daily." },
        { word: "pulse", meaning: "Nhịp tim", example: "Check the patient's pulse." },
        { word: "temperature", meaning: "Nhiệt độ cơ thể", example: "The temperature is 37°C." },
        { word: "injury", meaning: "Chấn thương", example: "He suffered a leg injury." },
        { word: "bandage", meaning: "Băng gạc", example: "Apply a bandage to the wound." },
        { word: "cast", meaning: "Bó bột", example: "The broken arm is in a cast." },
        { word: "rehabilitation", meaning: "Phục hồi chức năng", example: "Rehabilitation is necessary after surgery." },
        { word: "check-up", meaning: "Khám tổng quát", example: "Schedule an annual check-up." },
        { word: "health insurance", meaning: "Bảo hiểm y tế", example: "Health insurance covers hospital costs." },
        { word: "diet", meaning: "Chế độ ăn", example: "Maintain a healthy diet." },
        { word: "exercise", meaning: "Tập thể dục", example: "Regular exercise improves health." },
        { word: "mental health", meaning: "Sức khỏe tinh thần", example: "Mental health is equally important." },
        { word: "nutrition", meaning: "Dinh dưỡng", example: "Nutrition affects overall wellbeing." },
        { word: "allergy", meaning: "Dị ứng", example: "She has a peanut allergy." },
        { word: "chronic disease", meaning: "Bệnh mãn tính", example: "Diabetes is a chronic disease." },
        { word: "emergency kit", meaning: "Bộ dụng cụ cứu thương", example: "Keep an emergency kit at home." },
        { word: "first aid", meaning: "Sơ cứu", example: "Learn first aid techniques." },
        { word: "vaccination", meaning: "Tiêm chủng", example: "Vaccination prevents many diseases." },
        { word: "sanitation", meaning: "Vệ sinh", example: "Proper sanitation prevents infection." },
        { word: "contagious", meaning: "Dễ lây", example: "Flu is highly contagious." },
        { word: "emergency contact", meaning: "Người liên hệ khẩn cấp", example: "Provide an emergency contact number." },
        { word: "symptom check", meaning: "Kiểm tra triệu chứng", example: "Use the app for symptom check." },
        { word: "recovery period", meaning: "Thời gian hồi phục", example: "Recovery period lasts two weeks." },
        { word: "ICU nurse", meaning: "Y tá ICU", example: "The ICU nurse monitors patients closely." }
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
