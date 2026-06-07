import express from "express";
import { login, register } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register); //endpoint untuk register
router.post("/login", login); //endpoint untuk login


export default router;