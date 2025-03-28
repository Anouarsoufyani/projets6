import express from "express";
import {
  updateProfile,
  toggleActive,
  updateUserPosition,
  getAvailableLivreurs
} from "../Controllers/UserController.js";
import { protectRoute } from "../Middleware/protectRoute.js";
import { protectLivreur } from "../Middleware/protectLivreur.js";

const router = express.Router();

// router.post("/new", protectRoute, createCommande);
router.put("/update", protectRoute, updateProfile);
router.post("/active", protectRoute, toggleActive);
router.put(
  "/:userId/position",
  protectRoute,
  protectLivreur,
  updateUserPosition
);
router.get("/livreurs/available", protectRoute, getAvailableLivreurs);
// router.get("/:id", protectRoute, getCommandeById);

export default router;
