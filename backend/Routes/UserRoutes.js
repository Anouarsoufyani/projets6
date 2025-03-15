import express from "express";
import { updateProfile } from "../Controllers/UserController.js";
import { protectRoute } from "../Middleware/protectRoute.js";

const router = express.Router();

// router.post("/new", protectRoute, createCommande);
router.put("/update", protectRoute, updateProfile);
// router.get("/:id", protectRoute, getCommandeById);

export default router;
