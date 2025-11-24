import notificationModel from "../models/notification.model.js";

export const getAllNotifications = async (req, res) => {
    try{
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const notifications = await notificationModel.find({recipientId: userId})
            .limit(limit)
            .skip(skip)
            .sort({createdAt: -1});
        const total = await notificationModel.countDocuments({ recipientId: userId});
        console.log(notifications)
        res.json({
            data: notifications,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalComments: total,
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            }
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
}

export const markNotificationAsRead = async (req, res) => {
    try{
        const notificationId = req.params.id;
        const notification = await notificationModel.findById(notificationId);
        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }
        notification.read = true;
        await notification.save();
        return res.json({ message: "Notification marked as read", notification });
    }
    catch (error){
        console.log(error);
        res.status(500).json({ error: error.message });
    }
}