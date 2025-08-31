import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import ConnectDB from "./config/DB.js";
import http from "http";
import { Server } from "socket.io";

import userRoutes from "./routes/userRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import { Message } from "./models/messageModel.js";

dotenv.config();
ConnectDB();
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
app.use(cors({
  origin:process.env.ORIGIN_CORS,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials:true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);


const onlineUsers = new Map(); // { userId: socketId }
// socket.io

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // jab user login/online aata hai
  socket.on("user_online", (userId) => {
    onlineUsers.set(userId, socket.id);
    // console.log("User online:", userId);

    // broadcast to all that this user is online
    io.emit("online_users", Array.from(onlineUsers.keys()));
  });

  socket.on("disconnect", () => {
    for (let [userId, sId] of onlineUsers.entries()) {
      if (sId === socket.id) {
        onlineUsers.delete(userId);
        // console.log("User offline:", userId);

        // broadcast updated online users
        io.emit("online_users", Array.from(onlineUsers.keys()));
        break;
      }
    }
  });

  // typing indicator
  socket.on("typing", ({ senderId, receiverId }) => {
    const roomId = [senderId, receiverId].sort().join("_");
    socket.to(roomId).emit("user_typing", { userId: senderId });
  });

  // join a private room
  socket.on("join_private", ({ senderId, receiverId }) => {
    const roomId = [senderId, receiverId].sort().join("_");
    socket.join(roomId);
    // console.log(`Socket ${socket.id} joined ${roomId}`);
  });

  // private_message -> save & broadcast to room
  socket.on("private_message", async (data) => {
    try {
      const { senderId, receiverId, text } = data;
      const roomId = [senderId, receiverId].sort().join("_");

      const message = await Message.create({
        sender: senderId,
        receiver: receiverId,
        text,
        room: roomId,
        read: false,
      });

      // emit saved message (populated) — we re-query to populate sender/receiver names
      const messagePop = await Message.findById(message._id)
        .populate("sender", "name email")
        .populate("receiver", "name email");

      io.to(roomId).emit("receive_private", messagePop);
      // Send notification to receiver if they're not in the chat
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("new_message_notification", {
          senderId,
          unreadCount: await Message.countDocuments({
            receiver: receiverId,
            sender: senderId,
            read: false,
          }),
        });
      }
    } catch (err) {
      console.error("private_message error", err);
    }
  });
  // Add this to your socket.io event handlers
  socket.on("mark_as_read", async ({ userId, senderId }) => {
    try {
      await Message.updateMany(
        {
          sender: senderId,
          receiver: userId,
          read: false,
        },
        {
          $set: { read: true, readAt: new Date() },
        }
      );

      // Notify the sender that messages were read
      const receiverSocketId = onlineUsers.get(senderId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("messages_read", { userId });
      }
    } catch (err) {
      console.error("mark_as_read error", err);
    }
  });

  // Handle status viewed event
  socket.on("status_viewed", async (data) => {
    try {
      const { statusId, viewerId } = data;
      
      const status = await Message.findById(statusId);
      
      if (status && status.sender.toString() !== viewerId) {
        // Check if already viewed
        const alreadyViewed = status.statusViews.some(view => 
          view.viewer.toString() === viewerId
        );
        
        if (!alreadyViewed) {
          status.statusViews.push({
            viewer: viewerId,
            viewedAt: new Date(),
          });
          
          await status.save();
          
          // Notify the status owner
          const ownerSocketId = onlineUsers.get(status.sender.toString());
          if (ownerSocketId) {
            io.to(ownerSocketId).emit("status_viewed", {
              statusId,
              viewerId,
              viewedAt: new Date(),
            });
          }
        }
      }
    } catch (error) {
      console.error("status_viewed error", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
