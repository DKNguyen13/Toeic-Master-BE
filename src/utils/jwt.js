import jwt from 'jsonwebtoken';
import { config } from '../config/env.config.js';

export const generateAccessToken = (payload) =>
  jwt.sign(payload, config.accessTokenKey, { expiresIn: config.accessTokenLife });

export const generateRefreshToken = (payload) =>
  jwt.sign(payload, config.refreshTokenKey, { expiresIn: config.refreshTokenLife });

export const verifyAccessToken = (token) => jwt.verify(token, config.accessTokenKey);

export const verifyRefreshToken = (token) =>  jwt.verify(token, config.refreshTokenKey);

export const generateResetToken = (userId) => {
  return jwt.sign(
    {
      sub: userId,
      type: 'reset-password',
    },
    config.resetTokenKey,
    {
      expiresIn: config.resetTokenLife || '15m',
    }
  );
};

export const verifyResetToken = (token) => {
  const decoded = jwt.verify(token, config.resetTokenKey);

  if (decoded.type !== 'reset-password') {
    throw new Error('Invalid reset token type');
  }

  return decoded;
};