import express from "express";
const router = express.Router();
import {
    createReview,
    getUserReviews,
    getReviewsForUser,
} from "../Controllers/ReviewController.js";
import { protectRoute } from "../Middleware/protectRoute.js";


router.post("/", protectRoute, createReview);


router.get("/my-reviews", protectRoute, getUserReviews);


router.get("/user/:userId", getReviewsForUser);

export default router;
