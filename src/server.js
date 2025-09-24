import cors from 'cors';
import express from "express";
import mongoose from "mongoose";
import connectDB from './config/db.config.js';
import { config } from './config/env.config.js';
import * as initData from './services/init.service.js'

const app = express();

app.use(express.json());
const corsOptions = {
    origin: "http://localhost:3000",
    credentials: true,
};
app.use(cors(corsOptions));

await mongoose.connect(config.mongodbUri);

await connectDB();
await initData.createAdminIfNotExist();
//await initData.insertAccount();

app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`)
})

export default app;