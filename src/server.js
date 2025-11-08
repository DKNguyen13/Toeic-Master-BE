import cors from 'cors';
import express from 'express';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.config.js';
import { config } from './config/env.config.js';
import authRouter from './routes/auth.routes.js';
import adminRouter from './routes/admin.routes.js';
import lessonRouter from './routes/lesson.routes.js';
import vipRouter from './routes/vipPackage.routes.js';
import wishlistRouter from './routes/wishlist.routes.js';
import commentRouter from './routes/comment.routes.js';
import testRouter from './routes/test.routes.js';
import partRouter from './routes/part.routes.js';
import questionRouter from './routes/question.routes.js';
import * as InitData from './services/initData.service.js';

const app = express()

const corsOptions = {
    origin: [
    "http://localhost:3000", // user
    "http://localhost:4000", // admin
  ],
    credentials: true,// bắt buộc để gửi cookie
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.use('/api/admin', adminRouter);
app.use('/api/auth', authRouter);
app.use('/api/vip', vipRouter);
app.use('/api/lessons', lessonRouter);
app.use('/api/wishlist', wishlistRouter);
app.use('/api/comments', commentRouter);
app.use('/api/test', testRouter);
app.use('/api/part', partRouter);
app.use('/api/question', questionRouter);


await connectDB();

await InitData.createAdminIfNotExist();
await InitData.seedPackages();
await InitData.seedLessons();
await InitData.seedFlashcards();
//await InitData.seedRevenue();
await InitData.syncMeiliUsersOnce();

app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`)
})

export default app;
