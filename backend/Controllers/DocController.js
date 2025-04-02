import userModels from "../Models/User.js";
const { User, Client, Commercant, Livreur, Admin } = userModels;
import fs from "fs";
import path from "path";

// Gérer l'upload
export const uploadDocuments = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).send("Utilisateur non trouvé");

        const docs = req.files.map((file) => ({
            nom: file.originalname,
            url: file.path,
            statut: "en attente",
        }));

        user.documents.push(...docs);
        user.statut = "en vérification";
        await user.save();

        res.status(200).json({ message: "Documents soumis avec succès" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

// Voir les documents pour l'admin
export const getDocumentsAdmin = async (req, res) => {
    if (req.user.role !== "admin") return res.status(403).send("Accès refusé");
    const users = await User.find({ role: "livreur" });
    res.json(users.map((u) => ({ id: u._id, nom: u.nom, docs: u.documents })));
};

// Valider / refuser
export const updateDocumentStatus = async (req, res) => {
    const { userId, docIndex } = req.params;
    const { action } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).send("Utilisateur non trouvé");

    user.documents[docIndex].statut =
        action === "valider" ? "validé" : "refusé";

    // Vérifie si tous les docs sont validés
    if (user.documents.every((doc) => doc.statut === "validé")) {
        user.statusVerification = "vérifié";
    }

    await user.save();
    res.send("Statut mis à jour");
};
