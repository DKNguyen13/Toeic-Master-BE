import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    // Người nhận thông báo
    recipientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Người gửi/tạo thông báo
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Có thể null với system notification
    },

    // Loại thông báo
    type: {
        type: String,
        enum: [
            'reply_comment',
            'new_post',
            'like_post',
            'like_comment',
            'mention',
            'follow',
            'share_post',
            'system',
            'message',
            'achievement',
            'warning'
        ],
        required: true,
        index: true
    },

    // Tiêu đề thông báo
    title: {
        type: String,
        required: true,
        maxlength: 200
    },

    // Nội dung thông báo
    message: {
        type: String,
        required: true,
        maxlength: 500
    },

    // Dữ liệu bổ sung (linh hoạt theo từng loại)
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },

    // Độ ưu tiên
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal',
        index: true
    },

    // Trạng thái đã đọc
    read: {
        type: Boolean,
        default: false,
        index: true
    },

    // Thời gian đọc
    readAt: {
        type: Date,
        default: null
    },

    // URL để navigate khi click
    actionUrl: {
        type: String,
        default: null
    },

    // Icon/Avatar cho notification
    icon: {
        type: String,
        default: null
    },

    // ID của resource liên quan (post, comment, etc.)
    resourceId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        index: true
    },

    // Loại resource
    resourceType: {
        type: String,
        enum: ['Post', 'Comment', 'User', 'Message', 'Other'],
        default: null
    },

    // Trạng thái đã gửi qua socket
    sentViaSocket: {
        type: Boolean,
        default: false
    },

    // Trạng thái đã xóa (soft delete)
    deleted: {
        type: Boolean,
        default: false,
        index: true
    },

    deletedAt: {
        type: Date,
        default: null
    }

}, {
    timestamps: true, // Tự động tạo createdAt và updatedAt
    collection: 'notifications'
});

// ==================
// INDEXES
// ==================

// Compound indexes cho query hiệu quả
notificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, type: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, deleted: 1, createdAt: -1 });
notificationSchema.index({ senderId: 1, createdAt: -1 });
notificationSchema.index({ resourceId: 1, resourceType: 1 });

// TTL index để tự động xóa notification hết hạn
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ==================
// VIRTUALS
// ==================

// Virtual để format thời gian
notificationSchema.virtual('timeAgo').get(function() {
    return this.formatTimeAgo(this.createdAt);
});

// Virtual để lấy sender info
notificationSchema.virtual('sender', {
    ref: 'User',
    localField: 'senderId',
    foreignField: '_id',
    justOne: true
});

// Virtual để lấy recipient info
notificationSchema.virtual('recipient', {
    ref: 'User',
    localField: 'recipientId',
    foreignField: '_id',
    justOne: true
});

// ==================
// INSTANCE METHODS
// ==================

// Đánh dấu đã đọc
notificationSchema.methods.markAsRead = async function() {
    if (!this.read) {
        this.read = true;
        this.readAt = new Date();
        await this.save();
    }
    return this;
};

// Đánh dấu chưa đọc
notificationSchema.methods.markAsUnread = async function() {
    if (this.read) {
        this.read = false;
        this.readAt = null;
        await this.save();
    }
    return this;
};

// Soft delete
notificationSchema.methods.softDelete = async function() {
    this.deleted = true;
    this.deletedAt = new Date();
    await this.save();
    return this;
};

// Restore
notificationSchema.methods.restore = async function() {
    this.deleted = false;
    this.deletedAt = null;
    await this.save();
    return this;
};

// Format time ago
notificationSchema.methods.formatTimeAgo = function(date) {
    const seconds = Math.floor((new Date() - date) / 1000);

    const intervals = {
        năm: 31536000,
        tháng: 2592000,
        tuần: 604800,
        ngày: 86400,
        giờ: 3600,
        phút: 60,
        giây: 1
    };

    for (const [name, count] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / count);
        if (interval >= 1) {
            return `${interval} ${name} trước`;
        }
    }

    return 'Vừa xong';
};

// Convert to JSON response
notificationSchema.methods.toResponse = function() {
    return {
        id: this._id,
        type: this.type,
        title: this.title,
        message: this.message,
        data: this.data,
        priority: this.priority,
        read: this.read,
        readAt: this.readAt,
        actionUrl: this.actionUrl,
        icon: this.icon,
        thumbnail: this.thumbnail,
        resourceId: this.resourceId,
        resourceType: this.resourceType,
        timeAgo: this.timeAgo,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
    };
};

// ==================
// STATIC METHODS
// ==================

// Tạo notification mới
notificationSchema.statics.createNotification = async function(data) {
    const notification = new this(data);
    await notification.save();
    return notification;
};

// Lấy notifications của user
notificationSchema.statics.getByRecipient = async function(recipientId, options = {}) {
    const {
        page = 1,
        limit = 20,
        type = null,
        read = null,
        priority = null,
        startDate = null,
        endDate = null
    } = options;

    const query = {
        recipientId,
        deleted: false
    };

    if (type) query.type = type;
    if (read !== null) query.read = read;
    if (priority) query.priority = priority;
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
        this.find(query)
            .populate('senderId', 'name avatar username')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        this.countDocuments(query)
    ]);

    return {
        notifications,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1
        }
    };
};

// Đếm notification chưa đọc
notificationSchema.statics.countUnread = async function(recipientId) {
    return await this.countDocuments({
        recipientId,
        read: false,
        deleted: false
    });
};

// Đánh dấu tất cả là đã đọc
notificationSchema.statics.markAllAsRead = async function(recipientId) {
    const result = await this.updateMany(
        { recipientId, read: false, deleted: false },
        {
            $set: {
                read: true,
                readAt: new Date()
            }
        }
    );
    return result.modifiedCount;
};

// Xóa tất cả notifications của user
notificationSchema.statics.deleteAllByRecipient = async function(recipientId) {
    const result = await this.updateMany(
        { recipientId, deleted: false },
        {
            $set: {
                deleted: true,
                deletedAt: new Date()
            }
        }
    );
    return result.modifiedCount;
};

// Xóa notifications cũ (hard delete)
notificationSchema.statics.cleanupOldNotifications = async function(daysOld = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.deleteMany({
        createdAt: { $lt: cutoffDate },
        deleted: true
    });

    return result.deletedCount;
};

// Lấy thống kê notifications
notificationSchema.statics.getStats = async function(recipientId) {
    const stats = await this.aggregate([
        {
            $match: {
                recipientId: mongoose.Types.ObjectId(recipientId),
                deleted: false
            }
        },
        {
            $group: {
                _id: '$type',
                total: { $sum: 1 },
                unread: {
                    $sum: { $cond: [{ $eq: ['$read', false] }, 1, 0] }
                }
            }
        }
    ]);

    const total = await this.countDocuments({ recipientId, deleted: false });
    const unread = await this.countDocuments({ recipientId, read: false, deleted: false });

    return {
        total,
        unread,
        byType: stats.reduce((acc, item) => {
            acc[item._id] = {
                total: item.total,
                unread: item.unread
            };
            return acc;
        }, {})
    };
};

// Group notifications (gộp nhiều notification giống nhau)
notificationSchema.statics.groupSimilarNotifications = async function(recipientId, timeWindow = 3600000) {
    // Gộp các notification giống nhau trong vòng 1 giờ
    const cutoffTime = new Date(Date.now() - timeWindow);

    const grouped = await this.aggregate([
        {
            $match: {
                recipientId: mongoose.Types.ObjectId(recipientId),
                deleted: false,
                createdAt: { $gte: cutoffTime }
            }
        },
        {
            $group: {
                _id: {
                    type: '$type',
                    resourceId: '$resourceId'
                },
                count: { $sum: 1 },
                notifications: { $push: '$$ROOT' },
                latestCreatedAt: { $max: '$createdAt' }
            }
        },
        {
            $match: {
                count: { $gt: 1 }
            }
        }
    ]);

    return grouped;
};

// ==================
// MIDDLEWARE
// ==================

// Pre-save: Set icon based on type
notificationSchema.pre('save', function(next) {
    if (this.isNew && !this.icon) {
        const icons = {
            reply_comment: '💬',
            new_post: '📝',
            like_post: '❤️',
            like_comment: '👍',
            mention: '@',
            follow: '👤',
            share_post: '🔄',
            system: '🔔',
            message: '✉️',
            achievement: '🏆',
            warning: '⚠️'
        };
        this.icon = icons[this.type] || '📣';
    }
    next();
});

// Pre-save: Set expiresAt for low priority notifications
notificationSchema.pre('save', function(next) {
    if (this.isNew && this.priority === 'low' && !this.expiresAt) {
        // Low priority notifications expire after 30 days
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 30);
        this.expiresAt = expirationDate;
    }
    next();
});

// Post-save: Emit event for real-time notification
notificationSchema.post('save', function(doc) {
    // Emit event để NotificationService bắt và gửi qua Socket.io
    this.constructor.emit('notification:created', doc);
});

// ==================
// QUERY HELPERS
// ==================

notificationSchema.query.unread = function() {
    return this.where({ read: false });
};

notificationSchema.query.read = function() {
    return this.where({ read: true });
};

notificationSchema.query.notDeleted = function() {
    return this.where({ deleted: false });
};

notificationSchema.query.byType = function(type) {
    return this.where({ type });
};

notificationSchema.query.byPriority = function(priority) {
    return this.where({ priority });
};

notificationSchema.query.recent = function(days = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return this.where({ createdAt: { $gte: cutoffDate } });
};

// ==================
// EXPORT MODEL
// ==================

export default mongoose.model("Notification", notificationSchema);
