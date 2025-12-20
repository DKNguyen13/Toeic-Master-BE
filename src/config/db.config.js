import mongoose from "mongoose";
import { config } from "./env.config.js";

const connectDB = async () => {
    try{
        await mongoose.connect(config.mongodbUri);
        console.log('MongoDB connected');
    }
    catch(err){
        console.error('Database connection error: ', err);
        process.exit(1);
    }
};

export default connectDB;