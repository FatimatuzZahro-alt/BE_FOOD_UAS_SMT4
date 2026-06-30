import express from "express";
import cors from "cors";

import authRoute from "./routes/authRoute.js";
import restaurantRoute from "./routes/restaurantRoute.js";
import menuRoute from "./routes/menuRoute.js";
import fasilitasRoute from "./routes/fasilitasRoute.js";
import ratingRoute from "./routes/ratingRoute.js";
import rekomendasiRoute from "./routes/rekomendasiRoute.js";
import userRoute from "./routes/userRoute.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Ini adalah api untuk aplikasi Restourant Recommendation");
});

app.use("/auth", authRoute);
app.use("/restaurant", restaurantRoute);
app.use("/menu", menuRoute);
app.use("/fasilitas", fasilitasRoute);
app.use("/rating", ratingRoute);
app.use("/rekomendasi", rekomendasiRoute);
app.use("/user", userRoute);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});