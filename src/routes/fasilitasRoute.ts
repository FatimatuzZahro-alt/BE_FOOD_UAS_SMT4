import express from "express";
import {
    getFasilitasByRestaurant,
    addFasilitas,
    updateFasilitas,
    deleteFasilitas,
} from "../controllers/fasilitasControllers.js";
import { authorize, authenticate } from "../midlewares/authMiddleware.js";
import { deleteRestaurant } from "../controllers/restaurantControllers.js";

const router = express.Router()

//bisa diakses semua user
router.get("/restaurant/:restaurantId", getFasilitasByRestaurant);

//diakses admin resto saja
router.post("/", authenticate, authorize("RESTAURANT_ADMIN"), addFasilitas);
router.put("/:id", authenticate, authorize("RESTAURANT_ADMIN"), updateFasilitas);
router.delete("/:id", authenticate, authorize("RESTAURANT_ADMIN"), deleteFasilitas);

export default router;