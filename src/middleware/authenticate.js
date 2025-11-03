import { verifyAccessToken } from '../utils/jwt.js';
import { success, error } from '../utils/response.js';

// Middleware to require authentication
export const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) return error(res, 'Chưa cung cấp token', 401);
    
    try {
        const decoded = verifyAccessToken(token);
        if (!decoded.id || !decoded.role) return error(res, 'Dữ liệu token không hợp lệ', 401);
        req.user = decoded;
        next();
    } catch (err) {
        return error(res, 'Token không hợp lệ hoặc đã hết hạn', 401);
    }
};

// Check if user has admin role
export const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') return error(res, 'Chỉ admin mới được phép thực hiện hành động này', 403);
    next();
};

// Check if user is editing self or is admin
export const isSelfOrAdmin = (req, res, next) => {
    const targetId = req.params.id;
    if (req.user.id !== targetId && req.user.role !== 'admin') return error(res, 'Không có quyền thực hiện hành động này', 403);
    next();
};

// Optional authentication middleware
export const optionalAuth = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return next();

    const token = authHeader.split(' ')[1];
    if (!token) return next();

    try {
        const decoded = verifyAccessToken(token);

        if (!decoded.id || !decoded.role) {
        return error(res, 'Dữ liệu token không hợp lệ', 401);
        }

        req.user = decoded;
        next();
    } catch (err) {
        return error(res, 'Token không hợp lệ hoặc đã hết hạn', 401);
    }
};
