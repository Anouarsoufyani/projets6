import express from "express";
import {
    updateUserStatus,
    deleteUser,
    updateUserProfile,
} from "../Controllers/AdminController.js";
import { protectAdmin } from "../Middleware/protectAdmin.js";
import { protectRoute } from "../Middleware/protectRoute.js";

const router = express.Router();

router.put("/:userId/status", protectRoute, protectAdmin, updateUserStatus);

router.delete("/:userId", protectRoute, protectAdmin, deleteUser);

router.put("/:userId", protectRoute, protectAdmin, updateUserProfile);

export default router;
