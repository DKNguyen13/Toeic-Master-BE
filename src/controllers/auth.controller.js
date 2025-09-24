import { config } from '../config/env.config.js';
import { success, error } from '../utils/response.js'
import * as AuthService from '../services/user.service.js'
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';

// Login
export const login = async (req, res) => {
    try {
        const { user, accessToken, refreshToken }  = await AuthService.login(req.body);
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

// Refresh token
export const refreshToken = async (req, res) => {
    try {
        const token = req.cookies.refreshToken;
        if (!token) return error(res, 'No refresh token provided', 401);

        const decoded = verifyRefreshToken(token);
        const user = await User.findById(decoded.id);

        if (!user || !user.isActive) throw new Error('User not found or inactive');
        const newAccessToken = generateAccessToken({ id: user._id, role: user.role });

        return success(res, 'New access token', { newAccessToken });
    } catch (err) {
        return error(res, 'Refresh access token invalid', 401);
    }
};

// Logout
export const logout = (req, res) => {
    try{
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: config.cookieSecure,
            sameSite: config.cookieSameSite,
        });
        return success(res, "Logged out successfully");
    }
    catch(err){
        console.error("Error logging out user: ", err)
    }
};