import fs from "fs";
import path from "path";
import mammoth from "mammoth";
import { fileURLToPath } from "url";
import Lesson from "../models/lesson.model.js";
import userModel from "../models/user.model.js";
import Wishlist from '../models/wishlist.model.js';
import { success, error } from '../utils/response.js';

const getLessonContent = (lesson) => {
  if (lesson.path) {
    const filePath = path.join(process.cwd(), lesson.path);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, "utf-8");
    } else {
      return "<h1>Nội dung đang được cập nhật! Vui lòng quay lại sau.</h1>";
    }
  }
  return "<h1>Chưa có dữ liệu</h1>";
};

// Create lesson
export const createLesson = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return error(res, 'Không có quyền truy cập', 403);
    const lesson = new Lesson({
      ...req.body,// copy toàn bộ dữ liệu client gửi lên
      createdBy: req.user._id,
    });
    await lesson.save();
    return success(res, "Thêm bài học thành công", lesson);
  } catch (err) {
    return error(res, err.message, 400);}
};

// Get all lessons excluding deleted ones
export const getLessons = async (req, res) => {
  try {
    const query = { isDeleted: false };
    if (!req.user) query.accessLevel = "free";

    const lessons = await Lesson.find(query);
    
    const lessonsWithFavorite = await Promise.all(
      lessons.map(async (lesson) => {
        const favoriteCount = await Wishlist.countDocuments({ lesson: lesson._id });
        let isFavorite = false;
        if (req.user) {
          const exists = await Wishlist.exists({ user: req.user._id, lesson: lesson._id });
          isFavorite = !!exists;
        }
        return {
          ...lesson.toObject(),
          views: lesson.views || 0,
          favoriteCount,
          isFavorite
        };
      })
    );
    return success(res, 'Lấy danh sách lesson thành công', lessonsWithFavorite);
  } catch (err) {
    console.log(err.message);
    return error(res, "Lỗi lấy danh sách các bài học", 500);
  }
};

// Get all lessons free excluding deleted ones
export const getLessonsPublic = async (req, res) => {
  try {
    const lessons = await Lesson.find({ isDeleted: false, accessLevel: "free" });

    const lessonsWithFavorite = await Promise.all(
      lessons.map(async (lesson) => {
        const favoriteCount = await Wishlist.countDocuments({ lesson: lesson._id });
        return {
          ...lesson.toObject(),
          views: lesson.views || 0,
          favoriteCount,
          isFavorite: false,
        };
      })
    );
    return success(res, "Lấy danh sách bài học miễn phí thành công", lessonsWithFavorite);
  } catch (err) {
    console.error(err.message);
    return error(res, "Lỗi lấy danh sách bài học miễn phí", 500);
  }
};

// Get lesson free by ID
export const getLessonFreeById = async (req, res) => {
  try {
    const lesson = await Lesson.findOne({ _id: req.params.id, isDeleted: false });
    if (!lesson) return error(res, "Không tìm thấy nội dung bài học này", 404);

    const favoriteCount = await Wishlist.countDocuments({ lesson: lesson._id });
    let isFavorite = false;
    if (req.user) {
      const exists = await Wishlist.exists({ user: req.user.id, lesson: lesson._id });
      isFavorite = !!exists;
    }

    const content = getLessonContent(lesson);

    return success(res, 'Lấy lesson thành công', {
      ...lesson.toObject(),
      content,
      favoriteCount,
      isFavorite
    });
  } catch (err) {
    return error(res, err.message, 400);
  }
};

// Get lesson by ID
export const getLessonById = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) return error(res, "Vui lòng đăng nhập để xem chi tiết bài học!", 401);

    const user = await userModel.findById(req.user.id);
    if (!user) return error(res, "Không tìm thấy người dùng", 404);

    const lesson = await Lesson.findOne({ _id: req.params.id, isDeleted: false });
    if (!lesson) return error(res, "Không tìm thấy bài học này", 404);

    const levels = ["free", "basic", "advanced", "premium"];
    const userLevel = user?.vip?.isActive ? user.vip.type : "free";
    const userLevelIndex = levels.indexOf(userLevel);
    const lessonLevelIndex = levels.indexOf(lesson.accessLevel || "free");

    if (userLevelIndex < lessonLevelIndex) return error(res, "Bạn chưa đủ quyền để xem bài học này, vui lòng nâng cấp tài khoản!", 403);

    const favoriteCount = await Wishlist.countDocuments({ lesson: lesson._id });

    let isFavorite = false;
    if (req.user) {
      const exists = await Wishlist.exists({ user: req.user.id, lesson: lesson._id });
      isFavorite = !!exists;
    }

    const content = getLessonContent(lesson);

    return success(res, 'Lấy lesson thành công', {
      ...lesson.toObject(),
      content,
      favoriteCount,
      isFavorite
    });
  } catch (err) {
    return error(res, err.message, 400);
  }
};

// Update lesson
export const updateLesson = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return error(res, 'Không có quyền truy cập', 403);
    const lesson = await Lesson.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      req.body,
      { new: true }
    );
    if (!lesson) return error(res, "Lesson không tìm thấy", 404);
    const favoriteCount = await Wishlist.countDocuments({ lesson: lesson._id });
    let isFavorite = false;
    if (req.user) {
      const exists = await Wishlist.exists({ user: req.user._id, lesson: lesson._id });
      isFavorite = !!exists;
    }
    return success(res, 'Cập nhật lesson thành công', { ...lesson.toObject(), favoriteCount, isFavorite });
  } catch (err) {
    return error(res, err.message, 400);
  }
};

// Soft delete lesson
export const deleteLesson = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return error(res, 'Không có quyền truy cập', 403);
    const lesson = await Lesson.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    if (!lesson) return error(res, "Lesson không tìm thấy", 404);
    return success(res, 'Xóa lesson thành công');
  } catch (err) {
    return error(res, err.message, 400);
  }
};

// Increase view
export const incrementViews = async (req, res) => {
  try {
    const lesson = await Lesson.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!lesson) return error(res, "Lesson không tìm thấy", 404);

    return success(res, "Tăng views thành công", { views: lesson.views });
  } catch (err) {
    return error(res, err.message, 400);
  }
};

// Upload lesson from Word file
export const uploadLesson = async (req, res) => {
  try {
    if (req.user.role !== "admin") return error(res, "Không có quyền truy cập", 403);

    const { title, type, accessLevel } = req.body;
    const uploadedFile = req.file;
    if (!uploadedFile) return error(res, "Vui lòng tải lên file Word (.docx)", 400);

    // Chuyển file Word sang HTML
    const result = await mammoth.convertToHtml({ path: uploadedFile.path });
    const html = result.value || "<p>Không có nội dung</p>";

    // Tạo file HTML trong /resources/lessons
    const safeTitle = title.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");
    const fileName = `${Date.now()}-${safeTitle}.html`;

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const outputDir = path.resolve(__dirname, "../resources/lessons");

    const outputPath = path.join(outputDir, fileName);

    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(outputPath, html, "utf-8");

    // Tạo record trong MongoDB
    const lesson = await Lesson.create({
      title,
      type,
      accessLevel,
      path: `/src/resources/lessons/${fileName}`,
      createdBy: req.user._id,
    });

    fs.unlinkSync(uploadedFile.path);

    return success(res, "Upload lesson thành công", lesson);
  } catch (err) {
    console.error("Lỗi upload lesson:", err);
    return error(res, "Upload lesson thất bại", 500);
  }
};

// Reupload (update) lesson content from new Word file
export const reuploadLesson = async (req, res) => {
  try {
    if (req.user.role !== "admin") return error(res, "Không có quyền truy cập", 403);

    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return error(res, "Lesson không tồn tại", 404);

    const uploadedFile = req.file;
    if (!uploadedFile) return error(res, "Vui lòng tải lên file Word (.docx)", 400);

    // Xóa file HTML cũ nếu có
    if (lesson.path) {
      const oldPath = path.join(process.cwd(), lesson.path);
      if (fs.existsSync(oldPath)){
        fs.unlinkSync(oldPath);
      }
      else{
        console.warn("File cũ không tồn tại:", oldPath);
      }
    }
    else{
      console.warn("Lesson không có path cũ:", lesson._id);
    }

    // Chuyển file Word sang HTML mới
    const result = await mammoth.convertToHtml({ path: uploadedFile.path });
    const html = result.value || "<p>Không có nội dung</p>";

    // Tạo file HTML mới
    const safeTitle = lesson.title.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");
    const fileName = `${Date.now()}-${safeTitle}.html`;

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const outputDir = path.resolve(__dirname, "../resources/lessons");
    const outputPath = path.join(outputDir, fileName);

    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(outputPath, html, "utf-8");

    // Cập nhật lại path trong MongoDB
    lesson.path = `/src/resources/lessons/${fileName}`;
    await lesson.save();

    // Xóa file Word tạm sau khi convert
    fs.unlinkSync(uploadedFile.path);

    const favoriteCount = await Wishlist.countDocuments({ lesson: lesson._id });
    let isFavorite = false;
    if (req.user) {
      const exists = await Wishlist.exists({ user: req.user._id, lesson: lesson._id });
      isFavorite = !!exists;
    }
    else {
      console.warn("Người dùng chưa đăng nhập, không thể kiểm tra yêu thích.");
      isFavorite = false;
    }

    return success(res, "Cập nhật nội dung bài học thành công", { ...lesson.toObject(), favoriteCount, isFavorite });
  } catch (err) {
    console.error("Lỗi reupload lesson:", err);
    return error(res, "Upload lại nội dung thất bại", 500);
  }
};