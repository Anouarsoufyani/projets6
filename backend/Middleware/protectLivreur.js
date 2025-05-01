import User from "../Models/User.js";

export const protectLivreur = async (req, res, next) => {
    try {
        // Vérifier si l'utilisateur existe dans la requête (ajouté par protectRoute)
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: "Non autorisé - Utilisateur non authentifié",
            });
        }

        // Vérifier si l'utilisateur est un livreur
        if (req.user.role !== "livreur") {
            return res.status(403).json({
                success: false,
                error: "Accès refusé - Réservé aux livreurs",
            });
        }

        // Vérifier que l'ID dans les paramètres correspond à l'utilisateur connecté
        const { userId } = req.params;
        if (userId && userId !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                error: "Accès refusé - Vous ne pouvez pas modifier la position d'un autre livreur",
            });
        }

        next();
    } catch (error) {
        console.log("Erreur dans protectLivreur:", error.message);
        return res.status(500).json({
            success: false,
            error: "Erreur serveur interne",
        });
    }
};
