import mongoose from "mongoose";

const CommercantSchema = new mongoose.Schema(
    {
        poidsCommande: {
            type: Number,
            required: true,
        },
        volume: {
            type: Number,
            required: true,
        },
        fragile: {
            type: Boolean,
            required: true,
        },
        taille: {
            type: Number,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const Commercant = mongoose.model("Commercant", CommercantSchema);

export default Commercant;
