
import { GoogleGenAI } from "@google/genai";
import mongoose from "mongoose";
import { promptPrefix } from "../../utils/constant.js";
import { getAllPackages } from "../../services/vipPackage.service.js";
import { getLessonListText } from "../../controllers/lesson.controller.js"

function normalizeMessage(msg) {
  return msg
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g,"")
    .replace(/\s+/g, " ")
    .trim();
}

export function initChatbotSocket(io, options = {}) {
    const { geminiApiKey } = options;
    const onlineUsers = new Map();
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    io.on('connection', socket => {
        const chat = ai.chats.create({
            model: 'gemini-2.0-flash-lite',
            config: {
                temperature: 0.5,
                maxOutputTokens: 1024,
            }
        })
        socket.on('message', async (message) => {
            try {
                const trimmedMsg = normalizeMessage(message);
                const skipMessages = ["hi", "xin chào", "hello", "chào", "hi bạn", "xin chào bạn", "hello bạn", "chào bạn", 
                    "hi cậu", "xin chào cậu", "hello cậu", "chào cậu", "cảm ơn", "cảm ơn cậu", "cảm ơn bạn", "cảm tạ", "cảm tạ cậu", "tuyệt vời", " tuyệt vời quá", "quá đã"
                ];
                if (skipMessages.some(msg => msg === trimmedMsg)) {
                    socket.emit('response', "😊 Chúc bạn 1 ngày mới tốt đẹp");
                    return;
                }
                const packages = await getAllPackages();
                const packageListText = packages
                    .map((pkg, index) =>
                        `${index + 1}. Gói ${pkg.name || pkg.type.toUpperCase()} — Giá gốc: ${pkg.originalPrice.toLocaleString()}đ, Giá ưu đãi: ${pkg.discountedPrice.toLocaleString()}đ. Mô tả: ${pkg.description}`
                    )
                    .join("\n");
                const lessonListText = await getLessonListText();

                message = promptPrefix(packageListText, lessonListText) + message;
                //console.log(message)
            
                const response = await chat.sendMessage({ message: message });
                console.log(response.text)
                socket.emit('response', response.text);
            } catch (error) {
                console.error('Error sending message to AI:', error);
                if (error.status === 429 || (error.error && error.error.code === 429)) {
                    socket.emit('response', 'Hệ thống đang quá tải, vui lòng thử lại sau.');
                } else {
                    socket.emit('response', 'Có lỗi xảy ra, vui lòng thử lại.');
                }
            }
        });

        // Đăng ký user
        socket.on('register', (userId) => {
            onlineUsers.set(userId, socket.id);
            console.log(`✓ User ${userId} registered with socket ${socket.id}`);

            socket.emit('connected', {
                userId,
                message: 'Connected to notification system',
                onlineUsers: onlineUsers.size
            });
        });

        // Đánh dấu notification đã đọc
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

        // Disconnect
        socket.on('disconnect', () => {
            for (let [userId, socketId] of onlineUsers.entries()) {
                if (socketId === socket.id) {
                    onlineUsers.delete(userId);
                    console.log(`✗ User ${userId} disconnected`);
                    break;
                }
            }
        });
    })

    return onlineUsers;
}