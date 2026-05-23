<<<<<<< HEAD
import {
    getPembicara,
    getPembicaraById,
    createPembicara,
    updatePembicara,
    deletePembicara,
} from "../controllers/pembicaraController";
import express from "express";

const router = express.Router ();

router.get("/", getPembicara); //menampilkan data pembicara
router.post("/", createPembicara); //menyimpan data pembicara
router.get("/:id", getPembicaraById); //menampilkan pembicara by id
router.put("/:id", updatePembicara); //mengupdate data pembicara by id
router.delete("/:id", deletePembicara); //menghapus data pembicara by id

=======
import {
    getPembicara,
    getPembicaraById,
    createPembicara,
    updatePembicara,
    deletePembicara,
} from "../controllers/pembicaraController";
import express from "express";

const router = express.Router ();

router.get("/", getPembicara); //menampilkan data pembicara
router.post("/", createPembicara); //menyimpan data pembicara
router.get("/:id", getPembicaraById); //menampilkan pembicara by id
router.put("/:id", updatePembicara); //mengupdate data pembicara by id
router.delete("/:id", deletePembicara); //menghapus data pembicara by id

>>>>>>> 2fac8cfae754bc637848f97e3af7df95ca5fd8ff
export default router;