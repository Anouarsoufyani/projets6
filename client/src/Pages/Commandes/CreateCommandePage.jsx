import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useState } from "react";
import { Link } from "react-router"; // Corrigé pour react-router-dom
import {
    FaUser,
    FaStore,
    FaBox,
    FaMapMarkerAlt,
    FaMoneyBillWave,
} from "react-icons/fa";

const CreateCommandePage = () => {
    const [formData, setFormData] = useState({
        client_id: "",
        commercant_id: "",
        produits: [{ produit_id: "", quantite: 1, prix_unitaire: 0 }],
        adresse_livraison: {
            rue: "",
            ville: "",
            code_postal: "",
            lat: "",
            lng: "",
        },
        total: 0,
    });

    const { mutate: createCommandeMutation, isPending } = useMutation({
        mutationFn: async (commandeData) => {
            const res = await fetch("/api/commandes/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(commandeData),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(
                    data.error || "Erreur lors de la création de la commande"
                );
            }

            return data;
        },
        onSuccess: () => {
            toast.success("Commande créée avec succès");
            setFormData({
                client_id: "",
                commercant_id: "",
                produits: [{ produit_id: "", quantite: 1, prix_unitaire: 0 }],
                adresse_livraison: {
                    rue: "",
                    ville: "",
                    code_postal: "",
                    lat: "",
                    lng: "",
                },
                total: 0,
            });
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const { client_id, commercant_id, produits, adresse_livraison } =
            formData;

        // Validation de base
        if (
            !client_id ||
            !commercant_id ||
            produits.length === 0 ||
            !adresse_livraison.rue
        ) {
            toast.error("Veuillez remplir tous les champs obligatoires");
            return;
        }

        // Calcul du total
        const total = produits.reduce(
            (acc, produit) => acc + produit.quantite * produit.prix_unitaire,
            0
        );

        createCommandeMutation({ ...formData, total });
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAdresseChange = (e) => {
        setFormData({
            ...formData,
            adresse_livraison: {
                ...formData.adresse_livraison,
                [e.target.name]: e.target.value,
            },
        });
    };

    const handleProduitChange = (index, e) => {
        const newProduits = [...formData.produits];
        newProduits[index][e.target.name] = e.target.value;
        setFormData({ ...formData, produits: newProduits });
    };

    const addProduit = () => {
        setFormData({
            ...formData,
            produits: [
                ...formData.produits,
                { produit_id: "", quantite: 1, prix_unitaire: 0 },
            ],
        });
    };

    return (
        <main className="flex justify-center items-center w-full h-[95vh] bg-gray-100">
            <div className="flex flex-col gap-6 justify-center items-center w-1/2 bg-white p-8 rounded-xl shadow-2xl">
                <h1 className="text-3xl font-bold text-emerald-600 mb-4">
                    Créer une commande
                </h1>
                <form
                    onSubmit={handleSubmit}
                    className="w-full flex flex-col gap-4"
                >
                    {/* Client */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700">
                            Client
                        </label>
                        <div className="relative">
                            <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black" />
                            <input
                                type="text"
                                placeholder="ID du client"
                                name="client_id"
                                className="pl-10 w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                onChange={handleInputChange}
                                value={formData.client_id}
                            />
                        </div>
                    </div>

                    {/* Commerçant */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700">
                            Commerçant
                        </label>
                        <div className="relative">
                            <FaStore className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black" />
                            <input
                                type="text"
                                placeholder="ID du commerçant"
                                name="commercant_id"
                                className="pl-10 w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                onChange={handleInputChange}
                                value={formData.commercant_id}
                            />
                        </div>
                    </div>

                    {/* Produits */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700">
                            Produits
                        </label>
                        {formData.produits.map((produit, index) => (
                            <div key={index} className="flex gap-2">
                                <div className="relative flex-1">
                                    <FaBox className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black" />
                                    <input
                                        type="text"
                                        placeholder="ID du produit"
                                        name="produit_id"
                                        className="pl-10 w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        onChange={(e) =>
                                            handleProduitChange(index, e)
                                        }
                                        value={produit.produit_id}
                                    />
                                </div>
                                <input
                                    type="number"
                                    placeholder="Quantité"
                                    name="quantite"
                                    className="w-20 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    onChange={(e) =>
                                        handleProduitChange(index, e)
                                    }
                                    value={produit.quantite}
                                />
                                <input
                                    type="number"
                                    placeholder="Prix unitaire"
                                    name="prix_unitaire"
                                    className="w-28 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    onChange={(e) =>
                                        handleProduitChange(index, e)
                                    }
                                    value={produit.prix_unitaire}
                                />
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addProduit}
                            className="text-emerald-600 hover:underline mt-2"
                        >
                            + Ajouter un produit
                        </button>
                    </div>

                    {/* Adresse de livraison */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700">
                            Adresse de livraison
                        </label>
                        <div className="relative">
                            <FaMapMarkerAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black" />
                            <input
                                type="text"
                                placeholder="Rue"
                                name="rue"
                                className="pl-10 w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                onChange={handleAdresseChange}
                                value={formData.adresse_livraison.rue}
                            />
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Ville"
                                name="ville"
                                className="w-1/2 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                onChange={handleAdresseChange}
                                value={formData.adresse_livraison.ville}
                            />
                            <input
                                type="text"
                                placeholder="Code postal"
                                name="code_postal"
                                className="w-1/2 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                onChange={handleAdresseChange}
                                value={formData.adresse_livraison.code_postal}
                            />
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                placeholder="Latitude"
                                name="lat"
                                className="w-1/2 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                onChange={handleAdresseChange}
                                value={formData.adresse_livraison.lat}
                            />
                            <input
                                type="number"
                                placeholder="Longitude"
                                name="lng"
                                className="w-1/2 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                onChange={handleAdresseChange}
                                value={formData.adresse_livraison.lng}
                            />
                        </div>
                    </div>

                    {/* Total (affiché mais calculé automatiquement) */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700">
                            Total
                        </label>
                        <div className="relative">
                            <FaMoneyBillWave className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black" />
                            <input
                                type="number"
                                name="total"
                                className="pl-10 w-full p-3 border border-gray-300 rounded-md bg-gray-100"
                                value={formData.produits.reduce(
                                    (acc, p) =>
                                        acc + p.quantite * p.prix_unitaire,
                                    0
                                )}
                                readOnly
                            />
                        </div>
                    </div>

                    {/* Bouton de soumission */}
                    <button
                        type="submit"
                        className="w-full bg-emerald-600 text-white py-3 rounded-md hover:bg-emerald-700 transition duration-300 mt-4"
                    >
                        {isPending ? (
                            <span className="loading loading-spinner loading-md"></span>
                        ) : (
                            "Créer la commande"
                        )}
                    </button>
                </form>
                <div className="mt-4 text-center">
                    <p className="text-gray-600">
                        Retourner au tableau de bord ?{" "}
                        <Link
                            to="/dashboard"
                            className="text-emerald-600 font-semibold hover:underline"
                        >
                            Dashboard
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
};

export default CreateCommandePage;
