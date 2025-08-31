import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv"
dotenv.config()


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,  // apna cloudinary ka cloud_name
  api_key: process.env.CLOUDINARY_API_KEY,        // apna api_key
  api_secret: process.env.CLOUDINARY_API_SECRET,  // apna api_secret
  secure: true,
});

export default cloudinary;
