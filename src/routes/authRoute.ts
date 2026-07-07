import express from "express";
import { login, register, getProfile, updateProfile } from "../controllers/authController.js";
import { authenticate } from "../midlewares/authMiddleware.js";


const router = express.Router();

router.post("/register", register); //endpoint untuk register
router.post("/login", login); //endpoint untuk login
router.get("/profile", authenticate, getProfile);
router.put("/profile", authenticate, updateProfile);


export default router;