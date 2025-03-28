import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
// import { createServer } from "http";
// import { initializeSocket } from "./socket/orderSocket.js";
const app = express();
dotenv.config();

import authRoutes from "./Routes/AuthRoutes.js";
import commandeRoutes from "./Routes/CommandeRoutes.js";
import userRoutes from "./Routes/UserRoutes.js";

import connectDB from "./DB/Connect.js";

// Configure Socket.IO avec le serveur HTTP

// Middleware pour accéder à io depuis les routes

// Create HTTP server
// const server = createServer(app);

// // Initialize Socket.IO
// initializeSocket(server);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use("/api/auth", authRoutes);
app.use("/api/commandes", commandeRoutes);
app.use("/api/user", userRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  connectDB();
  console.log(`Serveur démarré sur le port ${PORT}`);
});
