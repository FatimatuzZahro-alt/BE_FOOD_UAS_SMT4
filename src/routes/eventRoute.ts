<<<<<<< HEAD
import {
    getEvents,
    createEvent,
    getEventById,
    updateEvent,
    deleteEvent,
} from "./../controllers/eventController";
import express from "express";

const router = express.Router();

router.get("/", getEvents); //menampilkan data event
router.post("/", createEvent); //menyimpan data event
router.get("/:id", getEventById); //menampilkan event by  id
router.put("/:id", updateEvent); //mengupdate data event by id
router.delete("/:id", deleteEvent); //menghapus data event by id

=======
import {
    getEvents,
    createEvent,
    getEventById,
    updateEvent,
    deleteEvent,
} from "./../controllers/eventController";
import express from "express";

const router = express.Router();

router.get("/", getEvents); //menampilkan data event
router.post("/", createEvent); //menyimpan data event
router.get("/:id", getEventById); //menampilkan event by  id
router.put("/:id", updateEvent); //mengupdate data event by id
router.delete("/:id", deleteEvent); //menghapus data event by id

>>>>>>> 2fac8cfae754bc637848f97e3af7df95ca5fd8ff
export default router;