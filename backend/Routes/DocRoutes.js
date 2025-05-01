import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import { protectRoute } from "../Middleware/protectRoute.js";
import {
    uploadDocuments,
    getDocumentsAdmin,
    updateDocumentStatus,
    updateDocument,
    deleteDocument,
} from "../Controllers/DocController.js";

const router = express.Router();

// Multer config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join("uploads", req.user.id);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        console.log(file);
        console.log(cb);

        const ext = path.extname(file.originalname);
        const safeName = file.originalname
            .replace(/[^a-z0-9]/gi, "_")
            .toLowerCase();
        cb(null, `${Date.now()}${ext}`);
    },
});
const upload = multer({ storage });

// Routes
router.post(
    "/upload",
    protectRoute,
    upload.array("documents"),
    uploadDocuments
);
router.get("/admin", protectRoute, getDocumentsAdmin);
router.patch(
    "/admin/:userId/documents/:docIndex",
    protectRoute,
    updateDocumentStatus
);
router.put(
    "/update/:documentId",
    protectRoute,
    upload.single("document"),
    updateDocument
);

router.delete("/delete/:documentId", protectRoute, deleteDocument);

export default router;
