import express from "express";
import { registerUser, loginUser ,getUsers,me,applogin,loginWidthToken} from "../controllers/userController.js";


const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get('/',getUsers)
router.get("/me", me);
router.get("/token/login", loginWidthToken);
router.post("/applogin", applogin);
export default router;
