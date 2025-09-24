import { verifyAccessToken } from '../utils/jwt.js';
import { error } from '../utils/response.js';

// Verify token
export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 'No access token provided', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    return error(res, err.message, 401);
  }
};

/**
 * @param  {...string} roles
 * Ex: verifyRole('admin', 'manager')
 */
export const verifyRole = (...roles) => {
  return (req, res, next) => {
    try {
      if (!req.user || !req.user.role) {
        return error(res, 'User role not found', 403);
      }

      if (!roles.includes(req.user.role)) {
        return error(res, 'Access denied: insufficient permission', 403);
      }

      next();
    } catch (err) {
      return error(res, 'Role verification failed', 403);
    }
  };
};