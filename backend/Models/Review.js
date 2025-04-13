import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema(
    {
        auteur: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        cible: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        roleCible: {
            type: String,
            enum: ["livreur", "commercant"],
            required: true,
        },
        note: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        commentaire: {
            type: String,
            maxlength: 500,
        },
        commande: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Commande",
        },
    },
    {
        timestamps: true,
    }
);

const Review = mongoose.model("Review", ReviewSchema);

export default Review;
