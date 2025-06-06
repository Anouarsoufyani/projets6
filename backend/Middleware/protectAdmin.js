import User from "../Models/User.js";

export const protectAdmin = async (req, res, next) => {
    try {

        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: "Non autorisé - Utilisateur non authentifié",
            });
        }


        if (req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                error: "Accès refusé - Réservé aux administrateurs",
            });
        }

        next();
    } catch (error) {
        console.log("Erreur dans protectAdmin:", error.message);
        return res.status(500).json({
            success: false,
            error: "Erreur serveur interne",
        });
    }
};
