import express from "express";
import {
    createCommande,
    getCommandes,
    getCommandeById,
    cancelCommande,
} from "../Controllers/CommandeController.js";
import { protectRoute } from "../Middleware/protectRoute.js";

const router = express.Router();

router.post("/new", protectRoute, createCommande);
router.get("/", protectRoute, getCommandes);
router.get("/:id", protectRoute, getCommandeById);
router.post("/cancel/:id", protectRoute, cancelCommande);
export default router;
