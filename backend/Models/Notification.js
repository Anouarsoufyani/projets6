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
        // postId: {
        //     type: mongoose.Schema.Types.ObjectId, // ref: refer to the id of the model
        //     ref: "Post", // the id will be of the post model
        //     required: true
        // },
        // commentId: {
        //     type: mongoose.Schema.Types.ObjectId, // ref: refer to the id of the model
        //     ref: "Comment", // the id will be of the comment model
        //     required: true
        // },
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
