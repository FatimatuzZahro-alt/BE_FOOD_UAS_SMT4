<<<<<<< HEAD
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

=======
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

>>>>>>> 2fac8cfae754bc637848f97e3af7df95ca5fd8ff
export default router;