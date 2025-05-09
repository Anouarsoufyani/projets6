import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

import connectDB from "./DB/Connect.js";

import authRoutes from "./Routes/AuthRoutes.js";
import commandeRoutes from "./Routes/CommandeRoutes.js";
import userRoutes from "./Routes/UserRoutes.js";
import docRoutes from "./Routes/DocRoutes.js";
import notificationRoutes from "./Routes/NotificationRoutes.js";

import reviewRoutes from "./Routes/ReviewRoutes.js";
import adminRoutes from "./Routes/AdminRoutes.js";

dotenv.config();

const app = express();

const server = createServer(app);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"],
    },
});


io.on("connection", (socket) => {
    console.log("✅ A user has connected:", socket.id);

    socket.on("updatePosition", (data) => {
        console.log(
            "📍 Position updated for livreur:",
            data.livreurId,
            data.position
        );
        io.emit("livreurPositionUpdate", data); 
    });

    socket.on("disconnect", () => {
        console.log("❌ A user has disconnected:", socket.id);
    });
});


app.use(
    cors({
        origin: [
            "http://localhost:3000",
            "https://projets6.vercel.app",
            "https://projets6-front.onrender.com",
        ], 
        credentials: true,
    })
);


app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(express.urlencoded({ limit: "50mb", extended: true }));


connectDB();


app.use("/api/auth", authRoutes);
app.use("/api/commandes", commandeRoutes);
app.use("/api/user", userRoutes);
app.use("/api/documents", docRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);


app.use("/uploads", express.static(path.join(__dirname, "uploads")));


app.use(express.static(path.join(__dirname, "../client/dist")));

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});


const PORT = process.env.PORT || 5001;


server.listen(PORT, () => {

    console.log(`🚀 Server started on http://localhost:${PORT}`);
});
