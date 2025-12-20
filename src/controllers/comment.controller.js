import Comment from "../models/comment.model.js";
import { checkToxic } from "../utils/predictToxic.js";
import NotificationService from "../services/notification.service.js";
import userModel from "../models/user.model.js";

// Convert list of comments
function convertComments(comments, id) {
    return comments.map(comment => (convertComment(comment, id)));
}

// Convert comment
function convertComment(comment, id) {
    return {
        ...comment.toObject(),
        isOwner: id !== null && id === comment.author._id.toString(),
        isLike: id !== null && comment.likes.some((author) => author.toString() === id),
    }
}

// Get comments by exam ID
export const getCommentsByExamId = async (req, res, next) => {
    try {
        const user = req.user;
        let id = null
        if (user) {
            id = user.id
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const comments = await Comment.find({ exam: req.params.examId, isParent: true })
            .populate("author", "fullname avatarUrl")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await Comment.countDocuments({ exam: req.params.examId, isParent: true });
        res.json({
            data: convertComments(comments, id),
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalComments: total,
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// Add new comment
export const addComment = async (req, res, next) => {
    try {
        const commentText = req.body.content || req.body.comment;
        const isToxic = checkToxic(commentText);
        if (isToxic) {
            console.log("Toxic comment detected:", commentText);
            return res.status(400).json({ message: "Comment chứa từ bậy bạ" });
        }
        const comment = req.body;
        comment.author = req.user.id
        let savedComment = await Comment.create(comment);
        savedComment = await savedComment.populate("author", "fullname avatarUrl");
        res.status(201).json(convertComment(savedComment, req.user.id));
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

export const updateComment = async (req, res, next) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) {
            return res.status(404).json({ error: "Comment not found" });
        }

        let newContent = (req.body.content || req.body.comment).trim();

        const isToxic = checkToxic(newContent);
        if (isToxic) {
            return res.status(400).json({ message: "Nội dung chứa từ bậy bạ, không thể cập nhật" });
        }

        if (comment.replyTo) {
            const prefix = `@${comment.replyTo} `;
            if (!newContent.startsWith(prefix)) {
                newContent = prefix + newContent;
            }
        }

        const updated = await Comment.findByIdAndUpdate(
            req.params.id,
            {
                content: newContent,
                isEdited: true,
                editedAt: Date.now()
            },
            { new: true }
        ).populate("author", "fullname avatarUrl");

        res.json(convertComment(updated, req.user.id));
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const deleteComment = async (req, res, next) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) {
            return res.status(404).json({ error: "Không tìm thấy nội dung này" });
        }
        await Comment.deleteOne(comment);
        res.json({ message: "Xóa bình luận thành công" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

export const replyComment = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const user = await userModel.findById(userId);

        const parentCommentId = req.params.id;
        const replyText = req.body.content || req.body.comment;

        const isToxic = checkToxic(replyText);
        if (isToxic) {
            return res.status(400).json({ message: "Nội dung chứa từ bậy bạ! Vui lòng kiểm tra lại!" });
        }

        const parentComment = await Comment.findById(parentCommentId)
            .populate("author", "fullname")
            .populate("exam", "title slug");

        if (!parentComment) {
            return res.status(404).json({ error: "Parent comment not found" });
        }

        const replyToName = parentComment.author.fullname;
        
        const prefix = `@${replyToName}`;
        if (replyText === prefix || replyText === `${prefix} `) {
            return res.status(400).json({ message: "Vui lòng nhập nội dung bình luận" });
        }
        let finalContent = replyText.trim();
        if (!finalContent.startsWith(`@${replyToName}`)) {
            finalContent = `@${replyToName} ${finalContent}`;
        }

        const reply = {
            content: finalContent,
            replyTo: replyToName,
            author: user._id,
            exam: parentComment.exam._id,
            isParent: false,
            parent: parentComment.isParent ? parentCommentId : parentComment.parent
        };

        let savedReply = await Comment.create(reply);
        savedReply = await savedReply.populate("author", "fullname avatarUrl");

        if (parentComment.author._id.toString() !== user.id.toString()) {
            try {
                // Lấy notification service instance
                const notificationService = req.app.get('notificationService');

                if (notificationService) {
                    await notificationService.sendReplyCommentNotification({
                        recipientId: parentComment.author._id,
                        senderId: user.id,
                        senderName: user.fullname,
                        replyContent: replyText,
                        commentContent: parentComment.content || parentComment.comment,
                        postId: parentComment.exam.slug,
                        postTitle: parentComment.exam.title || 'Bài kiểm tra',
                        commentId: parentCommentId,
                        replyId: savedReply._id.toString(),
                        avatarUrl: user.avatarUrl
                    });

                    console.log(`✓ Notification sent to user ${parentComment.author._id}`);
                }
            } catch (notifError) {
                console.error('Error sending notification:', notifError);
            }
        }

        res.json(convertComment(savedReply, user.id));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getChildrenComment = async (req, res, next) => {
    try {
        const user = req.user;
        let id = null
        if (user) {
            id = user.id
        }
        const parentCommentId = req.params.id;
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit;
        const parentComment = await Comment.findById(parentCommentId);
        if (!parentComment) {
            return res.status(404).json({ error: "Parent comment not found" });
        }
        const replies = await Comment.find({ parent: parentCommentId })
            .populate("author", "fullname avatarUrl")
            .skip(skip)
            .limit(limit)
        const total = await Comment.countDocuments({ parent: parentCommentId });
        res.json({
            data: convertComments(replies, id),
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
        res.status(500).json({ error: error.message });
    }
}

export const reactComment = async (req, res, next) => {
    try {
        const user = req.user;
        const commentId = req.params.id;
        let comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ error: "Không tìm thấy nội dung này" });
        }
        const existingReactionIndex = comment.likes.findIndex(like => {
            // console.log(like);
            return like.toString() === user.id
        });
        //user like this comment before
        if (existingReactionIndex !== -1) {
            await Comment.updateOne({_id: commentId},
                {
                    $pull: {likes: user.id},
                    $inc: {noOfLikes: -1}
                });
        }
        else{
            await Comment.updateOne({_id: commentId},
                {
                    $push: {likes: user.id},
                    $inc: {noOfLikes: +1}
                });
        }
        res.json({ message: "Reaction updated successfully" });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
}