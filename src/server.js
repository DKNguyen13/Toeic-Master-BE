import cors from 'cors';
import express from "express";
import connectDB from './config/db.config.js';
import { config } from './config/env.config.js';
import * as initData from './services/init.service.js'
import authRouter from './routes/auth.routes.js'

const app = express();

const corsOptions = {
    origin: "http://localhost:3000",
    credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

//http://localhost:8080/api/
app.use('/api/auth', authRouter);

await connectDB();
await initData.createAdminIfNotExist();
//await initData.insertAccount();

app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`)
})

export default app;