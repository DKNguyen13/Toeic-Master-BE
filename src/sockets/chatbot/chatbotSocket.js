import { Groq } from "groq-sdk";
import mongoose from "mongoose";
import { promptPrefix } from "../../utils/constant.js";
import { getAllPackages } from "../../services/vipPackage.service.js";
import { getLessonListText } from "../../controllers/lesson.controller.js";

// Rate limiting config
const RATE_LIMIT = {
    maxRequestsPerMinute: 10,
    maxRequestsPerHour: 100
};

// User request tracking
const userRequestCounts = new Map();

function normalizeMessage(msg) {
    return msg
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function checkRateLimit(userId) {
    const now = Date.now();
    if (!userRequestCounts.has(userId)) {
        userRequestCounts.set(userId, []);
    }

    const requests = userRequestCounts.get(userId);
    // Xóa requests cũ hơn 1 giờ
    const oneHourAgo = now - 3600000;
    const recentRequests = requests.filter(timestamp => timestamp > oneHourAgo);

    // Kiểm tra giới hạn per hour
    if (recentRequests.length >= RATE_LIMIT.maxRequestsPerHour) {
        return { allowed: false, reason: 'hourly' };
    }

    // Kiểm tra giới hạn per minute
    const oneMinuteAgo = now - 60000;
    const requestsLastMinute = recentRequests.filter(timestamp => timestamp > oneMinuteAgo);
    if (requestsLastMinute.length >= RATE_LIMIT.maxRequestsPerMinute) {
        return { allowed: false, reason: 'minute' };
    }

    recentRequests.push(now);
    userRequestCounts.set(userId, recentRequests);
    return { allowed: true };
}

export function initChatbotSocket(io, options = {}) {
    const { groqApiKey } = options;
    const onlineUsers = new Map();

    const groq = new Groq({ apiKey: groqApiKey });

    io.on('connection', socket => {
        socket.data.chatHistory = [
            {
                role: "system",
                content: "Bạn là một người thầy dạy tiếng Anh chuyên luyện thi TOEIC, trả lời ngắn gọn, dễ hiểu, thân thiện. Nếu câu hỏi không liên quan đến tiếng Anh hoặc TOEIC, từ chối lịch sự."
            }
        ];

        socket.on('message', async (message, userId) => {
            try {
                // Kiểm tra rate limit
                const rateLimitCheck = checkRateLimit(userId);
                if (!rateLimitCheck.allowed) {
                    const msg = rateLimitCheck.reason === 'minute'
                        ? 'Bạn đang gửi quá nhiều tin nhắn. Vui lòng chờ một lát.'
                        : 'Bạn đã vượt quá giới hạn yêu cầu hôm nay. Vui lòng quay lại vào ngày mai.';
                    socket.emit('response', msg);
                    return;
                }

                const trimmedMsg = normalizeMessage(message);
                const skipMessages = ["hi", "xin chào", "hello", "chào", "hi bạn", "xin chào bạn", "hello bạn", "chào bạn",
                    "hi cậu", "xin chào cậu", "hello cậu", "chào cậu", "cảm ơn", "cảm ơn cậu", "cảm ơn bạn", "cảm tạ", "cảm tạ cậu", "tuyệt vời", " tuyệt vời quá", "quá đã"
                ];
                if (skipMessages.some(msg => msg === trimmedMsg)) {
                    socket.emit('response', "Chúc bạn học tốt nhé!");
                    return;
                }

                const packages = await getAllPackages();
                const packageListText = packages
                    .map((pkg, index) =>
                        `${index + 1}. Gói ${pkg.name || pkg.type.toUpperCase()} — Giá gốc: ${pkg.originalPrice.toLocaleString()}đ, Giá ưu đãi: ${pkg.discountedPrice.toLocaleString()}đ. Mô tả: ${pkg.description}`
                    )
                    .join("\n");
                const lessonListText = await getLessonListText();

                const fullUserMessage = promptPrefix(packageListText, lessonListText) + message;

                socket.data.chatHistory.push({ role: "user", content: fullUserMessage });

                const completion = await groq.chat.completions.create({
                    model: "llama-3.3-70b-versatile",
                    messages: socket.data.chatHistory,
                    temperature: 0.5,
                    max_tokens: 1024,
                });

                const aiResponse = completion.choices[0]?.message?.content || "Xin lỗi, tôi không hiểu.";

                socket.data.chatHistory.push({ role: "assistant", content: aiResponse });

                if (socket.data.chatHistory.length > 60) {
                    socket.data.chatHistory = [
                        socket.data.chatHistory[0],
                        ...socket.data.chatHistory.slice(-40)
                    ];
                }

                socket.emit('response', aiResponse);
            } catch (error) {
                console.error('Error sending message to Groq:', error);
                let errorMsg = 'Có lỗi xảy ra, vui lòng thử lại.';
                if (error.status === 429 || error?.response?.status === 429) {
                    errorMsg = 'Hệ thống đang quá tải (rate limit Groq). Vui lòng thử lại sau vài phút.';
                }
                socket.emit('response', errorMsg);
            }
        });

        socket.on('register', (userId) => {
            onlineUsers.set(userId, socket.id);
            console.log(`✓ User ${userId} registered with socket ${socket.id}`);

            socket.emit('connected', {
                userId,
                message: 'Connected to notification system',
                onlineUsers: onlineUsers.size
            });
        });

        socket.on('mark-as-read', async (notificationId) => {
            try {
                const Notification = mongoose.model('Notification');
                const notification = await Notification.findById(notificationId);
                if (notification) {
                    await notification.markAsRead();
                    console.log(`Notification ${notificationId} marked as read`);
                }
            } catch (error) {
                console.error('Error marking notification as read:', error);
            }
        });

        socket.on('disconnect', () => {
            for (let [userId, socketId] of onlineUsers.entries()) {
                if (socketId === socket.id) {
                    onlineUsers.delete(userId);
                    console.log(`✗ User ${userId} disconnected`);
                    break;
                }
            }
        });
    });
    return onlineUsers;
}