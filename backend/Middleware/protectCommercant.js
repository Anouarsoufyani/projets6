import User from "../Models/User.js";

export const protectCommercant = async (req, res, next) => {
    try {

        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: "Non autorisé - Utilisateur non authentifié",
            });
        }


        if (req.user.role !== "commercant") {
            return res.status(403).json({
                success: false,
                error: "Accès refusé - Réservé aux commerçants",
            });
        }

        next();
    } catch (error) {
        console.log("Erreur dans protectCommercant:", error.message);
        return res.status(500).json({
            success: false,
            error: "Erreur serveur interne",
        });
    }
};
