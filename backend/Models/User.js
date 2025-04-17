import mongoose from "mongoose";

const BaseUserSchema = new mongoose.Schema(
    {
        nom: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
            minLength: 6,
        },
        numero: {
            type: String,
            required: true,
            unique: true,
        },
        role: {
            type: String,
            enum: ["livreur", "client", "commercant", "admin"],
            required: true,
        },
        profilePic: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
        discriminatorKey: "role",
    }
);

const User = mongoose.model("User", BaseUserSchema);

const AdminSchema = new mongoose.Schema({});

const Admin = User.discriminator("admin", AdminSchema);

const LivreurSchema = new mongoose.Schema({
    vehicules: [
        {
            type: {
                type: String,
                enum: ["voiture", "moto", "vélo", "autres"],
                required: true,
            },
            plaque: {
                type: String,
                unique: true,
            },
            couleur: {
                type: String,
                default: "inconnue",
            },
            capacite: {
                type: Number,
                min: 1,
                max: 100,
                default: 50,
            },
            statut: {
                type: String,
                emum: ["non vérifié", "vérifié", "refusé", "en vérification"],
                default: "non vérifié",
                required: true,
            },
            current: {
                type: Boolean,
                default: false,
            },
        },
    ],
    position: {
        lat: {
            type: Number,
            default: null,
        },
        lng: {
            type: Number,
            default: null,
        },
    },
    statut: {
        type: String,
        emum: ["non vérifié", "vérifié", "refusé", "en vérification"],
        default: "non vérifié",
        required: true,
    },
    statut_livraison: {
        type: String,
        emum: ["en cours", "terminé", "en attente de livraison"],
        default: "en attente de livraison",
    },
    documents: [
        {
            nom: String,
            url: String,
            statut: {
                type: String,
                enum: ["non soumis", "en attente", "validé", "refusé"],
                default: "non soumis",
            },
            label: {
                type: String,
                required: true,
            },
        },
    ],
    disponibilite: {
        type: Boolean,
        default: true,
    },
    isWorking: {
        type: Boolean,
        default: false,
    },
    distance_max: {
        type: Number,
        default: 10,
    },
    note_moyenne: {
        type: Number,
        default: 0,
    },
    nombre_livraisons: {
        type: Number,
        default: 0,
    },
});

const Livreur = User.discriminator("livreur", LivreurSchema);

const CommercantSchema = new mongoose.Schema({
    favoris_livreurs: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    nom_boutique: {
        type: String,
    },
    adresse_boutique: {
        rue: {
            type: String,
        },
        ville: {
            type: String,
        },
        code_postal: {
            type: String,
        },
        lat: {
            type: Number,
        },
        lng: {
            type: Number,
        },
    },
    note_moyenne: {
        type: Number,
        default: 0,
    },
});

const Commercant = User.discriminator("commercant", CommercantSchema);

const ClientSchema = new mongoose.Schema({
    adresses_favorites: [
        {
            nom: {
                type: String,
                required: true,
            },
            rue: {
                type: String,
                required: true,
            },
            ville: {
                type: String,
                required: true,
            },
            code_postal: {
                type: String,
                required: true,
            },
            lat: {
                type: Number,
                required: true,
            },
            lng: {
                type: Number,
                required: true,
            },
        },
    ],
});

const Client = User.discriminator("client", ClientSchema);

export default {
    User,
    Livreur,
    Commercant,
    Client,
    Admin,
};
