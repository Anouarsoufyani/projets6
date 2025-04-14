import express from "express";
const router = express.Router();
import {
    createReview,
    getUserReviews,
    getReviewsForUser,
} from "../Controllers/ReviewController.js";
import { protectRoute } from "../Middleware/protectRoute.js";

// Route pour créer un avis
router.post("/", protectRoute, createReview);

// Route pour récupérer les avis laissés par l'utilisateur connecté
router.get("/my-reviews", protectRoute, getUserReviews);

// Route pour récupérer les avis pour un utilisateur spécifique (commerçant ou livreur)
router.get("/user/:userId", getReviewsForUser);

export default router;
