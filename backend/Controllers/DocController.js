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
        user.statut = "vérifié";
    } else {
        user.statut = "en vérification";
    }

    await user.save();
    res.send("Statut mis à jour");
};

// Mettre à jour un document existant
export const updateDocument = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).send("Utilisateur non trouvé");

        const { documentId } = req.params;
        const file = req.file;

        const doc = user.documents.id(documentId);
        if (!doc) return res.status(404).send("Document introuvable");
        if (doc.statut === "validé")
            return res.status(403).send("Ce document a déjà été validé");

        // Supprimer l'ancien fichier physiquement
        if (fs.existsSync(doc.url)) {
            fs.unlinkSync(doc.url);
        }

        // Met à jour les infos
        doc.nom = file.originalname;
        doc.url = file.path;
        doc.statut = "en attente";

        user.statut = "en vérification";
        await user.save();

        res.status(200).json({ message: "Document mis à jour" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur lors de la mise à jour" });
    }
};

// Supprimer un document
export const deleteDocument = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).send("Utilisateur non trouvé");

        const { documentId } = req.params;
        const doc = user.documents.id(documentId);
        if (!doc) return res.status(404).send("Document introuvable");
        if (doc.statut === "validé")
            return res.status(403).send("Ce document a déjà été validé");

        // Supprimer physiquement le fichier
        if (doc.url && fs.existsSync(doc.url)) {
            fs.unlinkSync(doc.url);
        }

        // On ne supprime pas l'objet, on le vide
        doc.url = null;
        doc.statut = "en attente";

        user.statut = "en vérification";
        await user.save();

        res.status(200).json({ message: "Document marqué comme supprimé" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur lors de la suppression" });
    }
};
