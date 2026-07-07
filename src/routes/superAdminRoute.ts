import {
    getAllUsers,
    getUserById,
    updateUserById,
    deleteUserById,
    getAllRestaurants,
    getRestaurantById,
    updateRestaurantById,
    deleteRestaurantById,
    getAllRatings,
    getDashboard,
}   from "../controllers/superAdminControllers.js";
import express from "express";
import { authenticate, authorize } from "../midlewares/authMiddleware.js";

const router = express.Router();

router.get("/users", authenticate, authorize("SUPER_ADMIN"), getAllUsers);
router.get("/users/:id", authenticate, authorize("SUPER_ADMIN"), getUserById);
router.put("/users/:id", authenticate, authorize("SUPER_ADMIN"), updateUserById);
router.delete("/users/:id", authenticate, authorize("SUPER_ADMIN"), deleteUserById);
router.get("/restaurants", authenticate, authorize("SUPER_ADMIN"), getAllRestaurants);
router.get("/restaurant/:id", authenticate, authorize("SUPER_ADMIN"), getRestaurantById);
router.put("/restaurant/:id", authenticate, authorize("SUPER_ADMIN"), updateRestaurantById);
router.delete("/restaurant/:id", authenticate, authorize("SUPER_ADMIN"), deleteRestaurantById);
router.get("/ratings", authenticate, authorize("SUPER_ADMIN"), getAllRatings);
router.get("/dashboard", authenticate, authorize("SUPER_ADMIN"), getDashboard);

export default router;
