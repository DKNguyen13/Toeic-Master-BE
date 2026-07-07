import mongoose from "mongoose";
import { verifyAccessToken } from "../utils/jwt.js";
import { error } from "../utils/response.js";
import { getMaintenanceState } from "../services/maintenance.service.js";
import UserTestSession from "../models/userTestSession.model.js";

const allowPaths = [
  { method: "GET", path: "/api/system/maintenance" },
  { method: "POST", path: "/api/auth/admin-login" },
  { method: "POST", path: "/api/auth/refresh-token/admin" },
  { method: "POST", path: "/api/admin/forgot-password" },
  { method: "POST", path: "/api/admin/reset-password" },
  { method: "POST", path: "/api/auth/logout" },
];

const isAllowedPath = (method, path) => allowPaths.some((item) => item.method === method && item.path === path);

const getSessionRouteInfo = (path) => {
  const parts = path.split("/").filter(Boolean);

  if (parts[0] !== "api" || parts[1] !== "session" || !parts[2] || parts[2] === "user") {
    return null;
  }

  const sessionId = parts[2];
  const action = parts.slice(3).join("/");

  return { sessionId, action };
};

export const maintenanceMiddleware = async (req, res, next) => {
  const path = req.originalUrl.split("?")[0];

  if (isAllowedPath(req.method, path)) {
    return next();
  }

  const state = await getMaintenanceState();
  if (!state.active) {
    return next();
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (token) {
    try {
      const decoded = verifyAccessToken(token);
      if (decoded?.role === "admin") {
        return next();
      }

      const sessionInfo = getSessionRouteInfo(path);
      const allowedActions = new Set(["", "pause", "submit", "results", "answers/bulk"]);

      if (decoded?.role === "user" && sessionInfo && allowedActions.has(sessionInfo.action)) {
        if (!mongoose.Types.ObjectId.isValid(sessionInfo.sessionId)) {
          return error(res, state.message || "Hệ thống đang bảo trì. Vui lòng quay lại sau.", 503, {
            maintenance: state,
          });
        }

        const session = await UserTestSession.findById(sessionInfo.sessionId).select("userId startedAt status");

        if (
          session &&
          session.userId.toString() === decoded.id &&
          new Date(session.startedAt).getTime() <= new Date(state.startAt).getTime()
        ) {
          return next();
        }
      }
    } catch {
      // Ignore token errors here; the maintenance response should win.
    }
  }

  return error(
    res,
    state.message || "Hệ thống đang bảo trì. Vui lòng quay lại sau.",
    503,
    {
      maintenance: state,
    }
  );
};
