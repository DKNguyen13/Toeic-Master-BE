import redisClient from "../config/redis.config.js";

const MAINTENANCE_KEY = "site:maintenance";

const normalizeDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const buildState = (state = {}) => {
  const startAt = normalizeDate(state.startAt);
  const endAt = normalizeDate(state.endAt);
  const now = Date.now();
  const active = Boolean(state.enabled) && startAt && endAt && now >= startAt.getTime() && now <= endAt.getTime();

  return {
    enabled: Boolean(state.enabled),
    active,
    startAt: startAt ? startAt.toISOString() : null,
    endAt: endAt ? endAt.toISOString() : null,
    message: state.message || "Hệ thống đang bảo trì. Vui lòng quay lại sau.",
    createdBy: state.createdBy || null,
    createdAt: state.createdAt || null,
    updatedAt: state.updatedAt || null,
  };
};

export const getMaintenanceState = async () => {
  const raw = await redisClient.get(MAINTENANCE_KEY);

  if (!raw) {
    return buildState();
  }

  const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  return buildState(parsed);
};

export const setMaintenanceState = async ({ startAt, endAt, message, enabled = true, createdBy = null }) => {
  const normalizedStart = normalizeDate(startAt) || new Date();
  const normalizedEnd = normalizeDate(endAt);

  if (!normalizedEnd) {
    throw new Error("Ngày kết thúc bảo trì không hợp lệ");
  }

  if (normalizedEnd <= normalizedStart) {
    throw new Error("Ngày kết thúc phải lớn hơn ngày bắt đầu");
  }

  const state = buildState({
    enabled,
    startAt: normalizedStart.toISOString(),
    endAt: normalizedEnd.toISOString(),
    message,
    createdBy,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  await redisClient.set(MAINTENANCE_KEY, JSON.stringify(state));
  return state;
};

export const clearMaintenanceState = async () => {
  await redisClient.del(MAINTENANCE_KEY);
  return buildState();
};
