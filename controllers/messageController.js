import { Message } from "../models/messageModel.js";

export const getMessages = async (req, res) => {
const { user1Id, user2Id } = req.params;
const roomId = [user1Id, user2Id].sort().join("_");
  const messages = await Message.find({ room:roomId }).populate("sender", "name").populate("receiver", "name email").sort({ createdAt: 1 });;
  res.json(messages);
};

export const lastmsg=async (req,res) => {
  try {
     const message = await Message.findOne({
      $or: [
        { sender: req.params.userId, receiver: req.params.otherUserId },
        { sender: req.params.otherUserId, receiver: req.params.userId }
      ]
    }).sort({ createdAt: -1 });
    
    res.json(message || {});
  } catch (error) {

     res.status(500).json({ message: error.message });
    
  }
}
export const getunread=async (req,res) => {
   try {
    const count = await Message.countDocuments({
      sender: req.params.senderId,
      receiver: req.params.userId,
      read: false
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export const Uploadstatus=async (req,res) => {
   try {
    const { userId, caption } = req.body;
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
// Cloudinary returns the file URL in req.file.path
    const mediaUrl = req.file.path;
    const mediaType = req.file.mimetype.startsWith("image/") ? "image" : "video";



   const statusMessage = new Message({
      sender: userId,
      receiver: null,
      text: caption || "",
      media: mediaUrl, // This is the Cloudinary URL
      mediaType: mediaType,
      room: `status_${userId}`,
      isStatus: true,
      statusViews: [],
    });

    await statusMessage.save();
    await statusMessage.populate("sender", "name email");

    res.status(201).json(statusMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}


export const activestatus=async (req,res) => {
    try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const statuses = await Message.find({
      isStatus: true,
      createdAt: { $gte: twentyFourHoursAgo },
    }).populate('sender', 'name email profilePic')
      .sort({ createdAt: -1 });

    res.json(statuses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
export const getstatusviews =async (req,res) => {
   try {

    const userId = req.user.id;
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const myStatuses = await Message.find({
      sender: userId,
      isStatus: true,
      createdAt: { $gte: twentyFourHoursAgo },
    }).populate('statusViews.viewer', 'name email profilePic');
    
    res.json(myStatuses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export const statusviewed=async (req,res) => {
   try {
    const { statusId } = req.params;
    const viewerId = req.user.id;
    
    const status = await Message.findById(statusId);
    
    if (!status) {
      return res.status(404).json({ message: "Status not found" });
    }
    
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
    }
    
    res.json({ message: "Status viewed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
export const deletestatus=async (req,res) => {
  try {
    const { statusId } = req.params;
    const userId = req.user.id;
    
    const status = await Message.findOne({
      _id: statusId,
      sender: userId,
      isStatus: true,
    });
    
    if (!status) {
      return res.status(404).json({ message: "Status not found" });
    }
    
    // TODO: Delete the media file from storage
    
    await Message.findByIdAndDelete(statusId);
    
    res.json({ message: "Status deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

