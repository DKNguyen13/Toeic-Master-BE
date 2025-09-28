import User from '../models/user.model.js';
import { config } from '../config/env.config.js';
import redisClient from '../config/redis.config.js';
import { success, error } from '../utils/response.js'
import * as AuthService from '../services/auth.service.js'
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';


// Normal Login
export const login = async (req, res) => {
    try {
        const { user, accessToken, refreshToken }  = await AuthService.login(req.body);

        await redisClient.set(`refreshToken:${user._id}`, refreshToken, { EX: 7*24*60*60 });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: config.cookieSecure,
            sameSite: config.cookieSameSite,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return success(res, 'Login successfull', { 
            user: { fullName: user.fullName, avatarUrl : user.avatarUrl },
            accessToken
        });
    } catch (err) {
        return error(res, err.message, 400);
    }
};

// Google Login
export const googleLogin = async (req, res) => {
    try {
        const { tokenId } = req.body;
        const { user, accessToken, refreshToken } = await AuthService.googleLogin({ tokenId });

        // Lưu refresh token vào Redis
        await redisClient.set(`refreshToken:${user.id}`, refreshToken, { EX: 7*24*60*60 });

        // Set cookie refresh token
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: config.cookieSecure,
            sameSite: config.cookieSameSite,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
        });

        return success(res, 'Google login successful', { 
            user: { fullName: user.fullName, avatarUrl: user.avatarUrl },
            accessToken
        });
    } catch (err) {
        console.error("Google login error:", err);
        return error(res, "Google login error. Please try again!", 400);
    }
};

// Register account
export const register = async (req, res) => {
    try{
        const { fullName, email, password, phone, dob, avatarUrl, otp } = req.body;
        await AuthService.register({ fullName, email, password, phone, dob, avatarUrl, otp });
        return success(res, 'Register successful. Please login.')
    }
    catch (err){
        return error(res, 'Register fail: '+ err.message, 400);
    }
};

// Send register OTP
export const sendRegisterOtp =  async (req, res) =>{
    try{
        const { email } = req.body;
        const result = await AuthService.sendRegisterOTP(email);
        return success(res, result);
    }
    catch (err){
        return error(res, err.message, 400)
    }
}

// Refresh token
export const refreshToken = async (req, res) => {
    try {
        const token = req.cookies.refreshToken;
        if (!token) return error(res, 'No refresh token provided', 401);

        const decoded = verifyRefreshToken(token);
        const user = await User.findById(decoded.id);
        const storedToken = await redisClient.get(`refreshToken:${user._id}`);

        if (!user || !user.isActive) throw new Error('User not found or inactive');
        if (!storedToken || storedToken !== token) return error(res, 'Invalid or revoked refresh token', 401);
        const newAccessToken = generateAccessToken({ id: user._id, role: user.role });

        return success(res, 'New access token', { newAccessToken });
    } catch (err) {
        return error(res, 'Refresh access token invalid', 401);
    }
};

// Logout
export const logout = async (req, res) => {
    try{
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
        return success(res, "Logged out successfully");
    }
    catch(err){
        console.error("Error logging out user: ", err);
        return error(res, "Logout failed", 500);
    }
};