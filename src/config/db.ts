import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

export const dbConn = async () => {
    const URI = process.env.MONGO_URI
    try {
        await mongoose.connect(URI as string);
        console.log("Database is conected");
    } catch (error) {
        console.log("Failed to connect db, server error", error);
    }
}