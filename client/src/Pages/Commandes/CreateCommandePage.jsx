import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useState } from "react";
import {
    FaUser,
    FaStore,
    FaMapMarkerAlt,
    FaMoneyBillWave,
} from "react-icons/fa";

const CreateCommandePage = () => {
    const [formData, setFormData] = useState({
        client_id: "",
        commercant_id: "",
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

    return (
        <div className="w-full h-screen items-center justify-center bg-gray-100 p-6 flex flex-col">
            <div className="flex flex-col gap-6 justify-center items-center w-1/2 h-9/10 bg-white p-8 rounded-xl shadow-2xl">
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
            </div>
        </div>
    );
};

export default CreateCommandePage;
