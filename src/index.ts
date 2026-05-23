
import express from "express";
import cors from "cors";

import eventRoute from "./routes/eventRoute";
import categoryRoute from "./routes/categoryRoute";
import pembicaraRoutes from "./routes/pembicaraRoutes";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Ini adalah api untuk aplikasi Infovest");
});

app.use("/events", eventRoute);
app.use("/categories", categoryRoute);
app.use("/pembicara", pembicaraRoutes);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});