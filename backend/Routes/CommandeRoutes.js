import express from "express";
import {
  createCommande,
  getCommandes,
  getCommandeById,
  cancelCommande,
  getLivreurInfo
} from "../Controllers/CommandeController.js";
import { protectRoute } from "../Middleware/protectRoute.js";
import { protectSuivi } from "../Middleware/protectSuivi.js";
import { protectLivreur } from "../Middleware/protectLivreur.js";

const router = express.Router();

router.post("/new", protectRoute, createCommande);
router.get("/", protectRoute, getCommandes);
router.get("/:id", protectRoute, protectSuivi, getCommandeById);
router.post("/cancel/:id", protectRoute, cancelCommande);
router.get("/:id/livreur-info", protectRoute, getLivreurInfo);
export default router;
