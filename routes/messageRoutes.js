import express from "express";
import { activestatus, deletestatus, getMessages ,getstatusviews,getunread,lastmsg,statusviewed,Uploadstatus} from "../controllers/messageController.js";
import { auth } from "../middleware/auth.js";
import upload from "../config/multer.js";
const router = express.Router();

router.get("/:user1Id/:user2Id", getMessages);
router.get("/last/:userId/:otherUserId", lastmsg);
router.get("/unread/:userId/:senderId", getunread);
router.post("/upload",auth,upload.single('media'), Uploadstatus);
router.get("/active",auth,activestatus);
router.get("/my-status-views",auth,getstatusviews);
router.post("/view/:statusId",auth,statusviewed);
router.delete("/:statusId",auth,deletestatus);

export default router;
