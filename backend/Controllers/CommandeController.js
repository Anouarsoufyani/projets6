// import { generateTokenAndSetCookie } from "../Lib/utils/generateToken.js";
import userModels from "../Models/User.js";
const { User } = userModels;
import Commande from "../Models/Commandes.js";
import Notification from "../Models/Notification.js";

export const getCommandeById = async (req, res) => {
    try {
        const commande = await Commande.findById(req.params.id)
            .populate("client_id")
            .populate("commercant_id")
            .populate("livreur_id");
        return res.status(200).json({ success: true, data: commande });
    } catch (error) {
        return res
            .status(400)
            .json({ success: false, error: "Commande not found" });
    }
};

export const getCommandes = async (req, res) => {
    try {
        // Récupérer le rôle de l'utilisateur connecté
        const userRole = req.user.role; // Assurez-vous que cette information est disponible dans req.user

        let filter = {};

        // Définir le filtre selon le rôle de l'utilisateur
        switch (userRole) {
            case "client":
                filter = { client_id: req.user.id };
                break;
            case "commercant":
                filter = { commercant_id: req.user.id };
                break;
            case "livreur":
                filter = { livreur_id: req.user.id };
                break;
            case "admin":
                // Pour un administrateur, toutes les commandes
                break;
            default:
                return res.status(403).json({
                    success: false,
                    message: "Rôle utilisateur non autorisé ou non défini",
                });
        }

        // Effectuer la requête avec le filtre approprié
        const commandes = await Commande.find(filter)
            .populate("client_id")
            .populate("commercant_id")
            .populate("livreur_id");

        return res.status(200).json({ success: true, commandes });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const createCommande = async (req, res) => {
    console.log("test");
    console.log(req.body);

    const { client_id, commercant_id, total, adresse_livraison } = req.body;
    const commande = new Commande({
        client_id,
        commercant_id,
        total,
        adresse_livraison: {
            rue: adresse_livraison.rue,
            ville: adresse_livraison.ville,
            code_postal: adresse_livraison.code_postal,
            lat: adresse_livraison.lat,
            lng: adresse_livraison.lng,
        },
        date_creation: new Date(),
        date_livraison: null,
    });

    // const commande = new Commande({
    //     client_id: "67d15d4c87a55d5aadf95b03",
    //     commercant_id: "67d15e4ccf1feb1de84ad918",
    //     livreur_id: "67d15c6987a55d5aadf95aff",
    //     total: 100,
    //     adresse_livraison: {
    //         rue: "20 avenue de la paix",
    //         ville: "Paris",
    //         code_postal: "75002",
    //         lat: 48.856614,
    //         lng: 2.352222,
    //     },
    //     date_creation: new Date(),
    //     date_livraison: null,
    // });

    // checking if user exists
    const userToNotify = await User.findOne({ _id: commercant_id }).select(
        "-password"
    );
    const currentUser = await User.findById(req.user._id).select("-password");

    if (!userToNotify || !currentUser) {
        return res
            .status(404)
            .json({ success: false, error: "User not found" });
    }

    // Sauvegarde dans la base (à utiliser dans ton code)
    try {
        const newNotification = new Notification({
            sender: req.user._id,
            receiver: userToNotify._id,
            type: "nouvelle commande",
        });

        if (newNotification) {
            await newNotification.save();
        }
        await commande.save();
        console.log("Commande fictive sauvegardée :", commande);

        return res.status(201).json(commande);
    } catch (err) {
        console.error("Erreur :", err);
        return res.status(500).json({ error: "Erreur lors de la sauvegarde" });
    }
};

export const cancelCommande = async (req, res) => {
    try {
        const commande = await Commande.findById(req.params.id);
        if (!commande) {
            return res
                .status(404)
                .json({ success: false, error: "Commande not found" });
        }

        const usersToNotify = [
            commande.client_id,
            commande.commercant_id,
            commande.livreur_id,
        ].filter(Boolean);

        commande.statut = "annulee";
        await commande.save();

        for (const userId of usersToNotify) {
            const notification = new Notification({
                sender: req.user._id,
                receiver: userId,
                type: "annulation de commande",
            });
            await notification.save();
        }

        return res
            .status(200)
            .json({ success: true, message: "Commande annulée" });
    } catch (error) {
        return res
            .status(400)
            .json({ success: false, error: "Failed to cancel commande" });
    }
};

export const getLivreurInfo = async (req, res) => {
    try {
        const { id } = req.params;

        const commande = await Commande.findById(id).populate("livreur_id");

        if (!commande) {
            return res.status(404).json({
                success: false,
                error: "Commande non trouvée",
            });
        }

        if (!commande.livreur_id) {
            return res.status(404).json({
                success: false,
                error: "Aucun livreur assigné à cette commande",
            });
        }

        // Si on utilise le modèle User avec discriminator, on n'a pas besoin de refaire un findById
        const livreur = commande.livreur_id;

        return res.status(200).json({
            success: true,
            livreurId: livreur._id,
            position: livreur.position, // Position par défaut si non disponible
            status: commande.statut,
        });
    } catch (error) {
        console.error(
            "Erreur lors de la récupération des informations du livreur:",
            error
        );
        return res.status(500).json({
            success: false,
            error: "Erreur serveur",
        });
    }
};

export const getCodeClient = async (req, res) => {
    try {
        const { id } = req.params;

        const commande = await Commande.findById(id).populate("livreur_id");
        console.log("commande", commande);

        if (!commande) {
            return res.status(404).json({
                success: false,
                error: "Commande non trouvée",
            });
        }

        if (!commande.livreur_id) {
            return res.status(404).json({
                success: false,
                error: "Aucun livreur assigné à cette commande",
            });
        }

        // Si on utilise le modèle User avec discriminator, on n'a pas besoin de refaire un findById
        const livreur = commande.livreur_id;

        return res.status(200).json({
            success: true,
            livreurId: livreur._id,
            code_Client: commande.code_Client,
        });
    } catch (error) {
        console.error(
            "Erreur lors de la récupération des informations du livreur:",
            error
        );
        return res.status(500).json({
            success: false,
            error: "Erreur serveur",
        });
    }
};

export const getCodeCommercant = async (req, res) => {
    try {
        const { id } = req.params;

        const commande = await Commande.findById(id).populate("livreur_id");
        console.log("commande", commande);
        if (!commande) {
            return res.status(404).json({
                success: false,
                error: "Commande non trouvée",
            });
        }

        if (!commande.livreur_id) {
            return res.status(404).json({
                success: false,
                error: "Aucun livreur assigné à cette commande",
            });
        }

        // Si on utilise le modèle User avec discriminator, on n'a pas besoin de refaire un findById
        const livreur = commande.livreur_id;

        return res.status(200).json({
            success: true,
            livreurId: livreur._id,
            code_commercant: commande.code_commercant,
        });
    } catch (error) {
        console.error(
            "Erreur lors de la récupération des informations du livreur:",
            error
        );
        return res.status(500).json({
            success: false,
            error: "Erreur serveur",
        });
    }
};

export const validation_codeCL = async (req, res) => {
    try {
        const { code, id } = req.body;

        const commande = await Commande.findById(id).populate("livreur_id");
        console.log("ID", id, code, commande.code_Client);

        if (!commande) {
            return res.status(404).json({
                success: false,
                error: "Commande non trouvée",
            });
        }

        if (!commande.livreur_id) {
            return res.status(404).json({
                success: false,
                error: "Aucun livreur assigné à cette commande",
            });
        }

        const notification = new Notification({
            sender: req.user._id,
            receiver: commande.commercant_id,
            type: "commande livree",
        });

        // Si on utilise le modèle User avec discriminator, on n'a pas besoin de refaire un findById
        if (
            commande.code_Client == code &&
            commande.is_commercant_verifie == true
        ) {
            commande.is_client_verifie = true;
            commande.statut = "livree";
            commande.date_livraison = Date.now();
            await commande.save();
            await notification.save();

            return res.status(200).json({
                success: true,
                code_Client: commande.code_Client,
            });
        } else {
            return res.status(404).json({
                success: false,
                error: "Aucun livreur assigné à cette commande",
            });
        }
    } catch (error) {
        console.error("Mauvais code tapé", error);
        return res.status(500).json({
            success: false,
            error: "Erreur serveur",
        });
    }
};

export const validation_codeCom = async (req, res) => {
    try {
        const { code, id } = req.body;
        console.log("ID", id, code);

        const commande = await Commande.findById(id).populate("livreur_id");

        if (!commande) {
            return res.status(404).json({
                success: false,
                error: "Commande non trouvée",
            });
        }

        if (!commande.livreur_id) {
            return res.status(404).json({
                success: false,
                error: "Aucun livreur assigné à cette commande",
            });
        }

        const notification = new Notification({
            sender: req.user._id,
            receiver: commande.client_id,
            type: "commande recuperee",
        });

        if (commande.code_Commercant == code) {
            commande.is_commercant_verifie = true;
            commande.statut = "recuperee_par_livreur";
            commande.date_recuperation = Date.now();
            await commande.save();
            await notification.save();

            return res.status(200).json({
                success: true,
                code_Commercant: commande.code_Commercant,
            });
        } else {
            return res.status(404).json({
                success: false,
                error: "Code incorrect",
            });
        }
    } catch (error) {
        console.error("Mauvais code tapé", error);
        return res.status(500).json({
            success: false,
            error: "Erreur serveur",
        });
    }
};

export const assignLivreur = async (req, res) => {
    try {
        const { commandeId, livreurId, requestId, response } = req.body;

        const commande = await Commande.findById(commandeId);

        const notification = await Notification.findById(requestId);

        if (!notification) {
            return res.status(404).json({
                success: false,
                error: "Notification non trouvée",
            });
        }

        if (!commande) {
            return res.status(404).json({
                success: false,
                error: "Commande non trouvée",
            });
        }

        if (commande.livreur_id) {
            return res.status(400).json({
                success: false,
                error: "La commande a déjà un livreur assigné",
            });
        }

        const commercantToNotify = await User.findById(
            commande.commercant_id
        ).select("-password");

        if (response === "accepter") {
            const clientToNotify = await User.findById(
                commande.client_id
            ).select("-password");

            commande.livreur_id = livreurId;
            commande.statut = "prete_a_etre_recuperee";
            notification.isAccepted = true;
            notification.save();
            await commande.save();
            if (commercantToNotify) {
                const notification = new Notification({
                    sender: req.user._id,
                    receiver: commande.commercant_id,
                    commande_id: commandeId,
                    type: "nouvelle acceptation de livraison",
                });
                await notification.save();
            }
            if (clientToNotify) {
                const notification = new Notification({
                    sender: req.user._id,
                    receiver: clientToNotify,
                    commande_id: commandeId,
                    type: "nouveau livreur assigné",
                });
                await notification.save();
            }
        } else if (response === "refuser") {
            console.log(notification.isRefused);

            commande.livreur_id = null;
            commande.statut = "en_preparation";
            notification.isRefused = true;
            notification.save();
            await commande.save();
            if (commercantToNotify) {
                const notification = new Notification({
                    sender: req.user._id,
                    receiver: commercantToNotify,
                    commande_id: commandeId,
                    type: "refus de livraison",
                });
                await notification.save();
            }
        }

        return res.status(200).json({
            success: true,
            message: "Livreur assigné à la commande",
        });
    } catch (error) {
        console.error(
            "Erreur lors de l'assignation du livreur à la commande:",
            error
        );
        return res.status(500).json({
            success: false,
            error: "Erreur serveur",
        });
    }
};

export const requestLivreur = async (req, res) => {
    try {
        const { commandeId, livreurId } = req.body;

        const commande = await Commande.findById(commandeId);

        if (!commande) {
            return res.status(404).json({
                success: false,
                error: "Commande non trouvée",
            });
        }

        const livreurToNotify = await User.findById(livreurId).select(
            "-password"
        );

        if (!livreurToNotify) {
            return res.status(404).json({
                success: false,
                error: "Livreur non trouvé",
            });
        }

        const notification = new Notification({
            sender: req.user._id,
            receiver: livreurId,
            commande_id: commandeId,
            isRequest: true,
            type: "nouvelle demande de livraison",
        });
        await notification.save();

        return res.status(200).json({
            success: true,
            message: "Notification envoyée au livreur",
        });
    } catch (error) {
        console.error(
            "Erreur lors de l'envoi de la notification au livreur:",
            error
        );
        return res.status(500).json({
            success: false,
            error: "Erreur serveur",
        });
    }
};

export const updateCommandeStatus = async (req, res) => {
    try {
        const { commandeId, statut } = req.body;
        console.log(commandeId, statut);

        const commande = await Commande.findById(commandeId);

        if (!commande) {
            return res.status(404).json({
                success: false,
                error: "Commande non trouvée",
            });
        }

        const userToNotify = await User.findOne({
            _id: commande.client_id,
        }).select("-password");
        const currentUser = await User.findById(req.user._id).select(
            "-password"
        );

        commande.statut = statut;
        console.log(commande);

        if (!userToNotify || !currentUser) {
            return res
                .status(404)
                .json({ success: false, error: "User not found" });
        }

        const newNotification = new Notification({
            sender: req.user._id,
            receiver: userToNotify._id,
            type:
                statut === "en_preparation"
                    ? "acceptation de commande"
                    : statut === "refusee"
                    ? "refus de commande"
                    : "nouvelle commande",
        });

        await commande.save();

        if (newNotification) {
            await newNotification.save();
        }

        return res.status(200).json({
            success: true,
            message: "Statut de la commande mis à jour",
        });
    } catch (error) {
        console.error(
            "Erreur lors de la mise à jour du statut de la commande:",
            error
        );
        return res.status(500).json({
            success: false,
            error: "Erreur serveur",
        });
    }
};
