"use client";

import { useAuthUserQuery, useGetUsersByRole, useGetCoords } from "../../Hooks";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useEffect, useState, useMemo } from "react";
import { FaStore, FaMapMarkerAlt, FaMoneyBillWave } from "react-icons/fa";

const CreateCommandePage = () => {
    const { data: authUser } = useAuthUserQuery();
    const [shouldSubmit, setShouldSubmit] = useState(false);

    const [formData, setFormData] = useState({
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

    const fullAdresse =
        formData.adresse_livraison.rue &&
        formData.adresse_livraison.ville &&
        formData.adresse_livraison.code_postal
            ? `${formData.adresse_livraison.rue}, ${formData.adresse_livraison.ville}, ${formData.adresse_livraison.code_postal}`
            : null;

    const {
        data: coords,
        isSuccess,
        isFetching,
        refetch,
    } = useGetCoords(fullAdresse, {
        enabled: false, 
        retry: false,
    });

    const { data: commercantsData, isLoading: isLoadingCommercants } =
        useGetUsersByRole("commercant");

    const commercantsWithAddress = useMemo(() => {
        if (!commercantsData?.data) return [];

        return commercantsData.data.filter(
            (commercant) =>
                commercant.adresse_boutique &&
                commercant.adresse_boutique.rue &&
                commercant.adresse_boutique.ville &&
                commercant.adresse_boutique.code_postal
        );
    }, [commercantsData]);

    const { mutate: createCommandeMutation, isPending } = useMutation({
        mutationFn: async (commandeData) => {
            const res = await fetch(`/api/commandes/new`, {
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

        const { commercant_id, adresse_livraison, total } = formData;

        if (
            !authUser?._id ||
            !commercant_id ||
            !adresse_livraison.rue ||
            !adresse_livraison.ville ||
            !adresse_livraison.code_postal ||
            !total
        ) {
            toast.error("Veuillez remplir tous les champs obligatoires");
            return;
        }

        setShouldSubmit(true);
        refetch();
    };

    useEffect(() => {
        if (shouldSubmit && isSuccess && coords) {
            setShouldSubmit(false);
            createCommandeMutation({
                ...formData,
                client_id: authUser._id,
                adresse_livraison: {
                    ...formData.adresse_livraison,
                    lat: coords.lat,
                    lng: coords.lng,
                },
            });
        }
    }, [shouldSubmit, isSuccess, coords]);

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
        <div className="w-full h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 p-4 sm:p-6 flex flex-col sm:justify-items-center sm:items-center">
            <div className="flex flex-col gap-6 justify-center items-center w-full max-w-xl mx-auto bg-white p-4 sm:p-8 rounded-xl shadow-2xl">
                <h1 className="text-2xl sm:text-3xl font-bold text-emerald-600 mb-2 sm:mb-4">
                    Créer une commande
                </h1>
                <form
                    onSubmit={handleSubmit}
                    className="w-full flex flex-col gap-4"
                >
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700">
                            Commerçant
                        </label>
                        <div className="relative">
                            <FaStore className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black" />
                            <select
                                name="commercant_id"
                                className="pl-10 w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                onChange={handleInputChange}
                                value={formData.commercant_id}
                                disabled={isLoadingCommercants}
                            >
                                <option value="">
                                    Sélectionner un commerçant
                                </option>
                                {commercantsWithAddress.length > 0 ? (
                                    commercantsWithAddress.map((commercant) => (
                                        <option
                                            key={commercant._id}
                                            value={commercant._id}
                                        >
                                            {commercant.nom_boutique ||
                                                commercant.nom}{" "}
                                            -{" "}
                                            {commercant.adresse_boutique?.ville}
                                        </option>
                                    ))
                                ) : (
                                    <option value="" disabled>
                                        Aucun commerçant avec adresse disponible
                                    </option>
                                )}
                            </select>
                        </div>
                        {commercantsData?.data &&
                            commercantsData.data.length > 0 &&
                            commercantsWithAddress.length === 0 && (
                                <p className="text-amber-600 text-sm mt-1">
                                    Aucun commerçant n'a renseigné son adresse.
                                    Veuillez contacter un commerçant pour qu'il
                                    complète son profil.
                                </p>
                            )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700">
                            Adresse de livraison
                        </label>

                        {authUser?.adresses_favorites &&
                            authUser.adresses_favorites.length > 0 && (
                                <div className="mb-2">
                                    <select
                                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                const selectedAddress =
                                                    authUser.adresses_favorites[
                                                        Number.parseInt(
                                                            e.target.value
                                                        )
                                                    ];
                                                setFormData({
                                                    ...formData,
                                                    adresse_livraison: {
                                                        rue:
                                                            selectedAddress.rue ||
                                                            "",
                                                        ville:
                                                            selectedAddress.ville ||
                                                            "",
                                                        code_postal:
                                                            selectedAddress.code_postal ||
                                                            "",
                                                        lat:
                                                            selectedAddress.lat ||
                                                            "",
                                                        lng:
                                                            selectedAddress.lng ||
                                                            "",
                                                    },
                                                });
                                            }
                                        }}
                                        defaultValue=""
                                    >
                                        <option value="">
                                            -- Sélectionner une adresse favorite
                                            --
                                        </option>
                                        {authUser.adresses_favorites.map(
                                            (adresse, index) => (
                                                <option
                                                    key={index}
                                                    value={index}
                                                >
                                                    {adresse.nom
                                                        ? `${adresse.nom}: `
                                                        : ""}
                                                    {adresse.rue},{" "}
                                                    {adresse.ville},{" "}
                                                    {adresse.code_postal}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>
                            )}

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
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input
                                type="text"
                                placeholder="Ville"
                                name="ville"
                                className="w-full sm:w-1/2 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                onChange={handleAdresseChange}
                                value={formData.adresse_livraison.ville}
                            />
                            <input
                                type="text"
                                placeholder="Code postal"
                                name="code_postal"
                                className="w-full sm:w-1/2 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                onChange={handleAdresseChange}
                                value={formData.adresse_livraison.code_postal}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700">
                            Total
                        </label>
                        <div className="relative">
                            <FaMoneyBillWave className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black" />
                            <input
                                type="number"
                                name="total"
                                className="pl-10 w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                onChange={handleInputChange}
                                value={formData.total || ""}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-emerald-600 text-white py-3 rounded-md hover:bg-emerald-700 transition duration-300 mt-4"
                        disabled={isFetching || isPending}
                    >
                        {isFetching || isPending ? (
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
