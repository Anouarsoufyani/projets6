import mongoose from "mongoose";

const CommandeSchema = new mongoose.Schema({
    client_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    }, 
    commercant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    }, 
    livreur_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },

    total: {
        type: Number,
        required: true,
    },
    statut: {
        type: String,
        enum: [
            "en_attente",
            "refusee",
            "en_preparation",
            "prete_a_etre_recuperee",
            "recuperee_par_livreur",
            "livree",
            "annulee",
            "probleme",
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
    date_creation: {
        type: Date,
        default: Date.now,
    },
    date_recuperation: {
        type: Date,
    },
    date_livraison: {
        type: Date,
    }, 
    code_Client: {
        type: String,
        default: () => Math.floor(1000 + Math.random() * 9000).toString(),
    },
    code_Commercant: {
        type: String,
        default: () => Math.floor(1000 + Math.random() * 9000).toString(),
    },
    is_commercant_verifie: {
        type: Boolean,
        default: false,
    },
    is_client_verifie: {
        type: Boolean,
        default: false,
    },
    itineraire_parcouru_commercant: [
        {
            position: {
                lat: Number,
                lng: Number,
            },
            timestamp: {
                type: Date,
                default: Date.now,
            },
        },
    ],
    itineraire_parcouru_client: [
        {
            position: {
                lat: Number,
                lng: Number,
            },
            timestamp: {
                type: Date,
                default: Date.now,
            },
        },
    ],
});


CommandeSchema.index({ client_id: 1 });
CommandeSchema.index({ commercant_id: 1 });
CommandeSchema.index({ livreur_id: 1 });
CommandeSchema.index({ statut: 1 });

const Commande = mongoose.model("Commande", CommandeSchema);

export default Commande;
