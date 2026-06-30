import {
    getAllRestaurants,
    getRestaurantById,
    createRestaurant,
    updateRestaurant,
    deleteRestaurant,
    getMyRestaurant,
} from "../controllers/restaurantControllers";
import express from "express";
import { authenticate, authorize } from "../midlewares/authMiddleware.js";

const router = express.Router();

router.get("/", getAllRestaurants); //menampilkan data categori
router.post("/", authenticate, authorize("RESTAURANT_ADMIN"), createRestaurant); //menyimpan data categori
router.get("/:id", getRestaurantById); //menampilkan categori by  id
router.put("/:id", authenticate, authorize("RESTAURANT_ADMIN"), updateRestaurant); //mengupdate data categori by id
router.delete("/:id", authenticate, authorize("RESTAURANT_ADMIN"), deleteRestaurant); //menghapus data categori by id
router.get("/me", authenticate, authorize("RESTAURANT_ADMIN"), getMyRestaurant);

export default router;