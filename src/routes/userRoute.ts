import {
    getAllUser,
    updateProfile
} from "../controllers/userControllers";
import express from "express";
import { authenticate, authorize } from "../midlewares/authMiddleware.js";

const router = express.Router();

router.get("/", authenticate, authorize("RESTAURANT_ADMIN"), getAllUser);
router.put("/profile", authenticate, updateProfile);

export default router;