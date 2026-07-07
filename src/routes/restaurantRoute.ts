import {
    getAllRestaurants,
    getRestaurantById,
    createRestaurant,
    updateRestaurant,
    deleteRestaurant,
    getMyRestaurant,
    getDashboardRestaurant,
} from "../controllers/restaurantControllers.js";
import express from "express";
import { authenticate, authorize } from "../midlewares/authMiddleware.js";

const router = express.Router();

router.get("/", getAllRestaurants); //menampilkan data restauran
router.post("/", authenticate, authorize("RESTAURANT_ADMIN"), createRestaurant); //buat resto
router.get("/:id", getRestaurantById); //menampilkan resto by  id
router.put("/:id", authenticate, authorize("RESTAURANT_ADMIN"), updateRestaurant); //mengupdate data resto by id
router.delete("/:id", authenticate, authorize("RESTAURANT_ADMIN"), deleteRestaurant); //menghapus data resto by id
router.get("/me", authenticate, authorize("RESTAURANT_ADMIN"), getMyRestaurant);
router.get("/dashboard", authenticate, authorize("RESTAURANT_ADMIN"), getDashboardRestaurant);

export default router;