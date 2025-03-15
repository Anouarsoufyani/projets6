import express from "express";
import {
    createCommande,
    getCommandes,
    getCommandeById,
} from "../Controllers/CommandeController.js";
import { protectRoute } from "../Middleware/protectRoute.js";

const router = express.Router();

router.post("/new", protectRoute, createCommande);
router.get("/", protectRoute, getCommandes);
router.get("/:id", protectRoute, getCommandeById);

export default router;
