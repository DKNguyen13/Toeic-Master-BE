import { success, error } from "../utils/response.js";
import { meiliClient } from "../config/meilisearch.config.js";
import * as AdminService from "../services/admin.service.js";

// Search user
export const searchUsers = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return error(res, 'Không có quyền truy cập', 403);

        const query = req.query.q || "";
        const index = meiliClient.index("users");

        const result = await index.search(query, { limit: 20});
        const filteredHits = result.hits.filter(u => u.role !== "admin");
        return success(res, "", {hits: result.hits});
    } catch (err) {
        console.error("Search error:", err);
        return error(res, "Lỗi khi tìm kiếm");
    }
}

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