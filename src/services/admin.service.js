import userModel from '../models/user.model.js';

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