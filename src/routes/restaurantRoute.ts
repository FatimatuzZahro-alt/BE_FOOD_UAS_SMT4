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

router.get("/", getAllRestaurants);
router.post("/", authenticate, authorize("RESTAURANT_ADMIN"), createRestaurant);


router.get("/me", authenticate, authorize("RESTAURANT_ADMIN"), getMyRestaurant);
router.get("/dashboard", authenticate, authorize("RESTAURANT_ADMIN"), getDashboardRestaurant);


router.get("/:id", getRestaurantById);
router.put("/:id", authenticate, authorize("RESTAURANT_ADMIN"), updateRestaurant);
router.delete("/:id", authenticate, authorize("RESTAURANT_ADMIN"), deleteRestaurant);

export default router;