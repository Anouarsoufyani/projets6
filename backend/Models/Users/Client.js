import mongoose from "mongoose";

const ClientSchema = new mongoose.Schema(
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
    },
    {
        timestamps: true,
    }
);

const Client = mongoose.model("Client", ClientSchema);

export default Client;
