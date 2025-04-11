import express from "express";
import { protectRoute } from "../Middleware/protectRoute.js";
import {
    deleteNotifications,
    getNotifications,
    markAsReadNotifications,
} from "../Controllers/NotificationController.js";

const router = express.Router();

router.get("/", protectRoute, getNotifications);
router.delete("/delete/:notificationId", protectRoute, deleteNotifications);
router.put("/read/:notificationId", protectRoute, markAsReadNotifications);

export default router;
