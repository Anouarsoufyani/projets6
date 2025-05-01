import Commande from "../Models/Commandes.js";

export const protectSuivi = async (req, res, next) => {
    const { id } = req.params;

    try {
        const commande = await Commande.findById(id);

        const hasLivreur =
            commande.livreur_id !== undefined && commande.livreur_id !== null;

        if (
            !(
                commande.client_id.equals(req.user._id) ||
                (hasLivreur && commande.livreur_id.equals(req.user._id)) ||
                commande.commercant_id.equals(req.user._id) ||
                req.user.role === "admin"
            )
        ) {
            console.log("forbidden");

            return res.status(403).json({
                success: false,
                error: "Forbidden : Access denied",
            });
        }
        

        next();
    } catch (error) {
        console.log("Error protecting route", error.message);
        return res
            .status(500)
            .json({ success: false, error: "Internal server error" });
    }
};
