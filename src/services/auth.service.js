import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import User from '../models/user.model.js';
import redisClient from '../config/redis.config.js';
import { sendOTPEmail, sendResetPasswordEmail } from "./mail.service.js";
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';

const fullNameRegex = /^[\p{L}\s'-]+$/u;

// Login
export const login = async ({ email, password }) => {
    if (!email || !password) throw new Error('Email and password are required');

    const user = await User.findOne({ email });
    if (!user) throw new Error('Email does not exist');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Incorrect password');

    const payload = { id: user._id, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    
    const safeUser = { id: user._id, fullname: user.fullname, email: user.email, phone: user.phone, avatarUrl: user.avatarUrl, role: user.role };

    return { user : safeUser, accessToken, refreshToken };
};

// Register
export const register = async ({ fullName, email, password, phone, dob, avatarUrl, otp }) => {
    const storedOtp = await redisClient.get(`otp:${email}`);
    
    if (!storedOtp || storedOtp !== otp) throw new Error('OTP invalid');
    
    if (await User.findOne( { email }))  throw new Error('Email already exists');

    if (phone && await User.findOne({ phone })) throw new Error('Phone already exist');

    if (!fullName || !fullNameRegex.test(fullName)) throw new Error('Full name contains invalid characters');
    
    let dobDate = null;
    if (dob) {
        const [day, month, year] = dob.split('/');
        dobDate = new Date(`${year}-${month}-${day}`); // chuyển sang YYYY-MM-DD
        if (isNaN(dobDate.getTime())) throw new Error('Invalid date of birth');
    }

    const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));

    const user = new User({ fullName, email, password: hashedPassword, phone, dob: dobDate, avatarUrl, isVerified: true });
    await user.save();
    await redisClient.del(`otp:${email}`);

    return { user };
};

// Send OTP register
export const sendRegisterOTP = async (email) => {
    if (!email) throw new Error('Email is required');

    if (await User.findOne({ email })) throw new Error('Email already exists');

    const existingOtp = await redisClient.get(`otp:${email}`);
    if (existingOtp) await redisClient.del(`otp:${email}`);

    const otp = crypto.randomInt(100000, 999999).toString();
    await redisClient.setEx(`otp:${email}`, 600, otp);

    await sendOTPEmail(email, otp);
    return 'OTP sent successfully';
};

// Reset password
export const resetPassword = async ({ email }) =>{
    const user = await User.findOne({ email });
    if (user) {
        const newPassword = crypto.randomBytes(4).toString('hex');
        user.password = await bcrypt.hash(newPassword, await bcrypt.genSalt(10));
        await user.save();
        await sendResetPasswordEmail(email, `New password ${newPassword}`);
    }
    return 'A new password has been sent if the email exists';
};


// Update profile
export const updateProfile = async() => {

};