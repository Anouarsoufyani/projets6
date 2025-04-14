import express from "express";
import {
    createCommande,
    getCommandes,
    getCommandeById,
    cancelCommande,
    getLivreurInfo,
    getCodeClient,
    getCodeCommercant,
    validation_codeCL,
    validation_codeCom,
    assignLivreur,
    updateCommandeStatus,
    requestLivreur,
    updateCommandeItineraire,
} from "../Controllers/CommandeController.js";
import { protectRoute } from "../Middleware/protectRoute.js";
import { protectSuivi } from "../Middleware/protectSuivi.js";
import { protectCommercant } from "../Middleware/protectCommercant.js";
import { protectLivreur } from "../Middleware/protectLivreur.js";

const router = express.Router();

router.post("/new", protectRoute, createCommande);
router.get("/", protectRoute, getCommandes);
router.get("/:id", protectRoute, protectSuivi, getCommandeById);
router.post("/cancel/:id", protectRoute, cancelCommande);
router.get("/:id/livreur-info", protectRoute, getLivreurInfo);
router.get("/code/:id/client", protectRoute, getCodeClient);
router.get("/code/:id/commercant", protectRoute, getCodeCommercant);
router.post("/code/validationClient", protectRoute, validation_codeCL);
router.post("/code/validationCommercant", protectRoute, validation_codeCom);
router.post("/assign-livreur", protectRoute, assignLivreur);
router.post(
    "/request-livreur",
    protectRoute,
    protectCommercant,
    requestLivreur
);
router.post("/update-status", protectRoute, updateCommandeStatus);
router.post(
    "/:id/itineraire",
    protectRoute,
    protectLivreur,
    updateCommandeItineraire
);

export default router;
