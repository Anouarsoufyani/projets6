import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { createServer } from "http"; // Create HTTP server
import { Server } from "socket.io"; // Socket.IO

const app = express();
dotenv.config();

import authRoutes from "./Routes/AuthRoutes.js";
import commandeRoutes from "./Routes/CommandeRoutes.js";
import userRoutes from "./Routes/UserRoutes.js";

import connectDB from "./DB/Connect.js";

// Create HTTP server
const server = createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
    cors: {
        origin: "*", // Adjust according to your frontend URL
        methods: ["GET", "POST"],
    },
});

// Handle socket connections
io.on("connection", (socket) => {
    console.log("✅ A user has connected:", socket.id);

    // Handle position update from the frontend
    socket.on("updatePosition", (data) => {
        console.log("📍 Position updated for livreur:", data.livreurId, data.position);

        // Process the position (e.g., update database, broadcast to other clients, etc.)
        // For example, you could emit it to other clients or store it in your DB
        io.emit("livreurPositionUpdate", data); // Broadcast to all connected clients
    });

    socket.on("disconnect", () => {
        console.log("❌ A user has disconnected:", socket.id);
    });
});

app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/commandes", commandeRoutes);
app.use("/api/user", userRoutes);

const PORT = process.env.PORT || 5000;

// Start the server with Socket.IO
server.listen(PORT, () => {
    connectDB();
    console.log(`🚀 Server started on port ${PORT}`);
});
