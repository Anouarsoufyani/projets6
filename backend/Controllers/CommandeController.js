// import { generateTokenAndSetCookie } from "../Lib/utils/generateToken.js";
import userModels from "../Models/User.js";
import Commande from "../Models/Commandes.js";
import Notification from "../Models/Notification.js";

const { User, Livreur } = userModels;

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

        // Si on utilise le modèle User avec discriminator, on n'a pas besoin de refaire un findById
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
        const { commandeId,
            livreurId,
            mode,
            vehicleTypes,
            criteria } = req.body;
        
        console.log("nkdndje",commandeId,
            livreurId,
            mode,
            vehicleTypes,
            criteria);
        
        const commande = await Commande.findById(commandeId);

        // const notification = await Notification.findById(requestId);
        

        // if (!notification) {
        //     return res.status(404).json({
        //         success: false,
        //         error: "Notification non trouvée",
        //     });
        // }
       

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

       

        if(mode =="manual"){
            
            const livreur = await User.findById(livreurId).select("-password");

            const notification = new Notification({
                sender: commande.commercant_id,
                receiver: livreurId,
                isRequest: true,
                commande_id: commandeId,
                type: "nouvelle demande de livraison",
            });
            console.log("notification",notification);
            
            await notification.save();

            if (notification.isAccepted==true) {
                console.log("salut");
                
                const clientToNotify = await User.findById(
                    commande.client_id
                ).select("-password");

                commande.livreur_id = livreurId;
                livreur.disponibilite = false;
                commande.statut = "prete_a_etre_recuperee";
                notification.isAccepted = true;
                notification.save();
                await livreur.save();
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
            } else if (notification.isRefused==true) {
                
                console.log("salut");
                
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
                const livreurs = await Livreur.find({
                    disponibilite: true,
                    isWorking: true,
                }).select("-password");
                const livreursDisponibles = livreurs
                    .filter((livreur) => !livreur._id.equals(req.user._id))
                    .map((livreur) => ({
                        livreur,
                        distance: Math.sqrt(
                            Math.pow(
                                commande.adresse_livraison.lat -
                                    livreur.position.lat,
                                2
                            ) +
                                Math.pow(
                                    commande.adresse_livraison.lng -
                                        livreur.position.lng,
                                    2
                                )
                        ),
                    }))
                    .sort((a, b) => a.distance - b.distance);

                try {
                    const livreurChoisi = livreursDisponibles[0].livreur;
                    

                    if (livreurChoisi) {
                        const newNotification = new Notification({
                            sender: commande.commercant_id,
                            receiver: livreurChoisi._id,
                            isRequest: true,
                            commande_id: commandeId,
                            type: "nouvelle demande de livraison",
                        });
                        await newNotification.save();
                    }
                } catch (error) {
                    console.error(
                        "Erreur lors de l'assignation du livreur à la commande:",
                        error
                    );
                }

                return res.status(200).json({
                    success: true,
                    message: "Livraison refusée",
                });
            }
        }
        else{
            const livreurs = await Livreur.find({ disponibilite: true, isWorking: true }).select("-password");
            const filtredLivreur = [];

            for (const livreur of livreurs) {
                const vehiculeActuel = livreur.vehicules.find(v => v.current && vehicleTypes.includes(v.type));
                if (vehiculeActuel) {
                    livreur.vehiculeActuel = vehiculeActuel; // stocke pour plus tard
                    filtredLivreur.push(livreur);
                }
            }
    
            if (filtredLivreur.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Aucun livreur disponible avec le bon type de véhicule",
                });
            }
    
            // Construire les données enrichies
            const livreursAvecInfos = filtredLivreur.map(livreur => {
                const vehicule = livreur.vehiculeActuel;
                const distance = calculateDistance(
                    livreur.position.lat, livreur.position.lng,
                    commande.adresse_livraison.lat, commande.adresse_livraison.lng
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
    
            // Filtrage hard selon les contraintes
            const filtered = livreursAvecInfos.filter(({ capacite, duree, distance, note }) => {
                const poidsLimit = criteria.find(c => c.type === "poids");
                const dureeLimit = criteria.find(c => c.type === "duree");
                const distLimit = criteria.find(c => c.type === "distanceMax");
                const noteLimit = criteria.find(c => c.type === "note");
    
                if (poidsLimit && capacite < poidsLimit.value) return false;
                if (dureeLimit && duree > dureeLimit.value) return false;
                if (distLimit && distance > distLimit.value * 1000) return false;
                if (noteLimit && note < noteLimit.value) return false;
    
                return true;
            });
    
            if (filtered.length === 0) {
                return res.status(404).json({ success: false, error: "Aucun livreur valide selon les critères" });
            }
    
            // trier selon l’ordre de priorité
            const orderedCriteria = criteria
                .filter(c => c.order !== undefined)
                .sort((a, b) => a.order - b.order);
    
            const sorted = filtered.sort((a, b) => {
                for (const { type } of orderedCriteria) {
                    if (type === "distance") {
                        if (a.distance !== b.distance) return a.distance - b.distance;
                    } else if (type === "rating" || type === "note") {
                        if (b.note !== a.note) return b.note - a.note;
                    } else if (type === "duree") {
                        if (a.duree !== b.duree) return a.duree - b.duree;
                    } else if (type === "poids") {
                        if (b.capacite !== a.capacite) return b.capacite - a.capacite;
                    }
                }
                return 0;
            });
            
            console.log("livraison sort",sorted);
            for (let i = 0; i < sorted.length; i++) {
    
                const livreurAssigne = sorted[i].livreur;
                
                const newNotification = new Notification({
                    sender: commande.commercant_id,
                    receiver: livreurAssigne._id,
                    isRequest: true,
                    commande_id: commandeId,
                    type: "nouvelle demande de livraison",
                });
                await newNotification.save();
                console.log("i:",i,newNotification);
                
                
                await delay(45000);
                
                
                if (newNotification.isAccepted==true){
                    
                    console.log("accepted");
                    
                    const clientToNotify = await User.findById(
                        commande.client_id
                    ).select("-password");
                    const commercantToNotify = await User.findById(
                        commande.commercant_id
                    ).select("-password");
            
        
                    commande.livreur_id = livreurAssigne._id;
                    livreurAssigne.disponibilite = false;
                    commande.statut = "prete_a_etre_recuperee";
                    
                    await livreurAssigne.save();
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
                }
                else if(newNotification.isRefused==true){
                    console.log("refusey");
                    
                    const notification = new Notification({
                        sender: req.user._id,
                        receiver: commercantToNotify,
                        commande_id: commandeId,
                        type: "refus de livraison",
                    });
    
                    await notification.save(); 
    
                    return res.status(200).json({
                        success: true,
                        message: "Livraison refusée",
                    });
                }
                    
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
    }
};



// Fonction de distance Euclidienne simple
function calculateDistance(lat1, lon1, lat2, lon2) {
    return Math.sqrt(
        Math.pow(lat1 - lat2, 2) + Math.pow(lon1 - lon2, 2)
    );
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// export const assignLivreurAuto = async (req, res) => {
//     try {
//         const { commandeId, vehicleTypes, criteria } = req.body;

//         const commande = await Commande.findById(commandeId).populate("livreur_id");

//         if (!commande) {
//             return res.status(404).json({ success: false, error: "Commande non trouvée" });
//         }

//         if (commande.livreur_id) {
//             return res.status(400).json({ success: false, error: "La commande a déjà un livreur assigné" });
//         }

//         const livreurs = await Livreur.find({ disponibilite: true, isWorking: true }).select("-password");

//         const filtredLivreur = [];

//         for (const livreur of livreurs) {
//             const vehiculeActuel = livreur.vehicules.find(v => v.current && vehicleTypes.includes(v.type));
//             if (vehiculeActuel) {
//                 livreur.vehiculeActuel = vehiculeActuel; // stocke pour plus tard
//                 filtredLivreur.push(livreur);
//             }
//         }

//         if (filtredLivreur.length === 0) {
//             return res.status(404).json({
//                 success: false,
//                 error: "Aucun livreur disponible avec le bon type de véhicule",
//             });
//         }

//         // Construire les données enrichies
//         const livreursAvecInfos = filtredLivreur.map(livreur => {
//             const vehicule = livreur.vehiculeActuel;
//             const distance = calculateDistance(
//                 livreur.position.lat, livreur.position.lng,
//                 commande.adresse_livraison.lat, commande.adresse_livraison.lng
//             );
//             const duree = distance / 1000 / 60;

//             return {
//                 livreur,
//                 note: livreur.note_moyenne || 0,
//                 distance,
//                 duree,
//                 capacite: vehicule.capacite || 0,
//             };
//         });

//         // Filtrage hard selon les contraintes
//         const filtered = livreursAvecInfos.filter(({ capacite, duree, distance, note }) => {
//             const poidsLimit = criteria.find(c => c.type === "poids");
//             const dureeLimit = criteria.find(c => c.type === "duree");
//             const distLimit = criteria.find(c => c.type === "distanceMax");
//             const noteLimit = criteria.find(c => c.type === "note");

//             if (poidsLimit && capacite < poidsLimit.value) return false;
//             if (dureeLimit && duree > dureeLimit.value) return false;
//             if (distLimit && distance > distLimit.value * 1000) return false;
//             if (noteLimit && note < noteLimit.value) return false;

//             return true;
//         });

//         if (filtered.length === 0) {
//             return res.status(404).json({ success: false, error: "Aucun livreur valide selon les critères" });
//         }

//         // trier selon l’ordre de priorité
//         const orderedCriteria = criteria
//             .filter(c => c.order !== undefined)
//             .sort((a, b) => a.order - b.order);

//         const sorted = filtered.sort((a, b) => {
//             for (const { type } of orderedCriteria) {
//                 if (type === "distance") {
//                     if (a.distance !== b.distance) return a.distance - b.distance;
//                 } else if (type === "rating" || type === "note") {
//                     if (b.note !== a.note) return b.note - a.note;
//                 } else if (type === "duree") {
//                     if (a.duree !== b.duree) return a.duree - b.duree;
//                 } else if (type === "poids") {
//                     if (b.capacite !== a.capacite) return b.capacite - a.capacite;
//                 }
//             }
//             return 0;
//         });
        
//         console.log("livraison sort",sorted);
//         for (let i = 0; i < sorted.length; i++) {

//             const livreurAssigne = sorted[i].livreur;
            
//             const newNotification = new Notification({
//                 sender: commande.commercant_id,
//                 receiver: livreurAssigne._id,
//                 isRequest: true,
//                 commande_id: commandeId,
//                 type: "nouvelle demande de livraison",
//             });
//             await newNotification.save();
//             console.log("i:",i,newNotification);
            
            
//             await delay(45000);
            
            
//             if (newNotification.isAccepted==true){
                
//                 console.log("accepted");
                
//                 const clientToNotify = await User.findById(
//                     commande.client_id
//                 ).select("-password");
//                 const commercantToNotify = await User.findById(
//                     commande.commercant_id
//                 ).select("-password");
        
    
//                 commande.livreur_id = livreurAssigne._id;
//                 livreurAssigne.disponibilite = false;
//                 commande.statut = "prete_a_etre_recuperee";
                
//                 await livreurAssigne.save();
//                 await commande.save();
//                 if (commercantToNotify) {
//                     const notification = new Notification({
//                         sender: req.user._id,
//                         receiver: commande.commercant_id,
//                         commande_id: commandeId,
//                         type: "nouvelle acceptation de livraison",
//                     });
//                     await notification.save();
//                 }
//                 if (clientToNotify) {
//                     const notification = new Notification({
//                         sender: req.user._id,
//                         receiver: clientToNotify,
//                         commande_id: commandeId,
//                         type: "nouveau livreur assigné",
//                     });
//                     await notification.save();
//                 }
//             }
//             else if(newNotification.isRefused==true){
//                 console.log("refusey");
                
//                 const notification = new Notification({
//                     sender: req.user._id,
//                     receiver: commercantToNotify,
//                     commande_id: commandeId,
//                     type: "refus de livraison",
//                 });

//                 await notification.save(); 

//                 return res.status(200).json({
//                     success: true,
//                     message: "Livraison refusée",
//                 });
//             }
                
//         }
        
        

//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({ success: false, error: "Erreur lors de l'assignation du livreur." });
//     }
// };






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

        commande.statut = statut;
        

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

// Ajouter cette fonction à la fin du fichier

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

        // Vérifier que le livreur qui fait la requête est bien celui assigné à la commande
        if (commande.livreur_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                error: "Vous n'êtes pas autorisé à mettre à jour cette commande",
            });
        }

        if (commande.statut === "prete_a_etre_recuperee") {
            // Initialiser l'itinéraire s'il n'existe pas
            if (!commande.itineraire_parcouru_commercant) {
                commande.itineraire_parcouru_commercant = [];
            }

            // Ajouter la nouvelle position à l'itinéraire
            commande.itineraire_parcouru_commercant.push({
                position,
                timestamp: timestamp || new Date(),
            });
        } else if (commande.statut === "recuperee_par_livreur") {
            // Initialiser l'itinéraire s'il n'existe pas
            if (!commande.itineraire_parcouru_client) {
                commande.itineraire_parcouru_client = [];
            }

            // Ajouter la nouvelle position à l'itinéraire
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
