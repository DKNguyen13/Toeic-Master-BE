
import { GoogleGenAI } from "@google/genai";
import { promptPrefix } from "../../utils/constant.js";
import mongoose from "mongoose";

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
            // const extraPrompt = "Hãy hình dung bạn là một người thầy dạy học tiếng anh, bạn hãy trả lời câu hỏi" +
            //     " hoặc làm theo các yêu cầu bên dưới ngắn gọn và dễ hiểu." +
            //     "Nếu như câu hỏi không liên quan đến tiếng anh, hãy từ chối trả lời một cách lịch sự. Bạn chỉ trả lời thôi, đừng giới thiệu bạn là ai"
            // message = extraPrompt + message;
            message = promptPrefix + message;
            console.log(message)
            const response = await chat.sendMessage({ message: message });
            console.log(response.text)
            socket.emit('response', response.text);
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