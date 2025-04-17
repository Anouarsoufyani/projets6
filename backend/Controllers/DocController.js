import userModels from "../Models/User.js";
const { User, Client, Commercant, Livreur, Admin } = userModels;
import fs from "fs";
import path from "path";

// Gérer l'upload
export const uploadDocuments = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).send("Utilisateur non trouvé");

        // const docs = req.files.map((file) => ({
        //     nom: file.originalname,
        //     url: file.path,
        //     label: file.originalname,
        //     statut: "en attente",
        // }));

        const labels = Array.isArray(req.body.labels)
            ? req.body.labels
            : [req.body.labels]; // gérer un seul label
        console.log("labels", labels);

        const docs = req.files.map((file, index) => ({
            nom: file.originalname,
            url: file.path,
            statut: "en attente",
            label: labels[index] || "non spécifié",
        }));

        // console.log("docs", docs);

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

    // 1. Met à jour le statut du document
    const doc = user.documents[docIndex];
    doc.statut = action === "valider" ? "validé" : "refusé";

    // 2. Vérifie si les documents généraux sont valides
    const hasCarteIdentite = user.documents.some(
        (d) => d.label === "carte d'identité" && d.statut === "validé"
    );
    const hasPhotoTete = user.documents.some(
        (d) => d.label === "photo de votre tête" && d.statut === "validé"
    );

    // Vélo et autres : pas de documents spécifiques
    if (hasCarteIdentite && hasPhotoTete) {
        user.vehicules = user.vehicules.map((v) => {
            if (["vélo", "autres"].includes(v.type)) {
                v.statut = "vérifié";
            }
            return v;
        });
    }

    // 3. Moto
    const motoDocsOk = [
        "permis moto",
        "carte grise moto",
        "assurance moto",
    ].every((label) =>
        user.documents.some((d) => d.label === label && d.statut === "validé")
    );

    if (hasCarteIdentite && hasPhotoTete && motoDocsOk) {
        user.vehicules = user.vehicules.map((v) => {
            if (v.type === "moto") v.statut = "vérifié";
            return v;
        });
    }

    // 4. Voiture
    const voitureDocsOk = [
        "permis voiture",
        "carte grise voiture",
        "assurance voiture",
    ].every((label) =>
        user.documents.some((d) => d.label === label && d.statut === "validé")
    );

    if (hasCarteIdentite && hasPhotoTete && voitureDocsOk) {
        user.vehicules = user.vehicules.map((v) => {
            if (v.type === "voiture") v.statut = "vérifié";
            return v;
        });
    }

    // 5. Statut global du livreur
    const allDocsValid = user.documents.every((d) => d.statut === "validé");
    user.statut = allDocsValid ? "vérifié" : "en vérification";

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
        // if (doc.statut === "validé")
        //     return res.status(403).send("Ce document a déjà été validé");

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
        doc.statut = "non soumis";

        user.statut = "en vérification";
        await user.save();

        res.status(200).json({ message: "Document marqué comme supprimé" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur lors de la suppression" });
    }
};
