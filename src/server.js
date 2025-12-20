import cors from 'cors';
import http from 'http';
import cron from 'node-cron';
import express from 'express';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.config.js';
import { config } from './config/env.config.js';
import authRouter from './routes/auth.routes.js';
import adminRouter from './routes/admin.routes.js';
import lessonRouter from './routes/lesson.routes.js';
import vnpayRoutes from './routes/vnpay.routes.js';
import vipRouter from './routes/vipPackage.routes.js';
import wishlistRouter from './routes/wishlist.routes.js';
import commentRouter from './routes/comment.routes.js';
import testRouter from './routes/test.routes.js';
import partRouter from './routes/part.routes.js';
import questionRouter from './routes/question.routes.js';
import sessionRouter from './routes/session.routes.js';
import flashcardRoutes from './routes/flashcard.routes.js';
import analysis from './routes/analysis.route.js';
import flashcardSetRoutes from './routes/flashcardSet.routes.js';
import notificationRouter from './routes/notification.routes.js';
import fillBlankQuestionRouter from './routes/fillBlankQuestion.routes.js';

// Services
import * as InitData from './services/initData.service.js';
import NotificationService from "./services/notification.service.js";

// socket
import { Server } from "socket.io";
import { initChatbotSocket } from './sockets/chatbot/chatbotSocket.js';
import { initSaveAnswersSocket } from './sockets/saveAnswer/saveAnswerSocket.js';

const app = express()
const server = http.createServer(app);

const allowedOrigins = [
  config.frontendUrl, // User
  config.adminUrl, // Admin
  config.backendUrl, // Backend
];

if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push("http://localhost:3000", "http://localhost:3001", "http://localhost:4000");
}

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json({ limit: "20mb" }));
app.use(cookieParser());

app.use('/api/admin', adminRouter);
app.use('/api/auth', authRouter);
app.use('/api/vip', vipRouter);
app.use("/api/payment", vnpayRoutes);
app.use('/api/lessons', lessonRouter);
app.use('/api/wishlist', wishlistRouter);
app.use('/api/comments', commentRouter);
app.use('/api/test', testRouter);
app.use('/api/part', partRouter);
app.use('/api/question', questionRouter);
app.use('/api/session', sessionRouter);
app.use('/api/flashcard', flashcardRoutes);
app.use('/api/flashcard-set', flashcardSetRoutes);
app.use('/api/notifications', notificationRouter);
app.use('/api/analysis', analysis);
app.use('/api/practice', fillBlankQuestionRouter);

app.get('/', (req, res) => {
  res.json({ message: 'TOEIC Master Backend + Socket.IO is running!' });
});

await connectDB();

// await InitData.createAdminIfNotExist();
// await InitData.seedPackages();
// await InitData.seedLessons();
// await InitData.seedFlashcards();
// await InitData.seedLessons();
// await InitData.initListeningQuestions();
// await InitData.resolveStaleOrders();

const io = new Server(server, {
    cors: {
        origin: "*",          // Cho phép mọi nguồn truy cập (FE mở file local cũng được)
        methods: ["GET", "POST"]
    }
});

const onlineUsers = initChatbotSocket(io, { groqApiKey: config.groqApiKey });
initSaveAnswersSocket(io);

const notificationService = new NotificationService(io, onlineUsers);
app.set('notificationService', notificationService);

server.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`)
});

//await InitData.testVIPExpiryNotification(notificationService);

// Cron job kiểm tra ngày hết hạn VIP mỗi ngày vào 00:00 (trong ngày)
cron.schedule('0 0 * * *', async () => {
    console.log('Running cron job to send VIP expiry notifications at 00:00');
    try {
        await notificationService.sendVIPExpiryNotification();
    } catch (error) {
        console.error('Error while sending VIP expiry notifications:', error);
    }
});


export default app;
