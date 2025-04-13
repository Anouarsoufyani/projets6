import Review from "../Models/Review.js";
import { User } from "../Models/User.js"; // important si tu fais un export groupé comme dans ton modèle

export const createReview = async (req, res) => {
    try {
        const { auteur, cible, roleCible, note, commentaire, commande } =
            req.body;

        console.log("Creating review:", req.body);

        // Vérification de l'existence de l'auteur et de la cible
        const auteurUser = await User.findById(auteur).select("-password");
        const cibleUser = await User.findById(cible).select("-password");

        if (!auteurUser || !cibleUser) {
            return res
                .status(404)
                .json({ success: false, error: "Auteur ou cible introuvable" });
        }

        // Création de l'objet review
        const review = new Review({
            auteur,
            cible,
            roleCible,
            note,
            commentaire,
            commande: commande || null,
        });

        await review.save();

        return res.status(201).json({ success: true, review });
    } catch (err) {
        console.error("Erreur lors de la création de la review:", err);
        return res
            .status(500)
            .json({ success: false, error: "Erreur serveur" });
    }
};
