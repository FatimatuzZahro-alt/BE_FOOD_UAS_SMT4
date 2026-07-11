import express from 'express';
import { 
    getRatingByRestaurant,
    createRating,
    updateRating,
    deleteRating,
    getMyRatings,

 } from '../controllers/ratingControllers.js';
import { authenticate, authorize } from "../midlewares/authMiddleware.js";

const router = express.Router();

router.get("/my-ratings", authenticate, getMyRatings);
router.get("/restaurant/:restaurantId", getRatingByRestaurant); //bisa buat semua user
router.post("/restaurant/:restaurantId", authenticate, authorize("CUSTOMER"), createRating);
router.put("/:id", authenticate, authorize("CUSTOMER"), updateRating);
router.delete("/:id", authenticate, deleteRating);


export default router;