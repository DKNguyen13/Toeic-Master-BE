import jwt from "jsonwebtoken";
import { config } from "../config/env.config.js";

export const generateAccessToken = (payload) => {
  try {
    return jwt.sign(payload, config.accessTokenKey, {
      expiresIn: config.accessTokenLife,
    });
  } catch (err) {
    throw new Error("Failed to generate access token");
  }
};

export const generateRefreshToken = (payload) => {
  try {
    return jwt.sign(payload, config.refreshTokenKey, {
      expiresIn: config.refreshTokenLife,
    });
  } catch (err) {
    throw new Error("Failed to generate refresh token");
  }
};

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, config.accessTokenKey);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new Error("Access token expired");
    } else if (err.name === "JsonWebTokenError") {
      throw new Error("Invalid access token");
    } else {
      throw new Error("Failed to verify access token");
    }
  }
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, config.refreshTokenKey);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new Error("Refresh token expired");
    } else if (err.name === "JsonWebTokenError") {
      throw new Error("Invalid refresh token");
    } else {
      throw new Error("Failed to verify refresh token");
    }
  }
};
