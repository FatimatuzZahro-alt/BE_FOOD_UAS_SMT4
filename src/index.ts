import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

import authRoute from "./routes/authRoute.js";
import restaurantRoute from "./routes/restaurantRoute.js";
import menuRoute from "./routes/menuRoute.js";
import fasilitasRoute from "./routes/fasilitasRoute.js";
import ratingRoute from "./routes/ratingRoute.js";
import rekomendasiRoute from "./routes/rekomendasiRoute.js";
import userRoute from "./routes/userRoute.js";
import superAdminRoute from "./routes/superAdminRoute.js";
import kriteriaRoute from "./routes/kriteriaRoute.js";

const app = express();
const port = process.env.PORT || 3000;
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Ini adalah api untuk aplikasi Restourant Recommendation");
});

// ← seed sementara, hapus setelah dipakai
app.get("/seed-kriteria", async (req, res) => {
    await prisma.subKriteria.createMany({
        data: [
            { kriteriaId: 1, keterangan: "Rp 0 - Rp 10.000", minNilai: 0, maxNilai: 10000, skor: 5 },
            { kriteriaId: 1, keterangan: "Rp 10.001 - Rp 20.000", minNilai: 10001, maxNilai: 20000, skor: 4 },
            { kriteriaId: 1, keterangan: "Rp 20.001 - Rp 30.000", minNilai: 20001, maxNilai: 30000, skor: 3 },
            { kriteriaId: 1, keterangan: "Rp 30.001 - Rp 40.000", minNilai: 30001, maxNilai: 40000, skor: 2 },
            { kriteriaId: 1, keterangan: "Rp 40.001 ke atas", minNilai: 40001, maxNilai: null, skor: 1 },
        ]
    });
    res.json({ message: "Seed berhasil" });
});

app.use("/auth", authRoute);
app.use("/restaurant", restaurantRoute);
app.use("/menu", menuRoute);
app.use("/fasilitas", fasilitasRoute);
app.use("/rating", ratingRoute);
app.use("/rekomendasi", rekomendasiRoute);
app.use("/user", userRoute);
app.use("/superAdmin", superAdminRoute);
app.use("/kriteria", kriteriaRoute); // ← tambah ini

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});