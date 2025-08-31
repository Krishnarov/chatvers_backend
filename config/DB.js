import mongoose  from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const connectDB = async () => {
    try {
           const conn = await mongoose.connect(process.env.MONGO_URL);
        
        console.log("Connected to MongoDB", conn.connection.host);
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
};
export default connectDB;