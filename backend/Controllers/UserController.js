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
      return res.status(404).json({ success: false, error: "User not found" });
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
  console.log("User ID:", userId);

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
        return res.status(400).json({ error: "Mot de passe actuel requis" });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: "Mot de passe actuel incorrect" });
      }
      user.password = await bcrypt.hash(newPassword, 10);
    }

    // Champs spécifiques selon le rôle
    switch (user.role) {
      case "commercant":
        user.nom_boutique = nom_boutique || user.nom_boutique;
        user.adresse_boutique = adresse_boutique || user.adresse_boutique;
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
              error:
                "La plaque d'immatriculation est obligatoire pour une voiture ou une moto",
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
          disponibilite !== undefined ? disponibilite : user.disponibilite;
        user.distance_max = distance_max || user.distance_max;
        break;
      case "client":
        user.adresses_favorites = adresses_favorites || user.adresses_favorites;
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
  console.log("req.body", req.body);

  try {
    const { id } = req.body;
    const user = await Livreur.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    user.disponibilite = !user.disponibilite;
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
    if (!livreur.disponibilite) {
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
    const livreurs = await Livreur.find({ disponibilite: true }).select(
      "-password"
    );
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
