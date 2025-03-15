import Commande from "../Models/Commandes.js";

export const protectSuivi = async (req, res, next) => {
    const { id } = req.params;

    console.log("id", id);
    console.log("USR USUUSUSUUSUSUSUSUSUSU", req.user);

    try {
        const commande = await Commande.findById(id);
        console.log("commande", commande);

        if (
            !(
                commande.client_id.equals(req.user._id) ||
                commande.livreur_id.equals(req.user._id) ||
                commande.commercant_id.equals(req.user._id)
            )
        ) {
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
