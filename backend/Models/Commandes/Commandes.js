import mongoose from "mongoose";

const CommandeSchema = new mongoose.Schema({
    client_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    }, // Référence au client
    commercant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    }, // Référence au commerçant
    livreur_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }, // Référence au livreur (optionnel au début)
    produits: [
        {
            produit_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Produit",
                required: true,
            },
            quantite: {
                type: Number,
                required: true,
            },
            prix_unitaire: {
                type: Number,
                required: true,
            }, // Prix au moment de la commande
        },
    ],
    total: {
        type: Number,
        required: true,
    },
    statut: {
        type: String,
        enum: [
            "en_attente",
            "en_preparation",
            "en_livraison",
            "livree",
            "annulee",
        ],
        default: "en_attente",
    },
    adresse_livraison: {
        rue: String,
        ville: String,
        code_postal: String,
        lat: Number,
        lng: Number,
    },
    position_livreur: {
        lat: Number,
        lng: Number,
    }, // Pour le suivi en temps réel
    date_creation: {
        type: Date,
        default: Date.now,
    },
    date_livraison: {
        type: Date,
    }, // Rempli quand livrée
});

// Index pour accélérer les filtres
CommandeSchema.index({ client_id: 1 });
CommandeSchema.index({ commercant_id: 1 });
CommandeSchema.index({ livreur_id: 1 });
CommandeSchema.index({ statut: 1 });

const Commande = mongoose.model("Commande", CommandeSchema);

export default Commande;
