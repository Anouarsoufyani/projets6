import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
const app = express();
dotenv.config();

import authRoutes from "./Routes/AuthRoutes.js";
import commandeRoutes from "./Routes/CommandeRoutes.js";
import userRoutes from "./Routes/UserRoutes.js";

import connectDB from "./DB/Connect.js";

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use("/api/auth", authRoutes);
app.use("/api/commandes", commandeRoutes);
app.use("/api/user", userRoutes);

app.listen(process.env.PORT, () => {
    connectDB();
    console.log(
        `Example app listening on http://localhost:${process.env.PORT}`
    );
});
