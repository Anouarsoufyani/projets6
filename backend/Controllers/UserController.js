import userModels from "../Models/User.js";
const { User, Client, Commercant, Livreur } = userModels;
import bcrypt from "bcryptjs";

export const getUserProfile = async (req, res) => {
    // validation for req.params
    const { username } = req.params;

    try {
        // checking if user exists
        const user = await User.findOne({ username }).select("-password");
        if (!user) {
            return res
                .status(404)
                .json({ success: false, error: "User not found" });
        }
        return res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const updateProfile = async (req, res) => {
    const userId = req.user?.id; // Vérifie que req.user est défini par un middleware d'auth

    if (!userId) {
        return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    const {
        nom,
        email,
        numero,
        currentPassword,
        newPassword,
        nom_boutique,
        adresse_boutique,
        vehicule,
        position,
        disponibilite,
        distance_max,
        adresses_favorites,
    } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "Utilisateur non trouvé" });
        }

        // Champs communs
        user.nom = nom || user.nom;
        user.email = email || user.email;
        user.numero = numero || user.numero;

        // Mise à jour du mot de passe
        if (newPassword) {
            if (!currentPassword) {
                return res
                    .status(400)
                    .json({ error: "Mot de passe actuel requis" });
            }
            const isMatch = await bcrypt.compare(
                currentPassword,
                user.password
            );
            if (!isMatch) {
                return res
                    .status(400)
                    .json({ error: "Mot de passe actuel incorrect" });
            }
            user.password = await bcrypt.hash(newPassword, 10);
        }

        // Champs spécifiques selon le rôle
        switch (user.role) {
            case "commercant":
                user.nom_boutique = nom_boutique || user.nom_boutique;
                user.adresse_boutique =
                    adresse_boutique || user.adresse_boutique;
                break;
            case "livreur":
                // Validation spécifique pour le véhicule
                if (vehicule) {
                    const { type, plaque, couleur, capacite } = vehicule;

                    // Si le type est voiture ou moto, la plaque est obligatoire
                    if (
                        (type === "voiture" || type === "moto") &&
                        (!plaque || plaque.trim() === "")
                    ) {
                        return res.status(400).json({
                            error: "La plaque d'immatriculation est obligatoire pour une voiture ou une moto",
                        });
                    }

                    // Mise à jour du véhicule uniquement si fourni
                    user.vehicule = {
                        type: type || user.vehicule?.type,
                        plaque: plaque || user.vehicule?.plaque,
                        couleur: couleur || user.vehicule?.couleur,
                        capacite: capacite || user.vehicule?.capacite,
                    };
                }

                user.position = position || user.position;
                user.disponibilite =
                    disponibilite !== undefined
                        ? disponibilite
                        : user.disponibilite;
                user.distance_max = distance_max || user.distance_max;
                break;
            case "client":
                user.adresses_favorites =
                    adresses_favorites || user.adresses_favorites;
                break;
            default:
                break;
        }

        await user.save();

        // Retire le mot de passe de la réponse
        const userResponse = user.toObject();
        delete userResponse.password;

        res.json({ success: true, user: userResponse });
    } catch (err) {
        console.error("Erreur dans updateProfile:", err);
        res.status(500).json({ error: err.message });
    }
};

export const toggleActive = async (req, res) => {
    try {
        const { id } = req.body;
        const user = await Livreur.findById(id);
        if (!user) {
            return res
                .status(404)
                .json({ success: false, error: "User not found" });
        }
        user.isWorking = !user.isWorking;
        if (user.isWorking === false) {
            user.disponibilite = false;
        } else {
            user.disponibilite = true;
        }
        await user.save();
        return res.status(200).json({ success: true, data: user });
    } catch (error) {
        return res
            .status(500)
            .json({ success: false, error: "Internal server error" });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select("-password");
        return res.status(200).json({
            success: true,
            data: users,
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: "Not connected" });
    }
};

export const updateUserPosition = async (req, res) => {
    try {
        const { userId } = req.params;
        const { lat, lng } = req.body;

        // Vérifier que l'utilisateur existe et est un livreur
        const livreur = await Livreur.findById(userId);
        if (!livreur) {
            return res.status(403).json({
                success: false,
                message: "Livreur non trouvé",
            });
        }

        // Vérifier que le livreur est disponible
        if (!livreur.isWorking) {
            return res.status(400).json({
                success: false,
                message:
                    "Le livreur doit être disponible pour mettre à jour sa position",
            });
        }

        // Mettre à jour la position directement sur l'instance du livreur
        livreur.position = { lat, lng };

        // Sauvegarder les modifications
        await livreur.save();

        res.status(200).json({
            success: true,
            data: livreur,
        });
    } catch (error) {
        console.error("Erreur lors de la mise à jour de la position:", error);
        res.status(500).json({
            success: false,
            message: "Erreur lors de la mise à jour de la position",
        });
    }
};

export const getAvailableLivreurs = async (req, res) => {
    try {
        const livreurs = await Livreur.find({
            disponibilite: true,
            isWorking: true,
        }).select("-password");
        return res.status(200).json({
            success: true,
            data: livreurs,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: "Erreur lors de la récupération des livreurs",
        });
    }
};

export const getUsersByRole = async (req, res) => {
    const { role } = req.params;
    try {
        const users = await User.find({ role }).select("-password");
        return res.status(200).json({
            success: true,
            data: users,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: "Erreur lors de la récupération des utilisateurs",
        });
    }
};

export const getLivreurDocuments = async (req, res) => {
    const { id } = req.params;

    try {
        const livreur = await Livreur.findById(id).select("documents");

        if (!livreur) {
            return res.status(404).json({
                success: false,
                error: "Le livreur n'existe pas",
            });
        }
        return res.status(200).json({
            success: true,
            data: livreur.documents,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: "Erreur lors de la récupération des documents du livreur",
        });
    }
};

export const updateLivreurDocuments = async (req, res) => {
    const { livreurId, documentId } = req.params;
    const { statut } = req.body;

    if (!statut) {
        return res.status(400).json({
            success: false,
            error: "Le champ 'statut' est requis",
        });
    }

    if (statut === "non soumis") {
        return res.status(400).json({
            success: false,
            error: "Impossible de valider ou refuser un document non soumis",
        });
    }

    try {
        const livreur = await Livreur.findById(livreurId);
        if (!livreur) {
            return res.status(404).json({
                success: false,
                error: "Le livreur n'existe pas",
            });
        }

        const document = livreur.documents.id(documentId);
        if (!document) {
            return res.status(404).json({
                success: false,
                error: "Document introuvable",
            });
        }

        document.statut = statut;

        const hasCarteIdentite = livreur.documents.some(
            (d) => d.label === "carte d'identité" && d.statut === "validé"
        );
        const hasPhotoTete = livreur.documents.some(
            (d) => d.label === "photo de votre tête" && d.statut === "validé"
        );

        // Statuts des véhicules en fonction de leurs documents associés
        livreur.vehicules = livreur.vehicules.map((v) => {
            let requiredDocs = [];

            if (v.type === "vélo" || v.type === "autres") {
                // Aucun document requis pour ces types, donc toujours vérifiés
                v.statut = "vérifié";
                return v;
            }

            if (v.type === "voiture") {
                requiredDocs = [
                    "permis voiture",
                    "carte grise voiture",
                    "assurance voiture",
                ];
            } else if (v.type === "moto") {
                requiredDocs = [
                    "permis moto",
                    "carte grise moto",
                    "assurance moto",
                ];
            }

            const allValid = requiredDocs.every((label) =>
                livreur.documents.some(
                    (d) => d.label === label && d.statut === "validé"
                )
            );

            v.statut = allValid ? "vérifié" : "non vérifié";
            return v;
        });

        const hasVehiculeVerifie = livreur.vehicules.some(
            (v) => v.statut === "vérifié"
        );

        if (hasCarteIdentite && hasPhotoTete && hasVehiculeVerifie) {
            livreur.statut = "vérifié";
        } else {
            // Si tous les documents ont un statut, mais certains sont refusés, on met "refusé"
            const tousValides =
                livreur.documents.length > 0 &&
                livreur.documents.every(
                    (doc) => doc.statut === "validé" || doc.statut === "refusé"
                );

            livreur.statut = tousValides
                ? livreur.documents.every((doc) => doc.statut === "validé")
                    ? "vérifié"
                    : "refusé"
                : "en vérification";
        }

        await livreur.save();

        return res.status(200).json({
            success: true,
            message: `Document ${documentId} mis à jour avec le statut "${statut}"`,
            data: {
                documentId,
                statut,
                statutGlobal: livreur.statut,
            },
        });
    } catch (error) {
        console.error("Erreur updateLivreurDocuments:", error);
        return res.status(500).json({
            success: false,
            error: "Erreur lors de la mise à jour des documents du livreur",
        });
    }
};

export const getUserById = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findById(id).select("-password");
        if (!user) {
            return res.status(404).json({
                success: false,
                error: "Utilisateur non trouvé",
            });
        }
        return res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: "Erreur lors de la récupération de l'utilisateur",
        });
    }
};

export const addVehicules = async (req, res) => {
    try {
       
        const livreur = await Livreur.findById(req.user.id);

        if (!livreur) {
            return res.status(404).json({ message: "Livreur non trouvé" });
        }

        livreur.vehicules.push(req.body);

        const savedLivreur = await livreur.save();

        return res.status(200).json({
            message: "Véhicules ajoutés avec succès",
            vehicules: savedLivreur.vehicules,
        });
    } catch (error) {
        console.error("Erreur lors de l'ajout des véhicules:", error);
        return res.status(500).json({
            message: "Erreur lors de l'ajout des véhicules",
            error: error.message,
        });
    }
};

export const updateStatut = async (req, res) => {
    try {
        const { userId, statut, vehicleIds } = req.body;
        
        if (!userId) {
            return res.status(401).json({ error: "Utilisateur non authentifié" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "Utilisateur non trouvé" });
        }
        
        const typeMapping = {
            0: "vélo",
            1: "moto",
            2: "voiture",
            3: "autres"
        };

        switch (statut) {
            case "vérifié":
                
                user.vehicules.forEach(vehicule => {
                    const vehicleType = vehicule.type;
                    const vehicleIdForType = Object.keys(typeMapping).find(
                        key => typeMapping[key] === vehicleType
                    );
                    
                    if (vehicleIds.includes(parseInt(vehicleIdForType))) {
                        vehicule.statut = statut;
                        user.statut = statut;
                    }
                });
                break;
                
            case "refusé":
                
                user.vehicules.forEach(vehicule => {
                    vehicule.statut = "refusé";
                    vehicule.current=false;
                });
                user.isWorking=false;
                user.statut = statut;
                break;
                
            case "en vérification":
                
                user.vehicules.forEach(vehicule => {
                    const vehicleType = vehicule.type;
                    const vehicleIdForType = Object.keys(typeMapping).find(
                        key => typeMapping[key] === vehicleType
                    );
                    user.vehicules.forEach(vehicule => {
                        vehicule.current=false;
                    });
                    user.isWorking=false
                    if (vehicleIds.includes(parseInt(vehicleIdForType))) {
                        vehicule.statut = statut;
                        user.statut = statut;
                    } else if (vehicule.statut === "vérifié") {
                        vehicule.statut = "refusé";
                    }

                   

                });
                break;
                
            case "non vérifié":
                
                user.vehicules.forEach(vehicule => {
                    vehicule.statut = statut;
                    vehicule.current = false;
                });
                user.isWorking = false;
                user.statut = statut;
                break;
                
            default:
                return res.status(400).json({
                    success: false,
                    error: "Statut non valide"
                });
        }
        
        await user.save();
        
        return res.status(200).json({
            success: true,
            message: "Changement de status effectué avec succès"
        });
        
    } catch (error) {
        console.error("Erreur updateStatut:", error);
        return res.status(500).json({
            success: false,
            error: "Une erreur est survenue lors du changement de statut."
        });
    }
};

export const updateUserInfo = async (req, res) => {
    try {
        const {
            userId,
            nom,
            email,
            adresses_favorites,
            numero,
            role,
            nom_boutique,
            adresse_boutique,
            distance_max,
            vehicules,
            disponibilite
        } = req.body;
        
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "Utilisateur non trouvé" });
        }
        if (nom || email || numero){
            user.nom = nom;
            user.email = email;
            user.numero = numero;
    
        }
      
        if (role == "client") {
            user.adresses_favorites = adresses_favorites;
        } else if (role == "commercant") {
            user.nom_boutique = nom_boutique;
            user.adresse_boutique = adresse_boutique;
        } else if (role == "livreur") {
            if(distance_max){
                user.distance_max = distance_max;
            }
            
            user.vehicules = vehicules;

            
            console.log(user.vehicules);
            
            
            let falseVehicule = 0;
            const invalidStatuts = ["refusé", "en vérification", "non vérifié"];
            let refuseCompteur=0;
            let enVerificationCompteur=0;
            let nonVerifieCompteur=0;
            for (const vehicule of user.vehicules) {
                if (invalidStatuts.includes(vehicule.statut)) {
                    falseVehicule++;
                }
                if(vehicule.statut=="vérifié"){
                    user.statut = "vérifié"
                }
                if (vehicule.statut=="refusé"){
                    refuseCompteur++;
                }
                if (vehicule.statut=="non vérifié"){
                    nonVerifieCompteur++;
                }
                if (vehicule.statut=="en vérification"){
                    enVerificationCompteur++;
                }
            }

            

            if(refuseCompteur==user.vehicules.length){
                user.statut = "refusé"
            }

            else if(nonVerifieCompteur== user.vehicules.length){
                user.statut = "non vérifié"
            }

            else if(refuseCompteur+nonVerifieCompteur+enVerificationCompteur==user.vehicules.length){
                user.statut = "en vérification"
            }

            if (disponibilite == true){
                user.isWorking=true;
            }
            else{
                user.isWorking=false;
            }
            
        }

        await user.save();
        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Erreur updateUserInfo:", error);
        return res.status(500).json({
            success: false,
            error: "Erreur lors de la mise à jour des infos du user",
        });
    }
};


export const updateCurrentVehicle = async (req, res) => {
    try {
        const { userId, vehiculeId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: "ID utilisateur requis",
            });
        }

        const livreur = await Livreur.findById(userId);
        if (!livreur) {
            return res.status(404).json({
                success: false,
                error: "Livreur non trouvé",
            });
        }

        livreur.vehicules = livreur.vehicules.map((v) => ({
            ...v,
            current: false,
        }));

        if (vehiculeId) {
            const vehicleIndex = livreur.vehicules.findIndex(
                (v) => v._id.toString() === vehiculeId
            );

            if (vehicleIndex === -1) {
                return res.status(404).json({
                    success: false,
                    error: "Véhicule non trouvé",
                });
            }

            if (livreur.vehicules[vehicleIndex].statut !== "vérifié") {
                return res.status(400).json({
                    success: false,
                    error: "Ce véhicule n'est pas vérifié",
                });
            }

            livreur.vehicules[vehicleIndex].current = true;
        }

        await livreur.save();

        return res.status(200).json({
            success: true,
            message: vehiculeId
                ? "Véhicule actuel mis à jour"
                : "Aucun véhicule actuel",
            data: livreur.vehicules,
        });
    } catch (error) {
        console.error("Erreur updateCurrentVehicle:", error);
        return res.status(500).json({
            success: false,
            error: "Erreur lors de la mise à jour du véhicule actuel",
        });
    }
};
