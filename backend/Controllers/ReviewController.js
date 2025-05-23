import Review from "../Models/Review.js";
import userModels from "../Models/User.js";
const { User } = userModels;
import mongoose from "mongoose";


export const createReview = async (req, res) => {
    try {
        const { targetId, targetType, rating, comment, commandeId } = req.body;
        const userId = req.user._id;

        


        const existingReview = await Review.findOne({
            auteur: userId,
            cible: targetId,
            commande: commandeId,
        });

        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: "Vous avez déjà laissé un avis pour cette commande",
            });
        }

        const auteurUser = await User.findById(userId).select("-password");
        const cibleUser = await User.findById(targetId).select("-password");

        if (!auteurUser || !cibleUser) {
            return res
                .status(404)
                .json({ success: false, error: "Auteur ou cible introuvable" });
        }


        const review = new Review({
            auteur: userId,
            cible: targetId,
            roleCible: targetType, 
            note: rating,
            commentaire: comment,
            commande: commandeId || null,
        });

        await review.save();


        const allReviews = await Review.find({ cible: targetId });
        const totalRating = allReviews.reduce(
            (sum, review) => sum + review.note,
            0
        );
        const averageRating = totalRating / allReviews.length;

        if (cibleUser.note_moyenne !== undefined) {
            cibleUser.note_moyenne = averageRating.toFixed(1);
            await cibleUser.save();
        }

        return res.status(201).json({
            success: true,
            review,
            message: "Avis créé avec succès",
        });
    } catch (err) {
        console.error("Erreur lors de la création de l'avis:", err);
        return res.status(500).json({
            success: false,
            message: "Erreur lors de la création de l'avis",
            error: err.message,
        });
    }
};


export const getUserReviews = async (req, res) => {
    try {
        const userId = req.user._id;

        const reviews = await Review.find({ auteur: userId })
            .sort({ createdAt: -1 })
            .populate("cible", "nom email nom_boutique")
            .populate("commande", "numero");


        const formattedReviews = reviews.map((review) => ({
            _id: review._id,
            targetId: review.cible._id,
            targetName: review.cible.nom_boutique || review.cible.nom,
            targetType: review.roleCible,
            rating: review.note,
            comment: review.commentaire,
            commandeId: review.commande ? review.commande._id : null,
            commandeNumero: review.commande ? review.commande.numero : null,
            createdAt: review.createdAt,
        }));

        return res.status(200).json({
            success: true,
            reviews: formattedReviews,
        });
    } catch (err) {
        console.error("Erreur lors de la récupération des avis:", err);
        return res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération des avis",
            error: err.message,
        });
    }
};


export const getReviewsForUser = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "ID d'utilisateur invalide",
            });
        }

        const reviews = await Review.find({ cible: userId })
            .sort({ createdAt: -1 })
            .populate("auteur", "nom email")
            .populate("commande", "numero");


        const formattedReviews = reviews.map((review) => ({
            _id: review._id,
            clientId: review.auteur._id,
            clientName: review.auteur.nom,
            rating: review.note,
            comment: review.commentaire,
            commandeId: review.commande ? review.commande._id : null,
            createdAt: review.createdAt,
        }));

        return res.status(200).json({
            success: true,
            reviews: formattedReviews,
        });
    } catch (err) {
        console.error("Erreur lors de la récupération des avis:", err);
        return res.status(500).json({
            success: false,
            message: "Erreur lors de la récupération des avis",
            error: err.message,
        });
    }
};
