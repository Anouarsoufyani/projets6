import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId, // ref: refer to the id of the model
            ref: "User", // the id will be of the user model
            required: true,
        },
        receiver: {
            type: mongoose.Schema.Types.ObjectId, // ref: refer to the id of the model
            ref: "User", // the id will be of the user model
            required: true,
        },
        commande_id: {
            type: mongoose.Schema.Types.ObjectId, // ref: refer to the id of the model
            ref: "Commande", // the id will be of the commande model
        },
        description: {
            type: String,
        },
        isRequest: {
            type: Boolean,
            default: false,
        },
        isAccepted: {
            type: Boolean,
            default: function () {
                return this.isRequest ? false : undefined;
            },
        },
        isRefused: {
            type: Boolean,
            default: function () {
                return this.isRequest ? false : undefined;
            },
        },
        priority: {
            type: Number,
            default: 0,
        },
        score: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: false,
        },
        expiresAt: {
            type: Date,
            default: null,
        },
        responseTime: {
            type: Date,
            default: null,
        },
        refusalReason: {
            type: String,
            default: null,
        },
        metadata: {
            type: Object,
            default: {},
        },
        type: {
            type: String,
            required: true,
            enum: [
                "commande",
                "refus de commande",
                "livraison",
                "refus de livraison",
                "acceptation de livraison",
                "acceptation de commande",
                "annulation de commande",
                "modification de commande",
                "nouvelle commande",
                "nouvelle commande assignée",
                "nouveau livreur assigné",
                "commande recuperee",
                "commande livree",
                "nouvelle livraison",
                "nouveau refus de livraison",
                "nouvelle acceptation de livraison",
                "nouvelle demande de livraison",
                "nouvelle annulation de commande",
                "nouvelle modification de commande",
                "Adresse introuvable ou incorrecte",
                "Client injoignable",
                "Problème avec le véhicule (panne, crevaison)",
                "Commande endommagée ou incomplète",
                "Temps d'attente trop long au point de retrait",
                "Accident ou blessure pendant la livraison",
                "Accès impossible (porte bloquée, code erroné, barrière fermée)",
                "Comportement agressif ou menaçant d'un client",
                "Commande non livrée",
                "Commande incomplète ou erronée",
                "Produit endommagé ou renversé",
                "Retard de livraison important",
                "Livreur impoli ou comportement inapproprié",
                "Article manquant ou remplacé sans consentement",
            ],
        },
        read: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
