import userModel from '../models/user.model.js';
import paymentOrderModel from '../models/paymentOrder.model.js';

//Get all users with pagination (exclude admins)
export const getAllUsers = async (page = 1, limit = 10) => {
    const skip = (page - 1) * limit;

    const users = await userModel.find({ role: { $ne: 'admin' } })
        .select('-password')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

    const total = await userModel.countDocuments({ role: { $ne: 'admin' } });

    return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
};

//Inactivate user
export const changeActivateUser = async (email) => {
    const user = await userModel.findOne({ email: email });
    if (!user) throw new Error('Người dùng không tồn tại');
    if (user.role === 'admin') throw new Error('Không thể vô hiệu hóa tài khoản admin');
    user.isActive = !user.isActive;
    await user.save();
    return { message: 'Vô hiệu hóa tài khoản thành công' };
};

//Get revenue
export const getRevenueStats = async ({ type = "month", year }) => {
    const match = { status: "success" };

    if (year) {
        match.createdAt = {
        $gte: new Date(`${year}-01-01`),
        $lte: new Date(`${year}-12-31`)
        };
    }

    let groupBy = {};
    if (type === "year") {
        groupBy = { year: { $year: "$startDate" } };
    } else {
        groupBy = { 
        year: { $year: "$startDate" },
        month: { $month: "$startDate" }
        };
    }

    const stats = await paymentOrderModel.aggregate([
    { $match: match },
        {
        $group: {
            _id: groupBy,
            totalRevenue: { $sum: "$pricePaid" },
            count: { $sum: 1 }
        }
        },
        { $sort: type === "year" ? { "_id.year": 1 } : { "_id.year": 1, "_id.month": 1 } }
    ]);

    return stats.map(s => ({
        year: s._id.year,
        month: s._id.month || null,
        totalRevenue: s.totalRevenue,
        count: s.count
    }));
};

export const getUserStats = async () => {
  const totalUsers = await userModel.countDocuments({ role: { $ne: 'admin' } });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const usersYesterday = await userModel.countDocuments({
    role: { $ne: 'admin' },
    createdAt: { $lt: today, $gte: yesterday }
  });

  const usersToday = await userModel.countDocuments({
    role: { $ne: 'admin' },
    createdAt: { $gte: today }
  });

  const growth =
    usersYesterday === 0
      ? usersToday > 0 ? 100 : 0
      : ((usersToday - usersYesterday) / usersYesterday) * 100;

  return {
    totalUsers,
    usersToday,
    usersYesterday,
    growth: Number(growth.toFixed(1)),
  };
};

export const getTotalRevenueByYear = async (year) => {
  if (!year || isNaN(year)) throw new Error('Thiếu hoặc sai định dạng năm');

  // Xác định khoảng thời gian cho năm hiện tại và năm trước
  const startOfYear = new Date(`${year}-01-01`);
  const endOfYear = new Date(`${year}-12-31T23:59:59.999`);

  const startOfPrevYear = new Date(`${year - 1}-01-01`);
  const endOfPrevYear = new Date(`${year - 1}-12-31T23:59:59.999`);

  // Tổng doanh thu của năm hiện tại
  const currentYearData = await paymentOrderModel.aggregate([
    {
      $match: {
        status: 'success',
        startDate: { $gte: startOfYear, $lte: endOfYear }
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$pricePaid' },
        totalOrders: { $sum: 1 }
      }
    }
  ]);

  // Tổng doanh thu của năm trước
  const prevYearData = await paymentOrderModel.aggregate([
    {
      $match: {
        status: 'success',
        startDate: { $gte: startOfPrevYear, $lte: endOfPrevYear }
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$pricePaid' },
        totalOrders: { $sum: 1 }
      }
    }
  ]);

  const currentRevenue = currentYearData[0]?.totalRevenue || 0;
  const prevRevenue = prevYearData[0]?.totalRevenue || 0;

  // Tính % tăng trưởng
  const growth = prevRevenue
    ? ((currentRevenue - prevRevenue) / prevRevenue) * 100
    : currentRevenue > 0
    ? 100
    : 0;

  return {
    year,
    totalRevenue: currentRevenue,
    growth: Number(growth.toFixed(1)),
    totalOrders: currentYearData[0]?.totalOrders || 0,
  };
};