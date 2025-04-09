import express from 'express'
import { protectRoute } from '../Middleware/protectRoute.js';
import { deleteNotifications, getNotifications } from '../Controllers/NotificationController.js';

const router = express.Router();

router.get("/", protectRoute, getNotifications);
router.delete("/", protectRoute, deleteNotifications);

export default router;