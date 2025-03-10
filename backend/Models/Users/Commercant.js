import mongoose from "mongoose";

const CommercantSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
        },
        name: {
            type: String,
            required: true,
        },
        prenom: {
            type: String,
        },
        adresse:{
            type : String,
        },
        numero: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
            minLength: 6,
        },
        profilePic: {
            type: String,
            default: "",
        },
        poidsCommande: {
            type: Number,
            required: true,
        },
        volume: {
            type: Number,
            required: true,
        },
        fragile:{
            type: Boolean,
            required: true,
        },
        taille: {
            type: Number,
            required: true,
        }
    },
    {
        timestamps: true,
    }
);

const Commercant = mongoose.model("Commercant", CommercantSchema);

export default Commercant;