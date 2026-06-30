import {
    getMenuByRestaurant,
    getMyMenus,
    createMenu,
    updateMenu,
    deleteMenu,
} from "./../controllers/menuControllers.js";
import express from "express";
import { authenticate, authorize } from "../midlewares/authMiddleware.js";

const router = express.Router();

//siapa saja bisa lihat menu
router.get("/restaurant/:restaurantId", getMenuByRestaurant);


//cuma admin resto yang bisa akses
router.get("/me",authenticate, authorize("RESTAURANT_ADMIN"), getMyMenus);
router.post("/", authenticate, authorize("RESTAURANT_ADMIN"), createMenu);
router.put("/:id", authenticate, authorize("RESTAURANT_ADMIN"), updateMenu);
router.delete("/:id", authenticate, authorize("RESTAURANT_ADMIN"), deleteMenu);

export default router;