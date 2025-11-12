import axios from "axios";
import userModel from "../models/user.model.js";
import { config } from "../config/env.config.js";
import redisClient from "../config/redis.config.js";
import { success, error } from '../utils/response.js';
import * as AuthService from '../services/auth.service.js';
import { authenticate } from '../middleware/authenticate.js';
import { verifyRefreshToken, generateAccessToken } from '../utils/jwt.js';

// Admin Login
export const adminLogin = async (req, res) => {
    try {
        const { user, accessToken, refreshToken } = await AuthService.adminLoginService(req.body);
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: config.cookieSecure,
            sameSite: config.cookieSameSite,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return success(res, 'Đăng nhập thành công', { 
            user: { id: user.id, fullname: user.fullname, email : user.email, phone : user.phone, avatarUrl : user.avatarUrl, role : user.role },
            accessToken
        });
    } catch (err) {
        console.log('Admin login error:', err.message);
        return error(res, err.message, 400);
    }
}

// Normal Login
export const login = async (req, res) => {
    try {
        const { user, accessToken, refreshToken } = await AuthService.normalLoginService(req.body);
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: config.cookieSecure,
            sameSite: config.cookieSameSite,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return success(res, 'Đăng nhập thành công', { 
            user: { id: user.id, fullname: user.fullname, email : user.email, phone : user.phone, avatarUrl : user.avatarUrl, role : user.role },
            accessToken
        });
    } catch (err) {
        console.log('Normal login error:', err.message);
        return error(res, err.message, 400);
    }
};

// Google Login
export const googleLogin = async (req, res) => {
    try {
        const { tokenId } = req.body;
        const { user, accessToken, refreshToken } = await AuthService.googleLoginService({ tokenId });

        if (!user.isActive) return error(res, "Tài khoản đã bị vô hiệu hóa!", 403);
        await redisClient.set(`refreshToken:${user.id}`, refreshToken, { EX: 7*24*60*60 });

        // Set cookie refresh token
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: config.cookieSecure,
            sameSite: config.cookieSameSite,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
        });

        return success(res, 'Đăng nhập google thành công', { 
            user: { fullname: user.fullname, email : user.email, avatarUrl: user.avatarUrl },
            accessToken
        });
    } catch (err) {
        console.error("Google login error:", err);
        return error(res, err.message, 400);
    }
};

// Register account
export const register = async (req, res) => {
    try {
        const { fullname, email, password, phone, dob, avatarUrl, otp } = req.body;
        await AuthService.registerService({ fullname, email, password, phone, dob, avatarUrl, otp });
        return success(res, 'Đăng ký thành công. Vui lòng đăng nhập!')
    }
    catch (err) {
        console.log("Register fail:", err.message);
        return error(res, err.message, 400);
    }
};

// Send reset password OTP to email
export const sendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        const result = await AuthService.sendOTPService(email);
        return success(res, result.message, { cooldown: result.cooldown });
    } catch (err) {
        console.log("Send register OTP fail:", err.message);
        return error(res, err.message, 400, { cooldown: err.ttl || 0 });
    }
};

// Send register OTP to email
export const sendRegiOTP = async (req, res) => {
    try {
        const { email } = req.body;
        const result = await AuthService.sendRegisterOTPService(email);
        return success(res, result.message, { cooldown: result.cooldown });
    } catch (err) {
        console.log("Send register OTP fail:", err.message);
        return error(res, err.message, 400, { cooldown: err.ttl || 0 });
    }
};

// Send support email
export const sendSupportEmail = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await userModel.findById(userId).select("email");
        if (!user) return error(res, "Người dùng không tồn tại", 404);

        const { name, title, content } = req.body;
        const result = await AuthService.sendSupportEmailService(user.email, name, title, content);
        return success(res, result.message);
    } catch (err) {
        console.log("Send support email fail:", err.message);
        return error(res, err.message, 400);
    }
};

// Reset password
export const resetPassword = async (req, res) => {
    try {
        const { email, token } = req.body;
        const captcha = await axios.post(
            `https://www.google.com/recaptcha/api/siteverify?secret=${config.recaptchaSecret}&response=${token}`
        );
        if (!captcha.data.success) throw new Error("CAPTCHA không hợp lệ");

        const message = await AuthService.resetPassword({ email });
        return success(res, message);
    } catch (err) {
        console.log('Reset password error:', err.message);
        return error(res, 'Reset password error', 400);
    }
};

// Logout
export const logout = async (req, res) => {
    try {
        const token = req.cookies.refreshToken;
        if (token) {
            const decoded = verifyRefreshToken(token);
            await redisClient.del(`refreshToken:${decoded.id}`);
        }

        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: config.cookieSecure,
            sameSite: config.cookieSameSite,
        });
        return success(res, "Đăng xuất thành công!");
    }
    catch (err) {
        console.error("Error logging out user: ", err);
        return error(res, err.message, 500);
    }
};

// Refresh Access Token
export const refreshToken = async (req, res) => {
    try {
        const token = req.cookies.refreshToken;

        if (!token) return error(res, 'Không có refresh token', 401);

        const decoded = verifyRefreshToken(token);
        //console.log("Decoded refresh token:", decoded);

        const user = await userModel.findById(decoded.id);
        //console.log("Found user:", user ? user.email : null);
        
        const storedToken = await redisClient.get(`refreshToken:${user._id}`);
        //console.log("Stored token in Redis:", storedToken);

        if (!user || !user.isActive) throw new Error('Người dùng không tồn tại hoặc đã bị vô hiệu hóa');
        if (!storedToken || storedToken !== token) return error(res, 'Refresh token không hợp lệ hoặc đã bị thu hồi', 401);
        
        const newAccessToken = generateAccessToken({ id: user._id, role: user.role });
        //console.log("Generated new access token:", newAccessToken);

        return success(res, 'Cấp mới access token thành công', { newAccessToken });
    } catch (err) {
        console.log('Refresh access token invalid', err.message)
        return error(res, err.message, 401);
    }
};

// Update profile
export const updateProfileController = async (req, res) => {
    try {
        const userId = req.user.id;
        const fullname = req.body.fullname || '';
        const fileBuffer = req.file?.buffer || null;
        const dob = req.body.dob || null;
        const updatedUser = await AuthService.updateProfileService({ userId, fullname: fullname, dob, fileBuffer });
        return success(res, 'Cập nhật thông tin thành công', updatedUser);
    } catch (err) {
        console.log("Update profile fail:", err.message);
        return error(res, "Cập nhật thông tin thất bại: ", 400);
    }
};

// Change password
export const changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { oldPassword, newPassword } = req.body;
        await AuthService.changePasswordService({ userId, oldPassword, newPassword });
        return success(res, 'Đổi mật khẩu thành công');
    } catch (err) {
        return error(res, err.message);
    }
};

// Get profile
export const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await userModel.findById(userId).select("fullname email phone dob vip avatarUrl role");

        if (!user) return error(res, "Người dùng không tồn tại", 404);
        return success(res, "Lấy thông tin người dùng thành công", user);
    } catch (err) {
        console.error("Get profile error:", err.message);
        return error(res, "Lấy thông tin thất bại", 500);
    }
};

// Check role
export const checkRole = [authenticate, (req, res) => {
    try {
        console.log('User role:', req.user.role);
        return success(res, 'Role hiện tại', { role: req.user.role });
    } catch (err) {
        return error(res, err.message, 500);
    }
}];
