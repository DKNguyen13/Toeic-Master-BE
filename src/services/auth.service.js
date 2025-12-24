import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/user.model.js';
import { config } from '../config/env.config.js';
import { OAuth2Client } from "google-auth-library";
import redisClient from '../config/redis.config.js';
import { uploadAvatar } from './cloudinary.service.js';
import { sendOTPEmail, sendResetPasswordEmail, sendSupportEmail } from './mail.service.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';

const client = new OAuth2Client(config.googleClientId);

const fullNameRegex = /^[\p{L}\s'-]+$/u;

// Admin Login
export const adminLoginService = async ({ email, password }) => {
    if (!email || !password) throw new Error('Vui lòng nhập email và mật khẩu');

    const user = await User.findOne({ email });
    if (!user) throw new Error('Email không tồn tại');
    if (user.role !== 'admin') throw new Error('Tài khoản không có quyền quản trị!');
    if (!user.isActive) throw new Error('Tài khoản bị vô hiệu hóa!');
    if (user.authType !== 'normal') throw new Error(`Tài khoản này đăng ký bằng ${user.authType}. Vui lòng dùng đăng nhập bằng mật khẩu.`);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Mật khẩu không đúng');
    
    await user.checkVipStatus();

    const payload = { id: user._id, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await redisClient.set(`refreshToken:${user._id}`, refreshToken, { ex: 7 * 24 * 60 * 60 });
    const safeUser = { id: user._id, fullname: user.fullname, email: user.email, phone: user.phone, avatarUrl: user.avatarUrl, isActive : user.isActive, role: user.role };
    return { user: safeUser, accessToken, refreshToken };
};

// Normal Login
export const normalLoginService = async ({ email, password }) => {
    if ( !email || !password ) throw new Error('Vui lòng nhập email và mật khẩu');
    
    const user = await User.findOne({ email });
    if (!user) throw new Error('Email không tồn tại');
    if (!user.isActive) throw new Error('Tài khoản bị vô hiệu hóa!');
    if (user.authType !== 'normal') throw new Error(`Tài khoản này đăng ký bằng ${user.authType}. Vui lòng đăng nhập bằng Google.`);
    if (user.role !== 'user') throw new Error('Hệ thống đang bảo trì! Vui lòng thử lại sau.');
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Mật khẩu không đúng');

    await user.checkVipStatus();

    const payload = { id: user._id, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await redisClient.set(`refreshToken:${user._id}`, refreshToken, { ex: 7 * 24 * 60 * 60 });

    const safeUser = { id: user._id, fullname: user.fullname, email: user.email, phone: user.phone, avatarUrl: user.avatarUrl, isActive : user.isActive, role: user.role };
    return { user : safeUser, accessToken, refreshToken };
};

// Google Login
export const googleLoginService = async ({ tokenId }) => {
    if (!tokenId) throw new Error("Thiếu token ID");

    const ticket = await client.verifyIdToken({
        idToken: tokenId,
        audience: config.googleClientId
    });

    const { email, name, picture } = ticket.getPayload();

    let user = await User.findOne({ email });
    
    if (user) {
        if (user.authType === 'normal') throw new Error('Email đã được đăng ký. Vui lòng đăng nhập bằng mật khẩu.');
        if (!user.isActive) throw new Error('Tài khoản bị vô hiệu hóa!');
    } else {
        user = new User({ 
            fullname: name, 
            email, 
            avatarUrl: picture, 
            authType: 'google', 
            password: null, 
            isActive: true 
        });
        await user.save();
    }
    await user.checkVipStatus();
    const payload = { id: user._id, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const safeUser = { 
        id: user._id, 
        fullname: user.fullname, 
        email: user.email, 
        phone: user.phone, 
        isActive : user.isActive,
        avatarUrl: user.avatarUrl, 
        role: user.role 
    };
    
    await redisClient.set(`refreshToken:${user._id}`, refreshToken, { ex: 7*24*60*60 });
    return { user: safeUser, accessToken, refreshToken };
};

// Register
export const registerService = async ({ fullname, email, password, phone, dob, avatarUrl, otp }) => {
    const storedOtp = await redisClient.get(`otp:${email}`);
    
    if (!storedOtp || storedOtp.toString().trim() !== otp.toString().trim()) throw new Error('OTP không hợp lệ!');
    
    if (await User.findOne( { email }))  throw new Error('Email tồn tại. Vui lòng sử dụng email khác!');

    if (phone && await User.findOne({ phone })) throw new Error('Số điện thoại đã tồn tại!');

    if (!fullname || !fullNameRegex.test(fullname)) throw new Error('Họ tên chứa ký tự không hợp lệ!');

    if (fullname.length > 30) throw new Error("Họ tên không được vượt quá 30 ký tự!");
    if (email.length > 40) throw new Error("Email không được vượt quá 40 ký tự!");
    if (password.length > 50) throw new Error("Mật khẩu không được vượt quá 50 ký tự!");

    let dobDate = null;
    if (dob) {
        const [day, month, year] = dob.split('/');
        dobDate = new Date(`${year}-${month}-${day}`); // chuyển sang YYYY-MM-DD
        if (isNaN(dobDate.getTime())) throw new Error('Ngày sinh không hợp lệ!');
    }
    else {
        console.log('Dob null!');
    }

    const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));

    const user = new User({ fullname, email, password: hashedPassword, phone, dob: dobDate, avatarUrl, authType: 'normal', isVerified: true });
    await user.save();
    await redisClient.del(`otp:${email}`);

    return { user };
};

//Send OTP register to email
export const sendRegisterOTPService = async (email) => {
    if (!email) throw new Error('Vui lòng nhập email!');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new Error('Email không hợp lệ!');
    }

    const user = await User.findOne({ email });
    if (user) throw new Error('Email đã đăng ký!');
    const existingOtp = await redisClient.get(`otp:${email}`);
    if (existingOtp) {
        const ttl = await redisClient.ttl(`otp:${email}`); // Lấy thời gian còn lại
        throw new Error(`OTP đã được gửi. Vui lòng thử lại sau ${ttl} giây.`);
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    await redisClient.set(`otp:${email}`, otp, { ex: 60 });// TTL 60 giây
    await sendOTPEmail(email, otp);

    return { message: "Gửi OTP thành công. Vui lòng kiểm tra email!", cooldown: 60 };
};

//Send new password to email
export const sendOTPService = async (email) => {
    if (!email) throw new Error('Vui lòng nhập email!');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) throw new Error('Email không hợp lệ!');

    const user = await User.findOne({ email });
    if (!user) throw new Error('Email không tồn tại!');
    if (user.authType !== 'normal') throw new Error(`Tài khoản này đăng ký bằng ${user.authType}. Vui lòng đăng nhập bằng Google.`);
    if (!user.isActive) throw new Error('Tài khoản bị vô hiệu hóa!');
    if (user.role === 'admin') throw new Error('Hệ thống quá tải vui lòng thử lại sau!');
    
    const existingOtp = await redisClient.get(`otp:${email}`);
    if (existingOtp) {
        const ttl = await redisClient.ttl(`otp:${email}`); // Lấy thời gian còn lại
        throw new Error(`Mật khẩu mới đã được gửi. Vui lòng thử lại sau ${ttl} giây.`);
    }

    const newPassword = crypto.randomBytes(4).toString('hex');
    user.password = await bcrypt.hash(newPassword, await bcrypt.genSalt(10));

    await user.save();
    await sendResetPasswordEmail(email, `Mật khẩu mới của bạn là: ${newPassword}`);
    await redisClient.set(`reset:${email}`, 'sent', { ex: 60 }); // TTL 60 giây
    return { message: 'Mật khẩu mới đã được gửi tới email của bạn!', cooldown: 60 };
};

// Send support email
export const sendSupportEmailService = async (to, userName, issueTitle, issueContent) => {
    if( !to || !userName || !issueTitle || !issueContent ) {
        throw new Error('Vui lòng điền đầy đủ thông tin!');
    }
    await sendSupportEmail(to, userName, issueTitle, issueContent);
    return { message: 'Gửi yêu cầu hỗ trợ thành công! Vui lòng kiểm tra mail trong vòng 24h.' };
};

//Reset password
export const resetPassword = async ({ email }) => {
    const user = await User.findOne({ email });
    if (user) {
        const newPassword = crypto.randomBytes(4).toString('hex');
        user.password = await bcrypt.hash(newPassword, await bcrypt.genSalt(10));
        await user.save();
        await sendResetPasswordEmail(email, `New password ${newPassword}`);
    }
    return 'Nếu email tồn tại, mật khẩu mới đã được gửi!';
};

//Edit user info (for future use)
export const editInforService = async ({ email }) => {
    const user = await User.findOne({ email });
    if (!user) throw new Error('Email không tồn tại');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Mật khẩu không đúng');

    const accessToken = generateAccessToken({ id: user._id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user._id, role: user.role });

    return { user, accessToken, refreshToken };
};

//Update profile
export const updateProfileService = async ({ userId, fullname, dob, fileBuffer }) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('Người dùng không tồn tại');

    if (fullname && fullname.trim() !== '') {
        if (fullname.length > 50) {
            throw new Error('Họ tên quá dài, tối đa 50 ký tự');
        }
        if (!/^[\p{L}\s'-]+$/u.test(fullname)) {
            throw new Error('Họ tên chỉ chứa chữ cái và khoảng trắng');
        }
        user.fullname = fullname;
    }

    if (dob) {
        const dateObj = new Date(dob);
        if (isNaN(dateObj.getTime())) {
            throw new Error('Ngày sinh không hợp lệ');
        }
        user.dob = dateObj;
    }

    if (fileBuffer) {
        if (fileBuffer.length > 1024 * 1024) { // file >1MB
            throw new Error('File avatar quá lớn');
        }
        const avatarUrl = await uploadAvatar(fileBuffer);
        user.avatarUrl = avatarUrl;
    }
    await user.save();
    return { fullname: user.fullname, email: user.email, phone: user.phone, dob: user.dob, avatar: user.avatarUrl};
};

//Change password
export const changePasswordService = async ({ userId, oldPassword, newPassword }) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('Người dùng không tồn tại');
    
    if (user.authType !== 'normal') throw new Error(`Tài khoản này đăng ký bằng ${user.authType}. Không thể đổi mật khẩu`);

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) throw new Error('Mật khẩu cũ không đúng');

    const hashedPassword = await bcrypt.hash(newPassword, await bcrypt.genSalt(10));
    user.password = hashedPassword;

    await user.save();
    return { message: 'Đổi mật khẩu thành công',};
};