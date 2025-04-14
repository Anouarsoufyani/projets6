import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
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
            enum: ["commercant", "livreur"],
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
            required: true,
        },
        commande: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Commande",
            default: null,
        },
    },
    { timestamps: true }
);

const Review = mongoose.model("Review", reviewSchema);

export default Review;
