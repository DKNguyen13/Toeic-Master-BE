import cors from 'cors';
import express from 'express';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.config.js';
import { config } from './config/env.config.js';
import authRouter from './routes/auth.routes.js';
import lessonRouter from './routes/lesson.routes.js';
import vipRouter from './routes/vipPackage.routes.js';
import wishlistRouter from './routes/wishlist.routes.js';
import commentRouter from './routes/comment.routes.js';

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

app.use('/api/auth', authRouter);
app.use('/api/vip', vipRouter);
app.use('/api/lessons', lessonRouter);
app.use('/api/wishlist', wishlistRouter);
app.use('/api/comments', commentRouter);

await connectDB();

app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`)
})

export default app;
