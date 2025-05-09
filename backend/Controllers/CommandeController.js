
import userModels from "../Models/User.js";
import Commande from "../Models/Commandes.js";
import Notification from "../Models/Notification.js";

const { User, Livreur } = userModels;


const timeoutLocks = new Map();

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

export const getCommandeForItineraire = async (req, res) => {
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

        const userRole = req.user.role; 

        let filter = {};

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

                break;
            default:
                return res.status(403).json({
                    success: false,
                    message: "Rôle utilisateur non autorisé ou non défini",
                });
        }


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


    const userToNotify = await User.findOne({ _id: commercant_id }).select(
        "-password"
    );
    const currentUser = await User.findById(req.user._id).select("-password");

    if (!userToNotify || !currentUser) {
        return res
            .status(404)
            .json({ success: false, error: "User not found" });
    }


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


        const livreur = commande.livreur_id;

        return res.status(200).json({
            success: true,
            livreurId: livreur._id,
            position: livreur.position, 
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

        const livreur = await User.findById(commande.livreur_id);

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

        if (
            commande.code_Client == code &&
            commande.is_commercant_verifie == true
        ) {
            commande.is_client_verifie = true;
            commande.statut = "livree";
            commande.date_livraison = Date.now();
            livreur.disponibilite = true;
            await livreur.save();
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
        const { commandeId, livreurId, mode, vehicleTypes, criteria } =
            req.body;

        console.log("Assignment request:", {
            commandeId,
            livreurId,
            mode,
            vehicleTypes,
            criteria,
        });

        const commande = await Commande.findById(commandeId);

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
        if (!commercantToNotify) {
            return res.status(404).json({
                success: false,
                error: "Commerçant non trouvé",
            });
        }


        if (mode === "manual") {
            if (!livreurId) {
                return res.status(400).json({
                    success: false,
                    error: "ID du livreur requis pour le mode manuel",
                });
            }

            const livreur = await User.findById(livreurId).select("-password");
            if (!livreur) {
                return res.status(404).json({
                    success: false,
                    error: "Livreur non trouvé",
                });
            }

            if (!livreur.disponibilite || !livreur.isWorking) {
                return res.status(400).json({
                    success: false,
                    error: "Le livreur n'est plus disponible",
                });
            }


            const notification = new Notification({
                sender: commande.commercant_id,
                receiver: livreurId,
                isRequest: true,
                isActive: true, 
                commande_id: commandeId,
                type: "nouvelle demande de livraison",
                expiresAt: new Date(Date.now() + 60000), 
            });

            await notification.save();
            console.log(
                "Manual assignment notification created:",
                notification._id
            );

            return res.status(200).json({
                success: true,
                message: "Demande de livraison envoyée au livreur",
                notificationId: notification._id,
            });
        }

        else if (mode === "auto") {
            let vehicleTypes = req.body.vehicleTypes;
            if (!vehicleTypes || !Array.isArray(vehicleTypes)) {

                vehicleTypes = ["voiture", "moto", "vélo", "autres"];
            }

            if (
                !criteria ||
                !Array.isArray(criteria) ||
                criteria.length === 0
            ) {
                return res.status(400).json({
                    success: false,
                    error: "Critères requis pour le mode automatique",
                });
            }


            const livreurs = await Livreur.find({
                disponibilite: true,
                isWorking: true,
            }).select("-password");

            if (livreurs.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Aucun livreur disponible actuellement",
                });
            }

            const filteredLivreurs = [];
            for (const livreur of livreurs) {

                const vehiculeActuel = livreur.vehicules.find(
                    (v) => v.current && vehicleTypes.includes(v.type)
                );
                if (vehiculeActuel) {
                    livreur.vehiculeActuel = vehiculeActuel;
                    filteredLivreurs.push(livreur);
                }
            }

            if (filteredLivreurs.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Aucun livreur disponible avec le bon type de véhicule",
                });
            }


            const livreursAvecInfos = filteredLivreurs.map((livreur) => {
                const vehicule = livreur.vehiculeActuel;
                const distance = calculateDistance(
                    livreur.position.lat,
                    livreur.position.lng,
                    commande.adresse_livraison.lat,
                    commande.adresse_livraison.lng
                );
                const duree = distance / 1000 / 60;

                return {
                    livreur,
                    note: livreur.note_moyenne || 0,
                    distance,
                    duree,
                    capacite: vehicule.capacite || 0,
                };
            });


            const filtered = livreursAvecInfos.filter(
                ({ capacite, duree, distance, note }) => {
                    const poidsLimit = criteria.find((c) => c.type === "poids");
                    const dureeLimit = criteria.find((c) => c.type === "duree");
                    const distLimit = criteria.find(
                        (c) => c.type === "distanceMax"
                    );
                    const noteLimit = criteria.find((c) => c.type === "note");

                    if (poidsLimit && capacite < poidsLimit.value) return false;
                    if (dureeLimit && duree > dureeLimit.value) return false;
                    if (distLimit && distance > distLimit.value * 1000)
                        return false;
                    if (noteLimit && note < noteLimit.value) return false;

                    return true;
                }
            );

            if (filtered.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Aucun livreur valide selon les critères",
                });
            }


            const orderedCriteria = criteria
                .filter((c) => c.order !== undefined)
                .sort((a, b) => a.order - b.order);


            const sorted = filtered.sort((a, b) => {
                for (const { type } of orderedCriteria) {
                    if (type === "distance" || type === "distanceMax") {
                        if (a.distance !== b.distance)
                            return a.distance - b.distance;
                    } else if (type === "rating" || type === "note") {
                        if (b.note !== a.note) return b.note - a.note;
                    } else if (type === "duree" || type === "duration") {
                        if (a.duree !== b.duree) return a.duree - b.duree;
                    } else if (type === "poids" || type === "weight") {
                        if (b.capacite !== a.capacite)
                            return b.capacite - a.capacite;
                    }
                }
                return 0;
            });

            console.log(
                "Sorted livreurs by priority criteria:",
                sorted.map((s) => ({
                    id: s.livreur._id,
                    nom: s.livreur.nom,
                    distance: s.distance,
                    note: s.note,
                }))
            );

            const notificationPromises = [];
            const expirationTime = 60; 

            for (let i = 0; i < sorted.length; i++) {
                const livreurAssigne = sorted[i].livreur;
                const newNotification = new Notification({
                    sender: commande.commercant_id,
                    receiver: livreurAssigne._id,
                    isRequest: true,
                    isActive: i === 0, 
                    commande_id: commandeId,
                    type: "nouvelle demande de livraison",
                    priority: i + 1, 
                    expiresAt:
                        i === 0
                            ? new Date(Date.now() + expirationTime * 1000)
                            : null,
                    metadata: {
                        distance: sorted[i].distance,
                        duration: sorted[i].duree,
                        rating: sorted[i].note,
                        capacity: sorted[i].capacite,
                        vehicleType: livreurAssigne.vehiculeActuel.type,
                    },
                });
                notificationPromises.push(newNotification.save());
            }

            const savedNotifications = await Promise.all(notificationPromises);
            console.log(
                "Auto assignment notifications created:",
                savedNotifications.map((n) => ({
                    id: n._id,
                    receiver: n.receiver,
                    priority: n.priority,
                }))
            );

            return res.status(200).json({
                success: true,
                message:
                    "Demandes de livraison envoyées aux livreurs selon les critères",
                notificationIds: savedNotifications.map((n) => n._id),
                topLivreur: {
                    id: sorted[0].livreur._id,
                    nom: sorted[0].livreur.nom,
                },
            });
        } else {
            return res.status(400).json({
                success: false,
                error: "Mode d'assignation invalide. Utilisez 'manual' ou 'auto'",
            });
        }
    } catch (error) {
        console.error(
            "Erreur lors de l'assignation du livreur à la commande:",
            error
        );
        return res.status(500).json({
            success: false,
            error: "Erreur serveur lors de l'assignation du livreur",
        });
    }
};


export const handleLivreurResponse = async (req, res) => {
    try {
        const { notificationId, response } = req.body;

        if (
            !notificationId ||
            !response ||
            !["accept", "refuse"].includes(response)
        ) {
            return res.status(400).json({
                success: false,
                error: "Paramètres invalides. Notification ID et réponse (accept/refuse) requis",
            });
        }


        const notification = await Notification.findById(notificationId);

        if (!notification) {
            return res.status(404).json({
                success: false,
                error: "Notification non trouvée",
            });
        }


        if (notification.isAccepted || notification.isRefused) {
            return res.status(400).json({
                success: false,
                error: "Cette notification a déjà été traitée",
            });
        }

        if (!notification.isActive) {
            return res.status(400).json({
                success: false,
                error: "Cette notification n'est pas active actuellement",
            });
        }


        const commande = await Commande.findById(notification.commande_id);

        if (!commande) {
            return res.status(404).json({
                success: false,
                error: "Commande non trouvée",
            });
        }

        if (commande.livreur_id) {
            notification.isRefused = true;
            notification.refusalReason = "Commande déjà assignée";
            await notification.save();

            return res.status(400).json({
                success: false,
                error: "Cette commande a déjà un livreur assigné",
            });
        }

        const livreur = await User.findById(notification.receiver);

        if (!livreur) {
            return res.status(404).json({
                success: false,
                error: "Livreur non trouvé",
            });
        }


        if (!livreur.disponibilite || !livreur.isWorking) {
            notification.isRefused = true;
            notification.refusalReason = "Livreur non disponible";
            await notification.save();

            await activateNextNotification(
                notification.commande_id,
                notification._id
            );

            return res.status(400).json({
                success: false,
                error: "Le livreur n'est plus disponible",
            });
        }

        if (response === "accept") {

            notification.isAccepted = true;
            notification.responseTime = new Date();


            commande.livreur_id = livreur._id;
            commande.statut = "prete_a_etre_recuperee";


            livreur.disponibilite = false;


            await Promise.all([
                notification.save(),
                commande.save(),
                livreur.save(),
            ]);


            await Notification.updateMany(
                {
                    commande_id: commande._id,
                    _id: { $ne: notification._id },
                    isAccepted: { $ne: true },
                    isRefused: { $ne: true },
                },
                {
                    isRefused: true,
                    refusalReason: "Un autre livreur a accepté la commande",
                }
            );


            const notificationPromises = [];


            const merchantNotification = new Notification({
                sender: livreur._id,
                receiver: commande.commercant_id,
                commande_id: commande._id,
                type: "nouvelle acceptation de livraison",
            });
            notificationPromises.push(merchantNotification.save());


            const clientNotification = new Notification({
                sender: livreur._id,
                receiver: commande.client_id,
                commande_id: commande._id,
                type: "nouveau livreur assigné",
            });
            notificationPromises.push(clientNotification.save());


            await Promise.all(notificationPromises);

            return res.status(200).json({
                success: true,
                message: "Livraison acceptée avec succès",
                commande: {
                    id: commande._id,
                    status: commande.statut,
                },
            });
        } else {

            notification.isRefused = true;
            notification.refusalReason = "Refusé par le livreur";
            notification.responseTime = new Date();
            await notification.save();


            const nextNotification = await activateNextNotification(
                notification.commande_id,
                notification._id
            );

            if (nextNotification) {


                return res.status(200).json({
                    success: true,
                    message:
                        "Livraison refusée, notification envoyée au prochain livreur",
                    nextLivreur: {
                        id: nextNotification.receiver,
                        priority: nextNotification.priority,
                    },
                });
            } else {

                const merchantNotification = new Notification({
                    sender: req.user._id,
                    receiver: commande.commercant_id,
                    commande_id: commande._id,
                    type: "refus de livraison",
                    description:
                        "Tous les livreurs disponibles ont refusé la livraison",
                });
                await merchantNotification.save();

                return res.status(200).json({
                    success: true,
                    message:
                        "Livraison refusée, aucun autre livreur disponible",
                    merchantNotified: true,
                });
            }
        }
    } catch (error) {
        console.error(
            "Erreur lors du traitement de la réponse du livreur:",
            error
        );
        return res.status(500).json({
            success: false,
            error: "Erreur serveur lors du traitement de la réponse",
        });
    }
};

async function activateNextNotification(commandeId, currentNotificationId) {
    try {

        const nextNotification = await Notification.findOne({
            commande_id: commandeId,
            isRequest: true,
            isAccepted: { $ne: true },
            isRefused: { $ne: true },
            isActive: { $ne: true },
            _id: { $ne: currentNotificationId },
        }).sort({ priority: 1 });


        if (nextNotification) {
            nextNotification.isActive = true;
            nextNotification.expiresAt = new Date(Date.now() + 60000); 


            nextNotification.description =
                "Vous avez été sélectionné car le livreur précédent n'a pas répondu ou a refusé la livraison.";

            await nextNotification.save();


            const livreur = await User.findById(
                nextNotification.receiver
            ).select("nom");

            console.log(
                `Activated next notification for livreur ${
                    livreur?.nom || nextNotification.receiver
                } (priority: ${nextNotification.priority})`
            );

            return nextNotification;
        }

        return null;
    } catch (error) {
        console.error("Error activating next notification:", error);
        return null;
    }
}


export const checkNotificationTimeouts = async (req, res) => {
    try {

        const lockKey = `notification_timeout_lock_${req.user._id}`;

        if (timeoutLocks.has(lockKey)) {
            const lockTime = timeoutLocks.get(lockKey);
            if (Date.now() - lockTime < 30000) {
                return res.status(200).json({
                    success: true,
                    message: "Another process is already checking timeouts",
                    results: [],
                    locked: true,
                });
            }

        }


        timeoutLocks.set(lockKey, Date.now());


        setTimeout(() => {
            if (timeoutLocks.get(lockKey) === Date.now()) {
                timeoutLocks.delete(lockKey);
            }
        }, 30000);

        try {

            const query = {
                isRequest: true,
                isAccepted: { $ne: true },
                isRefused: { $ne: true },
                isActive: true,
                expiresAt: { $lt: new Date() },
            };

 
            if (req.user.role !== "admin") {

                if (req.user.role === "livreur") {
                    query.receiver = req.user._id;
                }

                else if (req.user.role === "commercant") {

                    const commandes = await Commande.find({
                        commercant_id: req.user._id,
                    }).select("_id");
                    const commandeIds = commandes.map((c) => c._id);
                    query.commande_id = { $in: commandeIds };
                }

                else if (req.user.role === "client") {
                    const commandes = await Commande.find({
                        client_id: req.user._id,
                    }).select("_id");
                    const commandeIds = commandes.map((c) => c._id);
                    query.commande_id = { $in: commandeIds };
                }
            }


            const timedOutNotifications = await Notification.find(query).limit(
                10
            );

            const results = [];

            for (const notification of timedOutNotifications) {
                try {

                    notification.isRefused = true;
                    notification.refusalReason =
                        "Timeout - pas de réponse dans le délai imparti";
                    notification.responseTime = new Date();
                    await notification.save();

                    results.push({
                        notificationId: notification._id,
                        commandeId: notification.commande_id,
                        livreurId: notification.receiver,
                        status: "timeout",
                    });

                    const commande = await Commande.findById(
                        notification.commande_id
                    );

                    if (commande && !commande.livreur_id) {

                        const nextNotification = await activateNextNotification(
                            notification.commande_id,
                            notification._id
                        );

                        if (nextNotification) {

                            nextNotification.description =
                                "Vous avez été sélectionné car le livreur précédent n'a pas répondu dans le délai imparti.";
                            await nextNotification.save();

                            results.push({
                                nextNotificationId: nextNotification._id,
                                nextLivreurId: nextNotification.receiver,
                                priority: nextNotification.priority,
                                status: "activated",
                            });
                        } else {
t
                            const merchantNotification = new Notification({
                                sender: notification.receiver, 
                                receiver: commande.commercant_id,
                                commande_id: commande._id,
                                type: "refus de livraison",
                                description:
                                    "Tous les livreurs disponibles n'ont pas répondu ou ont refusé la livraison",
                            });
                            await merchantNotification.save();

                            results.push({
                                merchantNotified: true,
                                merchantId: commande.commercant_id,
                                status: "all_failed",
                            });
                        }
                    }
                } catch (error) {
                    console.error(
                        `Error processing notification ${notification._id}:`,
                        error
                    );
                    results.push({
                        notificationId: notification._id,
                        error: error.message,
                        status: "error",
                    });
                }
            }


            timeoutLocks.delete(lockKey);

            return res.status(200).json({
                success: true,
                message: `${timedOutNotifications.length} notifications expirées traitées`,
                results,
            });
        } catch (error) {

            timeoutLocks.delete(lockKey);
            throw error;
        }
    } catch (error) {
        console.error(
            "Erreur lors de la vérification des timeouts de notifications:",
            error
        );

        return res.status(500).json({
            success: false,
            error: "Erreur serveur lors de la vérification des timeouts",
        });
    }
};


function calculateDistance(lat1, lon1, lat2, lon2) {
    return Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lon1 - lon2, 2));
}

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

        if (!userToNotify || !currentUser) {
            return res
                .status(404)
                .json({ success: false, error: "User not found" });
        }

        commande.statut = statut;

        if (
            ["en_attente", "refusee", "en_preparation", "annulee"].includes(
                statut
            )
        ) {
            commande.livreur_id = null;
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

export const updateCommandeItineraire = async (req, res) => {
    try {
        const { id } = req.params;
        const { position, timestamp } = req.body;

        if (!position || !position.lat || !position.lng) {
            return res.status(400).json({
                success: false,
                error: "Position invalide",
            });
        }

        const commande = await Commande.findById(id);

        if (!commande) {
            return res.status(404).json({
                success: false,
                error: "Commande non trouvée",
            });
        }


        if (commande.livreur_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                error: "Vous n'êtes pas autorisé à mettre à jour cette commande",
            });
        }

        if (commande.statut === "prete_a_etre_recuperee") {
            if (!commande.itineraire_parcouru_commercant) {
                commande.itineraire_parcouru_commercant = [];
            }


            commande.itineraire_parcouru_commercant.push({
                position,
                timestamp: timestamp || new Date(),
            });
        } else if (commande.statut === "recuperee_par_livreur") {

            if (!commande.itineraire_parcouru_client) {
                commande.itineraire_parcouru_client = [];
            }


            commande.itineraire_parcouru_client.push({
                position,
                timestamp: timestamp || new Date(),
            });
        } else {
            return res.status(400).json({
                success: false,
                error: "Statut de la commande invalide",
            });
        }

        await commande.save();

        return res.status(200).json({
            success: true,
            message: "Itinéraire mis à jour avec succès",
        });
    } catch (error) {
        console.error("Erreur lors de la mise à jour de l'itinéraire:", error);
        return res.status(500).json({
            success: false,
            error: "Erreur serveur",
        });
    }
};

export const problemsDelivery = async (req, res) => {
    const { commandeId, problem, description, reportedBy } = req.body;
    const commande = await Commande.findById(commandeId).populate("livreur_id");
    const livreur = await User.findById(commande.livreur_id);
    livreur.disponibilite = true;
    await livreur.save();
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

    const admins = await User.find({ role: "admin" });

    if (reportedBy == "livreur") {
        const notificationClient = new Notification({
            sender: commande.livreur_id,
            receiver: commande.client_id,
            description: description,
            type: problem,
        });
        await notificationClient.save();

        const notificationCommercant = new Notification({
            sender: commande.livreur_id,
            receiver: commande.commercant_id,
            description: description,

            type: problem,
        });
        await notificationCommercant.save();

        for (const admin of admins) {
            const notificationAdmin = new Notification({
                sender: commande.livreur_id,
                receiver: admin._id,
                description: description,
                type: problem,
            });
            await notificationAdmin.save();
        }
    }

    if (reportedBy == "client") {
        const notificationLivreur = new Notification({
            sender: commande.client_id,
            receiver: commande.livreur_id,
            description: description,
            type: problem,
        });
        await notificationLivreur.save();

        const notificationCommercant = new Notification({
            sender: commande.client_id,
            receiver: commande.commercant_id,
            description: description,
            type: problem,
        });
        await notificationCommercant.save();

        for (const admin of admins) {
            const notificationAdmin = new Notification({
                sender: commande.client_id,
                receiver: admin._id,
                description: description,
                type: problem,
            });
            await notificationAdmin.save();
        }
    }

    commande.statut = "probleme";
    await commande.save();

    return res.status(200).json({
        success: true,
        message: "Problème signalé et notifications envoyées.",
    });
};



export const getAllCommandes = async (req, res) => {
    try {

        if (req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message:
                    "Accès non autorisé. Seuls les administrateurs peuvent accéder à toutes les commandes.",
            });
        }


        const commandes = await Commande.find({})
            .populate("client_id")
            .populate("commercant_id")
            .populate("livreur_id")
            .sort({ date_creation: -1 }); 

        return res.status(200).json({
            success: true,
            commandes,
        });
    } catch (error) {
        console.error(
            "Erreur lors de la récupération de toutes les commandes:",
            error
        );
        return res.status(500).json({
            success: false,
            message: "Erreur serveur lors de la récupération des commandes",
            error: error.message,
        });
    }
};
