import User from "../models/user.model.js";
import { error, success } from "../utils/response.js";
import { clearMaintenanceState, getMaintenanceState, setMaintenanceState } from "../services/maintenance.service.js";

const notifyAllUsers = async (req, title, message, actionUrl = "/maintenance") => {
  const notificationService = req.app.get("notificationService");
  if (!notificationService) return;

  const users = await User.find({ role: "user", isActive: true }).select("_id");
  await Promise.all(
    users.map((user) =>
      notificationService.createAndSend({
        recipientId: user._id,
        senderId: null,
        type: "system",
        title,
        message,
        actionUrl,
        priority: "high",
        data: {
          maintenance: true,
        },
      })
    )
  );
};

export const getPublicMaintenanceStatus = async (req, res) => {
  try {
    const state = await getMaintenanceState();
    return success(res, "Lấy trạng thái bảo trì thành công", state);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

export const getMaintenanceStatusAdmin = async (req, res) => {
  try {
    const state = await getMaintenanceState();
    return success(res, "Lấy trạng thái bảo trì thành công", state);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

export const startMaintenance = async (req, res) => {
  try {
    const { startAt, endAt, message } = req.body;
    const createdBy = req.user?.id || null;

    const state = await setMaintenanceState({
      startAt,
      endAt,
      message,
      enabled: true,
      createdBy,
    });

    await notifyAllUsers(
      req,
      "Hệ thống sắp bảo trì",
      `Hệ thống sẽ bảo trì từ ${new Date(state.startAt).toLocaleString("vi-VN")} đến ${new Date(state.endAt).toLocaleString("vi-VN")}. ${state.message}`.trim(),
      "/maintenance"
    );

    return success(res, "Đã bật chế độ bảo trì", state);
  } catch (err) {
    return error(res, err.message, 400);
  }
};

export const stopMaintenance = async (req, res) => {
  try {
    const previous = await getMaintenanceState();
    const state = await clearMaintenanceState();

    const notificationService = req.app.get("notificationService");
    if (notificationService) {
      const users = await User.find({ role: "user", isActive: true }).select("_id");
      await Promise.all(
        users.map((user) =>
          notificationService.createAndSend({
            recipientId: user._id,
            senderId: null,
            type: "system",
            title: "Hệ thống đã hoạt động trở lại",
            message: previous.message || "Hệ thống đã kết thúc bảo trì và có thể truy cập bình thường.",
            actionUrl: "/",
            priority: "normal",
            data: { maintenance: false },
          })
        )
      );
    }

    return success(res, "Đã tắt chế độ bảo trì", state);
  } catch (err) {
    return error(res, err.message, 500);
  }
};
