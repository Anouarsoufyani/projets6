import mongoose from "mongoose";

const LivreurSchema = new mongoose.Schema(
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
        note: {
            type:Number
        },
        typedevehicule:{
            type : String,
            enum: ["voiture", "moto", "velo"]
        }
    },
    {
        timestamps: true,
    }
);

const Livreur = mongoose.model("Livreur", LivreurSchema);

export default Livreur;
