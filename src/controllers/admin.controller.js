import Fuse from "fuse.js";
import axios from 'axios';
import bcrypt from 'bcryptjs';
import redisClient from '../config/redis.config.js';
import { config } from '../config/env.config.js';
import userModel from "../models/user.model.js";
import { success, error } from "../utils/response.js";
import * as AdminService from "../services/admin.service.js";
import { generateResetToken, verifyResetToken } from '../utils/jwt.js';
import { sendResetPasswordLinkEmail } from '../services/mail.service.js';

// Search users (exclude admins)
export const searchUsers = async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return error(res, "Không có quyền truy cập", 403);

    const q = req.query.q?.trim();
    if (!q || q.length < 2) return success(res, "", { hits: [] });

    const regex = new RegExp(q.split("").join(".*"), "i");
    const candidates = await userModel.find(
      {
        role: { $ne: "admin" },
        $or: [
          { fullname: { $regex: regex } },
          { email: { $regex: regex } },
          { phone: { $regex: regex } }
        ]
      },
      "fullname email phone role isActive authType"
    )
    .limit(200)
    .lean();

    const fuse = new Fuse(candidates, {
      keys: ["fullname", "email", "phone"],
      includeScore: true,
      threshold: 0.4, // 0.0 = chặt; 0.6 = lỏng
    });

    const results = fuse.search(q).slice(0, 20)
      .map(i => i.item);

    return success(res, "Tìm kiếm thành công", { hits: results });
  } catch (err) {
    console.error("Search user error:", err);
    return error(res, "Lỗi khi tìm kiếm");
  }
};

// Get all users (with pagination, exclude admins)
export const getAllUsersController = async (req, res) => {
  try {
        if (req.user.role !== 'admin') return error(res, 'Không có quyền truy cập', 403);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const data = await AdminService.getAllUsers(page, limit);
        return success(res, 'Danh sách người dùng', data);
    } catch (err) {
        return error(res, err.message, 500);
    }
};

//Inactivate user (admin only)
export const changeActivateUserController = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return error(res, 'Không có quyền truy cập', 403);
        const { email } = req.body;
        const message = await AdminService.changeActivateUser(email);
        return success(res, message);
    }
    catch (err) {
        return error(res, err.message, 500);
    }
};

// Get revenue
export const getRevenueStatsController = async (req, res) => {
    try {
        if (req.user.role !== "admin") return error(res, "Không có quyền truy cập", 403);
        const { type, year } = req.query;
        const data = await AdminService.getRevenueStats({ type, year });
        return success(res, "Thống kê doanh thu", data);
    } catch (err) {
        console.log(err.message);
        return error(res, 'Get revenue error', 500);
    }
};

// Get admin dashboard data
export const getAdminDashboard = async (req, res) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();

    const [userStats, revenueStats] = await Promise.all([
      AdminService.getUserStats(),
      AdminService.getTotalRevenueByYear(year)
    ]);
    return success(res, "Lấy dữ liệu dashboard thành công", { userStats, revenueStats });
  } catch (error) {
    console.error('Lỗi Dashboard:', error);
    return error(res, 'Hệ thống lỗi khi lấy dữ liệu dashboard', 500);
  }
};

// ForgotPassword Admin
export const adminForgotPassword = async (req, res) => {
  try {
    const { token } = req.body;
    const captcha = await axios.post(
      "https://www.google.com/recaptcha/api/siteverify",
      null,
      {
        params: {
          secret: config.recaptchaSecret,
          response: token,
        },
      }
    );

    if (!captcha.data.success) {
      return error(res, "CAPTCHA không hợp lệ", 400);
    }

    const cooldownKey = 'admin_reset_cooldown';
    const inCooldown = await redisClient.get(cooldownKey);
    if (inCooldown) {
      return success(
        res,
        "Email khôi phục đã được gửi thành công.",
        { cooldown: 60 }
      );
    }

    const admin = await userModel.findOne({
      role: "admin",
      authType: "normal",
      isActive: true,
    });

    if (!admin) {
      return success(res, "Email khôi phục đã được gửi thành công.");
    }

    const resetToken = generateResetToken(admin._id);

    await redisClient.set(
      `admin_reset:${resetToken}`,
      admin._id.toString(),
      { ex: 15 * 60 }
    );

    await redisClient.set(cooldownKey, '1', { ex: 60 });

    await sendResetPasswordLinkEmail(admin.email, resetToken);

    return success(
      res,
      "Nếu tài khoản admin tồn tại, email khôi phục đã được gửi.",
      { cooldown: 60 }
    );
  } catch (err) {
    console.error("Admin forgot password error:", err);
    return error(res, "Không thể xử lý yêu cầu", 400);
  }
};

const hashPassword = (password) => bcrypt.hashSync(password, 10);

export const adminResetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return error(res, "Thiếu dữ liệu", 400);
    if (newPassword.length < 6) return error(res, "Mật khẩu phải ít nhất 6 ký tự", 400);

    verifyResetToken(token);

    const adminId = await redisClient.get(`admin_reset:${token}`);
    if (!adminId) return error(res, "Link không hợp lệ hoặc đã hết hạn", 400);

    await userModel.findByIdAndUpdate(adminId, {password: hashPassword(newPassword)});
    await redisClient.del(`admin_reset:${token}`);

    return success(res, "Đặt lại mật khẩu thành công");
  } catch (err) {
    console.error("Reset password error:", err);
    return error(res, "Link không hợp lệ hoặc đã hết hạn", 400);
  }
};