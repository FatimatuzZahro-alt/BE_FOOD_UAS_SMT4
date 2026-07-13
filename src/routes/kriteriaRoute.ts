import express from "express";
import {
    getAllKriteria,
    getKriteriaById,
    createKriteria,
    updateKriteria,
    deleteKriteria,
    getSubKriteria
} from "../controllers/kriteriaControllers.js";
import { authenticate, authorize } from "../midlewares/authMiddleware.js";

const router = express.Router();

// public - siapa aja bisa lihat kriteria
router.get("/", getAllKriteria);
router.get("/sub-kriteria", getSubKriteria);
router.get("/:id", getKriteriaById);


// SUPER_ADMIN only - yang bisa kelola kriteria
router.post("/", authenticate, authorize("SUPER_ADMIN"), createKriteria);
router.put("/:id", authenticate, authorize("SUPER_ADMIN"), updateKriteria);
router.delete("/:id", authenticate, authorize("SUPER_ADMIN"), deleteKriteria);

export default router;