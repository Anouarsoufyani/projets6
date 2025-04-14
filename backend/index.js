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
// Ajouter cet import avec les autres imports de routes
import reviewRoutes from "./Routes/ReviewRoutes.js";

dotenv.config();

const app = express();

const server = createServer(app);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialise Socket.IO
const io = new Server(server, {
    cors: {
        origin: "*", // ✅ OK pour dev, sécurise en prod
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

// CORS
app.use(
    cors({
        origin: [
            "http://localhost:3000",
            "https://projets6.vercel.app",
            "https://projets6-front.onrender.com",
        ], // ✅ adapte si tu sers le front ici
        credentials: true,
    })
);

// Middlewares globaux
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Routes API
app.use("/api/auth", authRoutes);
app.use("/api/commandes", commandeRoutes);
app.use("/api/user", userRoutes);
app.use("/api/documents", docRoutes);
app.use("/api/notifications", notificationRoutes);
// Ajouter cette ligne avec les autres app.use pour les routes
app.use("/api/reviews", reviewRoutes);

// Sert les fichiers statiques (PDF, images, etc.)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Sert le frontend s’il est buildé dans client/dist
app.use(express.static(path.join(__dirname, "../client/dist")));

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

// Port
const PORT = process.env.PORT || 5001;

// Lancer le serveur
server.listen(PORT, () => {
    connectDB(); // Connexion MongoDB
    console.log(`🚀 Server started on http://localhost:${PORT}`);
});
