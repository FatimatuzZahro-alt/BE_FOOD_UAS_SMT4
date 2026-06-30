import {
    getRekomendasi,
    getRekomendasiHistory,
    getRekomendasiDetail,
} from "../controllers/rekomendasiControllers.js";
import express from "express";
import { authenticate } from "../midlewares/authMiddleware.js"

const router = express.Router();

//semua butuh login
router.post("/", authenticate, getRekomendasi);
router.get("/history", authenticate, getRekomendasiHistory);
router.get("/:id", authenticate, getRekomendasiDetail);

export default router;