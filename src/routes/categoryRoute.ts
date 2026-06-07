import {
    getCategories,
    createCategory,
    getCategoryById,
    updateCategory,
    deleteCategory,
} from "./../controllers/CategoryControllers";
import express from "express";

const router = express.Router();

router.get("/", getCategories); //menampilkan data categori
router.post("/", createCategory); //menyimpan data categori
router.get("/:id", getCategoryById); //menampilkan categori by  id
router.put("/:id", updateCategory); //mengupdate data categori by id
router.delete("/:id", deleteCategory); //menghapus data categori by id

export default router;