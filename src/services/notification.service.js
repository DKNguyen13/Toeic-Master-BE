import Notification from "../models/notification.model.js";

class NotificationService {
    constructor(io, onlineUsers) {
        this.io = io;
        this.onlineUsers = onlineUsers;

        // Listen to notification:created event
        // Notification.on('notification:created', (notification) => {
        //     this.sendViaSocket(notification);
        // });
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