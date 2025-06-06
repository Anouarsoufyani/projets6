import express from "express";
import {
    updateProfile,
    toggleActive,
    updateUserPosition,
    getAvailableLivreurs,
    getUsersByRole,
    getLivreurDocuments,
    updateLivreurDocuments,
    getUserById,
    addVehicules,
    updateCurrentVehicle,
    updateUserInfo,
    updateStatut,
    
} from "../Controllers/UserController.js";
import { protectRoute } from "../Middleware/protectRoute.js";
import { protectLivreur } from "../Middleware/protectLivreur.js";
import { protectAdmin } from "../Middleware/protectAdmin.js";

const router = express.Router();

router.put("/update", protectRoute, updateProfile);
router.post("/active", protectRoute, toggleActive);
router.put(
    "/:userId/position",
    protectRoute,
    protectLivreur,
    updateUserPosition
);
router.get("/livreurs/available", protectRoute, getAvailableLivreurs);
router.get("/gestion/:role", protectRoute, getUsersByRole);
router.get(
    "/livreur/:id/pieces",
    protectRoute,
    protectAdmin,
    getLivreurDocuments
);
router.patch(
    "/livreur/:livreurId/pieces/:documentId",
    protectRoute,
    protectAdmin,
    updateLivreurDocuments
);
router.get("/:id", protectRoute, getUserById);
router.post("/livreur/vehicules", protectRoute, protectLivreur, addVehicules);
router.put("/vehicules/current",protectRoute,protectLivreur,updateCurrentVehicle);

router.post("/updateUserform",protectRoute,updateUserInfo);
router.put("/changeStatut",protectRoute,protectAdmin,updateStatut)

  

export default router;
