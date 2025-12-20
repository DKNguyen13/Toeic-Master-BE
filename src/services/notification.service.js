import redisClient from "../config/redis.config.js";
import notificationModel from "../models/notification.model.js";
import Notification from "../models/notification.model.js";
import userModel from "../models/user.model.js";

class NotificationService {
    constructor(io, onlineUsers) {
        this.io = io;
        this.onlineUsers = onlineUsers;

        // Listen to notification:created event
        // Notification.on('notification:created', (notification) => {
        //     this.sendViaSocket(notification);
        // });
    }

    async sendVIPExpiryNotification() {
        const users = await userModel.find({ "vip.isActive": true, "vip.endDate": { $ne: null } });

        if (users.length === 0) {
            console.log("Không có người dùng nào có gói VIP còn hiệu lực.");
            return;
        }

        const now = new Date();

        // Đặt thời gian của các đối tượng Date về 00:00:00.000 để chỉ tính ngày
        now.setHours(0, 0, 0, 0);

        // Kiểm tra nếu có người dùng nào có gói VIP sắp hết hạn và gửi thông báo cho họ
        for (const user of users) {
            if (!user.vip || !user.vip.endDate) {
                console.log(`Gói VIP không có ngày hết hạn cho người dùng ${user.fullname}.`);
                continue;
            }

            const endDate = new Date(user.vip.endDate);
            // Tính ngày hết hạn (đặt về 00:00:00)
            const endDateAtMidnight = new Date(endDate);
            endDateAtMidnight.setHours(0, 0, 0, 0);

            // Tính ngày cảnh báo: 1 ngày trước khi hết hạn
            const alertDate = new Date(endDateAtMidnight);
            alertDate.setDate(alertDate.getDate() - 1);

            console.log(`End date: ${endDateAtMidnight}`);
            console.log(`Alert date (1 day before expiry): ${alertDate}`);
            console.log(`Now: ${now}`);

            // Gửi cảnh báo nếu: hiện tại >= ngày cảnh báo AND hiện tại <= ngày hết hạn
            if (now >= alertDate && now <= endDateAtMidnight) {
                const todayKey = `vipExpiryNotificationSent:${now.toISOString().slice(0, 10)}`;

                const existingNotification = await notificationModel.findOne({
                    recipientId: user._id,
                    type: 'system',
                    title: 'Gói VIP sắp hết hạn',
                    createdAt: {
                        $gte: now, // Check xem có thông báo nào trong ngày hôm nay chưa
                        $lt: new Date(now.getTime() + 24 * 60 * 60 * 1000) // Chỉ tìm thông báo trong ngày
                    }
                });

                if (existingNotification) {
                    console.log(`Thông báo VIP đã được gửi cho người dùng ${user.fullname} hôm nay, không gửi lại.`);
                    continue;
                }

                const notification = await this.createAndSend({
                    recipientId: user._id,
                    senderId: null,
                    type: "system", 
                    title: "Gói VIP sắp hết hạn", 
                    message: `Gói VIP của bạn sẽ hết hạn vào ngày ${endDate.toLocaleDateString()}. Hãy gia hạn ngay để tiếp tục sử dụng các tính năng VIP!`,
                    priority: "high", 
                    actionUrl: "/payment"
                });

                console.log(`Thông báo VIP sắp hết hạn đã được gửi tới người dùng ${user.fullname}`);
                await redisClient.set(todayKey, "true", { ex: 86400 });
            } else {
                console.log(`Không gửi thông báo VIP cho người dùng ${user.fullname}.`);
            }
        }
        return [];
    }

    /**
     * Tạo và gửi notification
     */
    async createAndSend({ recipientId, senderId, type, title, message, data = {}, priority = 'normal', actionUrl = null, resourceId = null, resourceType = null }) {
        try {
            // Tạo notification trong database
            const notification = await Notification.createNotification({
                recipientId,
                senderId,
                type,
                title,
                message,
                data,
                priority,
                actionUrl,
                resourceId,
                resourceType
            });

            // send via Socket.io
            await this.sendViaSocket(notification);

            return notification;

        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    }

    /**
     * Gửi notification qua Socket.io
     */
    async sendViaSocket(notification) {
        const socketId = this.onlineUsers.get(notification.recipientId.toString());
        console.log('SocketId: ', socketId);
        if (socketId) {
            this.io.to(socketId).emit('notification', notification.toResponse());

            // Update sentViaSocket flag
            if (!notification.sentViaSocket) {
                notification.sentViaSocket = true;
                await notification.save();
            }

            console.log(`✓ Socket notification sent to user ${notification.recipientId}`);
            return true;
        }

        console.log(`✗ User ${notification.recipientId} is offline`);
        return false;
    }

    /**
     * Shorthand methods cho từng loại notification
     */

    async sendReplyCommentNotification({ recipientId, senderId, senderName, replyContent, commentContent, postId, postTitle, commentId, replyId, avatarUrl }) {
        return await this.createAndSend({
            recipientId,
            senderId,
            type: 'reply_comment',
            title: 'Bình luận mới',
            message: `${senderName} đã trả lời bình luận của bạn`,
            data: { senderName, replyContent, commentContent, postId, postTitle, commentId, replyId, avatarUrl},
            actionUrl: `/test/${postId}#comment-${commentId}`,
            priority: 'normal',
            resourceId: commentId,
            resourceType: 'Comment'
        });
    }

    async sendNewPostNotification({ followerIds, senderId, authorName, postId, postTitle, postExcerpt, postThumbnail }) {
        const notifications = await Promise.all(
            followerIds.map(followerId =>
                this.createAndSend({
                    recipientId: followerId,
                    senderId,
                    type: 'new_post',
                    title: 'Bài viết mới',
                    message: `${authorName} vừa đăng bài viết mới`,
                    data: { authorName, postId, postTitle, postExcerpt, postThumbnail },
                    actionUrl: `/posts/${postId}`,
                    priority: 'low',
                    resourceId: postId,
                    resourceType: 'Post'
                })
            )
        );
        return notifications;
    }

    async sendLikePostNotification({ recipientId, senderId, likerName, postId, postTitle }) {
        return await this.createAndSend({
            recipientId,
            senderId,
            type: 'like_post',
            title: 'Lượt thích mới',
            message: `${likerName} đã thích bài viết của bạn`,
            data: { likerName, postId, postTitle },
            actionUrl: `/posts/${postId}`,
            priority: 'low',
            resourceId: postId,
            resourceType: 'Post'
        });
    }

    async sendFollowNotification({ recipientId, senderId, followerName }) {
        return await this.createAndSend({
            recipientId,
            senderId,
            type: 'follow',
            title: 'Người theo dõi mới',
            message: `${followerName} đã bắt đầu theo dõi bạn`,
            data: { followerName, followerId: senderId },
            actionUrl: `/users/${senderId}`,
            priority: 'normal',
            resourceId: senderId,
            resourceType: 'User'
        });
    }

    async sendMentionNotification({ recipientId, senderId, mentionerName, contentType, contentExcerpt, postId }) {
        return await this.createAndSend({
            recipientId,
            senderId,
            type: 'mention',
            title: 'Bạn được nhắc đến',
            message: `${mentionerName} đã nhắc đến bạn trong ${contentType === 'post' ? 'bài viết' : 'bình luận'}`,
            data: { mentionerName, contentType, contentExcerpt, postId },
            actionUrl: `/posts/${postId}`,
            priority: 'normal',
            resourceId: postId,
            resourceType: 'Post'
        });
    }

    async broadcastSystemNotification({ title, message, priority = 'high', actionUrl, data = {} }) {
        // Lấy tất cả user IDs
        const allUserIds = Array.from(this.onlineUsers.keys());

        const notifications = await Promise.all(
            allUserIds.map(userId =>
                this.createAndSend({
                    recipientId: userId,
                    senderId: null,
                    type: 'system',
                    title,
                    message,
                    data,
                    actionUrl,
                    priority
                })
            )
        );

        return notifications;
    }
}

export default NotificationService;