import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./DB/Connect.js";

import authRoutes from "./Routes/AuthRoutes.js";
import commandeRoutes from "./Routes/CommandeRoutes.js";
import userRoutes from "./Routes/UserRoutes.js";
import docRoutes from "./Routes/DocRoutes.js";

dotenv.config();

const app = express();

// Crée le serveur HTTP
const server = createServer(app);

// Convertit import.meta.url pour avoir __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialise Socket.IO
const io = new Server(server, {
    cors: {
        origin: "*", // Autorise tous les domaines en dev
        methods: ["GET", "POST"],
    },
});

// WebSocket : écoute des connexions
io.on("connection", (socket) => {
    console.log("✅ A user has connected:", socket.id);

    socket.on("updatePosition", (data) => {
        console.log(
            "📍 Position updated for livreur:",
            data.livreurId,
            data.position
        );
        io.emit("livreurPositionUpdate", data); // broadcast à tous
    });

    socket.on("disconnect", () => {
        console.log("❌ A user has disconnected:", socket.id);
    });
});

// Middlewares globaux
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Routes API
app.use("/api/auth", authRoutes);
app.use("/api/commandes", commandeRoutes);
app.use("/api/user", userRoutes);
app.use("/api/documents", docRoutes);

// ✅ Sert les fichiers statiques (PDF, images, etc.)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Port
const PORT = process.env.PORT || 5000;

// Lancer le serveur
server.listen(PORT, () => {
    connectDB(); // Connexion MongoDB
    console.log(`🚀 Server started on http://localhost:${PORT}`);
});
