import bcrypt from "bcryptjs";
import User from "../models/user.model.js";

export const createAdminIfNotExist = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
        const hashedPassword = await bcrypt.hash('admin', 10);
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

// Fake data user
export const insertAccount = async () => {
  for (let i = 0; i < 8; i++) {
    const email = `user${i + 1}@test.com`;
    const exists = await User.findOne({ email });
    if (exists) {
      console.log(`${email} đã tồn tại, bỏ qua.`);
      continue;
    }

    const hashedPassword = await bcrypt.hash('123456', 10);
    const user = new User({
      fullname: `user${i + 1}`,
      email,
      password: hashedPassword,
      phone: `012345678${i}`,
      role: 'user',
      isActive: true
    });

    await user.save();
    console.log(`${email} đã được tạo.`);
  }
};
