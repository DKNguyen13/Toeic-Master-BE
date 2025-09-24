import cors from 'cors';
import express from "express";
import mongoose from "mongoose";
import { config } from './config/env.config.js';

const app = express();

app.use(express.json());
const corsOptions = {
    origin: "http://localhost:3000",
    credentials: true,
};
app.use(cors(corsOptions));

await mongoose.connect(config.mongodbUri);

app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`)
})

export default app;