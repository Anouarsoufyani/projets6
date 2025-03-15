import { generateTokenAndSetCookie } from "../Lib/utils/generateToken.js";
import userModels from "../Models/User.js";
import Commande from "../Models/Commandes.js";
const { User, Client, Commercant, Livreur } = userModels;
import bcrypt from "bcryptjs";

// export const signup = async (req, res) => {
//     // validation for req.body
//     const { email, nom, password, numero, role } = req.body;

//     // Regular expression for email validation (i dont understand but ok)
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

//     try {
//         // validation for email
//         if (!emailRegex.test(email)) {
//             return res
//                 .status(400)
//                 .json({ success: false, error: "Invalid email address" });
//         }

//         // checking if email already exists
//         const existingEmail = await User.findOne({ email });
//         if (existingEmail) {
//             return res
//                 .status(400)
//                 .json({ success: false, error: "Email already taken" });
//         }

//         const existingNumber = await User.findOne({ numero });
//         if (existingNumber) {
//             return res
//                 .status(400)
//                 .json({ success: false, error: "Email already taken" });
//         }
//         // checking if password is at least 6 characters
//         if (password.length < 6) {
//             return res.status(400).json({
//                 success: false,
//                 error: "Password must be at least 6 characters",
//             });
//         }

//         //hash password
//         // example : pass os 123456 -> it will be something like wuijfowebf327423gr784vbf47
//         const salt = await bcrypt.genSalt(10);
//         const hashedPassword = await bcrypt.hash(password, salt);

//         if (!nom || !email || !password || !numero || !role) {
//             return res
//                 .status(400)
//                 .json({ success: false, error: "All fields are required" });
//         }

//         if (role !== "livreur" && role !== "client" && role !== "commercant") {
//             return res
//                 .status(400)
//                 .json({ success: false, error: "Invalid user type" });
//         }

//         let newUser;

//         if (role === "livreur") {
//             newUser = new Livreur({
//                 nom,
//                 numero,
//                 email,
//                 role,
//                 password: hashedPassword,
//             });
//         } else if (role === "commercant") {
//             newUser = new Commercant({
//                 nom,
//                 numero,
//                 email,
//                 role,
//                 password: hashedPassword,
//             });
//         } else if (role === "client") {
//             newUser = new Client({
//                 nom,
//                 numero,
//                 email,
//                 role,
//                 password: hashedPassword,
//             });
//         }

//         console.log(newUser);

//         if (newUser) {
//             await newUser.save();

//             generateTokenAndSetCookie(newUser._id, res);

//             return res.status(201).json({
//                 success: true,
//                 message: "User created successfully",
//                 _id: newUser._id,
//                 name: newUser.nom,
//                 numero: newUser.numero,
//                 email: newUser.email,
//                 profilePic: newUser.profilePic,
//                 role: newUser.role,
//             });
//         } else {
//             console.log("error", error.message);
//             return res
//                 .status(400)
//                 .json({ success: false, error: "Invalid user data" });
//         }
//     } catch (error) {
//         return res.status(400).json({ success: false, message: error.message });
//     }
// };

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
            // case "admin":
            //     // Pour un administrateur, aucun filtre (toutes les commandes)
            //     break;
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
    // const {
    //     client_id,
    //     commercant_id,
    //     livreur_id,
    //     total,
    //     statut,
    //     adresse_livraison,
    // } = req.body;
    const commandeFictive = new Commande({
        client_id: "67d15d4c87a55d5aadf95b03",
        commercant_id: "67d15e4ccf1feb1de84ad918",
        livreur_id: "67d15c6987a55d5aadf95aff",
        total: 3 * 15.99 + 2 * 5.5, // 47.97 + 11.00 = 58.97
        statut: "en_livraison", // Commande en cours de livraison
        adresse_livraison: {
            rue: "12 Rue de la Paix",
            ville: "Paris",
            code_postal: "75002",
            lat: 48.8693, // Coordonnées réelles de cette zone à Paris
            lng: 2.3314,
        },
        date_creation: new Date(), // Date fictive (aujourd'hui)
        date_livraison: null, // Pas encore livrée
    });

    // Sauvegarde dans la base (à utiliser dans ton code)
    try {
        await commandeFictive.save();
        return res.status(201).json(commandeFictive);
        console.log("Commande fictive sauvegardée :", commandeFictive);
    } catch (err) {
        console.error("Erreur :", err);
        return res.status(500).json({ error: "Erreur lors de la sauvegarde" });
    }
};
