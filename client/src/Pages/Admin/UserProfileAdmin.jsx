"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router";
import {
    useGetUserById,
    useGetDocuments,
    useGetUserCommandes,
} from "../../Hooks";
import {
    FaSpinner,
    FaTimesCircle,
    FaCheckCircle,
    FaHourglassHalf,
    FaTrash,
    FaEdit,
    FaArrowLeft,
    FaChartLine,
    FaShoppingBag,
    FaMoneyBillWave,
    FaStar,
    FaTruck,
    FaUserCheck,
    FaUserTimes,
    FaUserClock,
} from "react-icons/fa";
import {
    Line,
    LineChart,
    Pie,
    PieChart,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { toast } from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";

const UserProfileAdmin = () => {
    const queryClient = useQueryClient();

    const { userId } = useParams();
    const navigate = useNavigate();
    const [edit, setEdit] = useState(false);
    const [formData, setFormData] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const [activeTab, setActiveTab] = useState("profile");
    const [timeRange, setTimeRange] = useState("month");
    const [showVehicleModal, setShowVehicleModal] = useState(false);
    const [selectedVehicles, setSelectedVehicles] = useState([]);
    const [actionType, setActionType] = useState(null);

    const [selectAllVehicles, setSelectAllVehicles] = useState(false);
    const [userData, setUserData] = useState(null);

    const { data: fetchedUserData, isLoading, error } = useGetUserById(userId);

    useEffect(() => {
        setUserData(fetchedUserData);
    }, [fetchedUserData]);

    const { data: commandesData, isLoading: isLoadingCommandes } =
        useGetUserCommandes(userId);

    const { data: documents, isLoading: docsLoading } = useGetDocuments(
        userData?.data?.role === "livreur" ? userId : null
    );

    useEffect(() => {
        if (userData?.data) {
            setFormData(userData.data);
        }
    }, [userData]);

    const userStats = useMemo(() => {
        if (!commandesData?.commandes || !userData?.data) {
            return {
                totalCommandes: 0,
                totalRevenu: 0,
                commandesParStatut: [],
                commandesParJour: [],
                commandesRecentes: [],
                tauxConversion: 0,
                valeurMoyenneCommande: 0,
            };
        }

        const commandes = commandesData.commandes || [];
        const user = userData.data;

        const userCommandes = commandes.filter((cmd) => {
            if (user.role === "client")
                return (
                    cmd.client_id === userId || cmd.client_id?._id === userId
                );
            if (user.role === "commercant")
                return (
                    cmd.commercant_id === userId ||
                    cmd.commercant_id?._id === userId
                );
            if (user.role === "livreur")
                return (
                    cmd.livreur_id === userId || cmd.livreur_id?._id === userId
                );
            return false;
        });

        const now = new Date();
        const filteredCommandes = userCommandes.filter((cmd) => {
            const cmdDate = new Date(cmd.date_creation);
            if (timeRange === "week") {
                const oneWeekAgo = new Date(
                    now.getTime() - 7 * 24 * 60 * 60 * 1000
                );
                return cmdDate >= oneWeekAgo;
            } else if (timeRange === "month") {
                const oneMonthAgo = new Date(
                    now.getFullYear(),
                    now.getMonth() - 1,
                    now.getDate()
                );
                return cmdDate >= oneMonthAgo;
            } else if (timeRange === "year") {
                const oneYearAgo = new Date(
                    now.getFullYear() - 1,
                    now.getMonth(),
                    now.getDate()
                );
                return cmdDate >= oneYearAgo;
            }
            return true;
        });

        const totalCommandes = filteredCommandes.length;

        const validCommandes = filteredCommandes.filter(
            (cmd) => cmd.statut !== "annulee" && cmd.statut !== "refusee"
        );

        let totalRevenu = 0;
        if (user.role === "commercant") {
            totalRevenu = validCommandes.reduce(
                (sum, cmd) => sum + (cmd.total || 0),
                0
            );
        } else if (user.role === "livreur") {
            totalRevenu = validCommandes.filter(
                (cmd) => cmd.statut === "livree"
            ).length;
        } else {
            totalRevenu = validCommandes.reduce(
                (sum, cmd) => sum + (cmd.total || 0),
                0
            );
        }

        const statutCount = {};
        filteredCommandes.forEach((cmd) => {
            const statut = cmd.statut || "inconnu";
            statutCount[statut] = (statutCount[statut] || 0) + 1;
        });

        const commandesParStatut = Object.entries(statutCount).map(
            ([name, value]) => ({
                name: name.replace(/_/g, " "),
                value,
            })
        );

        const commandesParDate = {};
        filteredCommandes.forEach((cmd) => {
            const date = new Date(cmd.date_creation).toLocaleDateString();
            if (!commandesParDate[date]) {
                commandesParDate[date] = {
                    date,
                    commandes: 0,
                    revenu: 0,
                };
            }
            commandesParDate[date].commandes += 1;

            if (cmd.statut !== "annulee" && cmd.statut !== "refusee") {
                commandesParDate[date].revenu += cmd.total || 0;
            }
        });

        const commandesParJour = Object.values(commandesParDate).sort(
            (a, b) => new Date(a.date) - new Date(b.date)
        );

        const commandesRecentes = [...filteredCommandes]
            .sort(
                (a, b) => new Date(b.date_creation) - new Date(a.date_creation)
            )
            .slice(0, 5);

        const livreesCount = validCommandes.filter(
            (cmd) => cmd.statut === "livree"
        ).length;
        const tauxConversion =
            validCommandes.length > 0
                ? ((livreesCount / validCommandes.length) * 100).toFixed(1)
                : 0;

        const valeurMoyenneCommande =
            validCommandes.length > 0
                ? (
                      validCommandes.reduce(
                          (sum, cmd) => sum + (cmd.total || 0),
                          0
                      ) / validCommandes.length
                  ).toFixed(2)
                : 0;

        return {
            totalCommandes,
            totalRevenu,
            commandesParStatut,
            commandesParJour,
            commandesRecentes,
            tauxConversion,
            valeurMoyenneCommande,
        };
    }, [commandesData, userData, timeRange, userId]);

    const formatCurrency = (amount) => {
        if (amount === undefined || amount === null) return "0.00 €";

        if (amount > 1000000000) {
            return "999,999,999.99 €";
        }

        return (
            amount.toLocaleString("fr-FR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }) + " €"
        );
    };

    useEffect(() => {
        if (selectAllVehicles && userData?.data?.vehicules) {
            setSelectedVehicles(
                userData.data.vehicules.map((_, index) => index)
            );
        } else if (
            !selectAllVehicles &&
            selectedVehicles.length === userData?.data?.vehicules?.length
        ) {
            setSelectedVehicles([]);
        }
    }, [selectAllVehicles, userData?.data?.vehicules, selectedVehicles.length]);

    if (isLoading || docsLoading) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
                <div className="relative animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-600">
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-400 opacity-30"></div>
                </div>
                <p className="mt-4 text-emerald-700 font-medium">Loading...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-red-600 text-center p-4">
                <p>Erreur lors du chargement des données utilisateur</p>
                <p className="text-sm mt-2">{error.message}</p>
                <button
                    onClick={() => navigate(-1)}
                    className="mt-4 px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                    Retour
                </button>
            </div>
        );
    }

    if (!userData || !userData.data) {
        return (
            <div className="text-red-600 text-center p-4">
                <p>Utilisateur non trouvé</p>
                <button
                    onClick={() => navigate(-1)}
                    className="mt-4 px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                    Retour
                </button>
            </div>
        );
    }

    const user = userData.data;

    const handleChange = (e, field = null, subField = null, index = null) => {
        const { name, value, type, checked } = e.target;

        if (field && subField) {
            setFormData((prev) => ({
                ...prev,
                [field]: { ...prev[field], [subField]: value },
            }));
        } else if (field && index !== null) {
            const newArray = [...formData[field]];
            newArray[index][name] = value;
            setFormData((prev) => ({ ...prev, [field]: newArray }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: type === "checkbox" ? checked : value,
            }));
        }
    };

    const getCoords = async (adresse) => {
        if (!adresse) throw new Error("L'adresse ne peut pas être vide");

        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
            adresse
        )}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.status !== "OK") {
            throw new Error(
                data.error_message || "Impossible de récupérer les coordonnées"
            );
        }

        return data.results[0].geometry.location;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const url = "/api/user/updateUserform";
            const requestData = {
                userId: formData._id,
                nom: formData.nom,
                email: formData.email,
                numero: formData.numero,
                adresses_favorites: formData.adresses_favorites,
                role: formData.role,
            };

            if (formData.role == "client" && formData.adresses_favorites) {
                for (let i = 0; i < formData.adresses_favorites.length; i++) {
                    const favorite = formData.adresses_favorites[i];

                    if (
                        favorite?.rue &&
                        favorite?.ville &&
                        favorite?.code_postal
                    ) {
                        const adr = `${favorite.rue} ${favorite.ville} ${favorite.code_postal}`;
                        try {
                            const data = await getCoords(adr);
                            formData.adresses_favorites[i].lat = data.lat;
                            formData.adresses_favorites[i].lng = data.lng;
                            console.log(
                                "formData",
                                formData.adresses_favorites
                            );
                        } catch (error) {
                            console.error(
                                "Erreur récupération coordonnées :",
                                error
                            );
                        }
                    }
                }
            }

            if (formData.role === "commercant") {
                requestData.adresse_boutique = formData.adresse_boutique;
                requestData.nom_boutique = formData.nom_boutique;
            }

            if (formData.role === "livreur") {
                // requestData.distance_max = formData.distance_max;
                requestData.vehicules = formData.vehicules;
                // requestData.disponibilite = formData.disponibilite;
            }

            const res = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestData),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(
                    err.message || "Échec de la mise à jour de l'utilisateur"
                );
            }

            queryClient.invalidateQueries(["getUserById", formData._id]);

            setEdit(false);
        } catch (error) {
            console.error("Erreur lors de la mise à jour du profil :", error);
        }
    };

    const handleDeleteUser = () => {
        if (confirmDelete) {
            console.log("Deleting user:", user._id);
            navigate(-1);
        } else {
            setConfirmDelete(true);
            setTimeout(() => setConfirmDelete(false), 3000);
        }
    };

    const getStatusIcon = (statut) => {
        switch (statut) {
            case "non vérifié":
                return (
                    <FaSpinner className="text-gray-500 animate-spin inline-block mr-2" />
                );
            case "en vérification":
                return (
                    <FaHourglassHalf className="text-yellow-500 inline-block mr-2" />
                );
            case "vérifié":
                return (
                    <FaCheckCircle className="text-green-500 inline-block mr-2" />
                );
            case "refusé":
                return (
                    <FaTimesCircle className="text-red-500 inline-block mr-2" />
                );
            default:
                return (
                    <FaSpinner className="text-gray-500 animate-spin inline-block mr-2" />
                );
        }
    };

    const getStatusClass = (statut) => {
        switch (statut) {
            case "non vérifié":
                return "bg-gray-100 text-gray-800 border-gray-200";
            case "en vérification":
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "vérifié":
                return "bg-green-100 text-green-800 border-green-200";
            case "refusé":
                return "bg-red-100 text-red-800 border-red-200";
            default:
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
        }
    };

    const handleUserStatusChange = async (
        newStatus,
        selectedVehicleIds = []
    ) => {
        try {
            const response = await fetch(`/api/user/changeStatut`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: userId,
                    statut: newStatus,
                    vehicleIds:
                        selectedVehicleIds.length > 0
                            ? selectedVehicleIds
                            : undefined,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.error || "Erreur lors de la mise à jour du statut"
                );
            }

            toast.success(`Statut mis à jour avec succès: ${newStatus}`);

            window.location.reload();
        } catch (error) {
            toast.error(error.message || "Une erreur est survenue");
        }
    };

    const handleDocumentStatusChange = async (documentId, newStatus) => {
        try {
            const response = await fetch(
                `/api/admin/documents/${documentId}/status`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: newStatus }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.error ||
                        "Erreur lors de la mise à jour du statut du document"
                );
            }

            toast.success(
                `Statut du document mis à jour avec succès: ${newStatus}`
            );

            window.location.reload();
        } catch (error) {
            toast.error(
                error.message ||
                    "Une erreur est survenue lors de la mise à jour du statut du document"
            );
        }
    };

    return (
        <main className="w-full min-h-full bg-gradient-to-br from-emerald-50 to-teal-100 p-4 md:p-6 overflow-x-hidden">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-emerald-700 hover:text-emerald-800"
                >
                    <FaArrowLeft /> Retour
                </button>
                <h1 className="text-xl md:text-2xl font-bold text-emerald-700">
                    Profil de {user.nom} ({user.role})
                </h1>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 border-b pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 md:gap-6">
                        <img
                            src={
                                user.profilePic ||
                                "https://placehold.co/100x100"
                            }
                            alt="Profil"
                            className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover"
                        />
                        <div>
                            <p className="text-xl md:text-2xl font-bold text-emerald-700 break-words">
                                {user.nom}
                            </p>
                            <p className="text-gray-600 capitalize">
                                {user.role}
                            </p>
                            {user.role === "livreur" && (
                                <span
                                    className={`${getStatusClass(
                                        user.statut
                                    )} px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center mt-2`}
                                >
                                    {getStatusIcon(user.statut)}
                                    {user.statut}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {user.role === "livreur" && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setActionType("vérifié");
                                        setSelectedVehicles([]);
                                        setShowVehicleModal(true);
                                    }}
                                    className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 transition disabled:opacity-50 flex items-center gap-1"
                                >
                                    <FaUserCheck /> Vérifier
                                </button>
                                <button
                                    onClick={() => {
                                        setActionType("en vérification");
                                        setSelectedVehicles([]);
                                        setShowVehicleModal(true);
                                    }}
                                    className="bg-yellow-500 text-white px-3 py-1 rounded-md hover:bg-yellow-600 transition disabled:opacity-50 flex items-center gap-1"
                                >
                                    <FaUserClock /> En vérification
                                </button>
                                <button
                                    onClick={() => {
                                        const allVehicleIndexes =
                                            user.vehicules?.map(
                                                (_, index) => index
                                            ) || [];
                                        handleUserStatusChange(
                                            "refusé",
                                            allVehicleIndexes
                                        );
                                    }}
                                    className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition disabled:opacity-50 flex items-center gap-1"
                                >
                                    <FaUserTimes /> Refuser
                                </button>
                                <button
                                    onClick={() => {
                                        const allVehicleIndexes =
                                            user.vehicules?.map(
                                                (_, index) => index
                                            ) || [];
                                        handleUserStatusChange(
                                            "non vérifié",
                                            allVehicleIndexes
                                        );
                                    }}
                                    className="bg-gray-500 text-white px-3 py-1 rounded-md hover:bg-gray-600 transition disabled:opacity-50 flex items-center gap-1"
                                >
                                    <FaUserTimes /> Non vérifié
                                </button>
                            </div>
                        )}
                        <button
                            onClick={() => setEdit(!edit)}
                            className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 transition flex items-center gap-1"
                        >
                            <FaEdit /> {edit ? "Annuler" : "Modifier"}
                        </button>
                        <button
                            onClick={handleDeleteUser}
                            className={`${
                                confirmDelete ? "bg-red-700" : "bg-red-500"
                            } text-white px-3 py-1 rounded-md hover:bg-red-700 transition flex items-center gap-1`}
                        >
                            <FaTrash />{" "}
                            {confirmDelete ? "Confirmer" : "Supprimer"}
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mb-6 border-b">
                    <div className="flex overflow-x-auto">
                        <button
                            className={`py-2 px-4 font-medium text-sm focus:outline-none transition-all duration-200 ${
                                activeTab === "profile"
                                    ? "text-emerald-700 border-b-2 border-emerald-500"
                                    : "text-gray-600 hover:text-emerald-600"
                            }`}
                            onClick={() => setActiveTab("profile")}
                        >
                            Profil
                        </button>
                        <button
                            className={`py-2 px-4 font-medium text-sm focus:outline-none transition-all duration-200 ${
                                activeTab === "statistics"
                                    ? "text-emerald-700 border-b-2 border-emerald-500"
                                    : "text-gray-600 hover:text-emerald-600"
                            }`}
                            onClick={() => setActiveTab("statistics")}
                        >
                            Statistiques
                        </button>
                        {user.role === "livreur" && (
                            <button
                                className={`py-2 px-4 font-medium text-sm focus:outline-none transition-all duration-200 ${
                                    activeTab === "documents"
                                        ? "text-emerald-700 border-b-2 border-emerald-500"
                                        : "text-gray-600 hover:text-emerald-600"
                                }`}
                                onClick={() => setActiveTab("documents")}
                            >
                                Documents
                            </button>
                        )}
                    </div>
                </div>

                {activeTab === "profile" && (
                    <>
                        {edit ? (
                            <form
                                onSubmit={handleSubmit}
                                className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
                            >
                                <FormField
                                    label="Nom"
                                    name="nom"
                                    value={formData.nom}
                                    onChange={handleChange}
                                />
                                <FormField
                                    label="Email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                                <FormField
                                    label="Numéro"
                                    name="numero"
                                    type="tel"
                                    value={formData.numero}
                                    onChange={handleChange}
                                    pattern="^0[1-9](\s?\d{2}){4}$"
                                />

                                {user.role === "commercant" && (
                                    <>
                                        <FormField
                                            label="Nom de la boutique"
                                            name="nom_boutique"
                                            value={formData.nom_boutique || ""}
                                            onChange={handleChange}
                                        />
                                        <div className="col-span-1 md:col-span-2">
                                            <label className="block mb-1 text-sm font-medium text-gray-700">
                                                Adresse de la boutique
                                            </label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {[
                                                    "rue",
                                                    "ville",
                                                    "code_postal",
                                                ].map((field) => (
                                                    <input
                                                        key={field}
                                                        value={
                                                            formData
                                                                .adresse_boutique?.[
                                                                field
                                                            ] || ""
                                                        }
                                                        onChange={(e) =>
                                                            handleChange(
                                                                e,
                                                                "adresse_boutique",
                                                                field
                                                            )
                                                        }
                                                        className="p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}

                                {user.role === "livreur" && (
                                    <>
                                        <div className="col-span-1 md:col-span-2">
                                            <label className="block mb-1 text-sm font-medium text-gray-700">
                                                Véhicules
                                            </label>
                                            {formData.vehicules &&
                                            formData.vehicules.length > 0 ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                                    {formData.vehicules.map(
                                                        (vehicule, index) => (
                                                            <div
                                                                key={index}
                                                                className="border rounded-lg p-3 bg-gray-50"
                                                            >
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <div>
                                                                        <label className="text-xs text-gray-500">
                                                                            Type
                                                                        </label>
                                                                        <select
                                                                            name="type"
                                                                            value={
                                                                                vehicule.type ||
                                                                                ""
                                                                            }
                                                                            onChange={(
                                                                                e
                                                                            ) =>
                                                                                handleChange(
                                                                                    e,
                                                                                    "vehicules",
                                                                                    null,
                                                                                    index
                                                                                )
                                                                            }
                                                                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                                                        >
                                                                            {[
                                                                                "voiture",
                                                                                "moto",
                                                                                "vélo",
                                                                                "autres",
                                                                            ].map(
                                                                                (
                                                                                    type
                                                                                ) => (
                                                                                    <option
                                                                                        key={
                                                                                            type
                                                                                        }
                                                                                        value={
                                                                                            type
                                                                                        }
                                                                                    >
                                                                                        {type
                                                                                            .charAt(
                                                                                                0
                                                                                            )
                                                                                            .toUpperCase() +
                                                                                            type.slice(
                                                                                                1
                                                                                            )}
                                                                                    </option>
                                                                                )
                                                                            )}
                                                                        </select>
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-xs text-gray-500">
                                                                            Plaque
                                                                        </label>
                                                                        <input
                                                                            type="text"
                                                                            name="plaque"
                                                                            value={
                                                                                vehicule.plaque ||
                                                                                ""
                                                                            }
                                                                            onChange={(
                                                                                e
                                                                            ) =>
                                                                                handleChange(
                                                                                    e,
                                                                                    "vehicules",
                                                                                    null,
                                                                                    index
                                                                                )
                                                                            }
                                                                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-xs text-gray-500">
                                                                            Couleur
                                                                        </label>
                                                                        <input
                                                                            type="text"
                                                                            name="couleur"
                                                                            value={
                                                                                vehicule.couleur ||
                                                                                ""
                                                                            }
                                                                            onChange={(
                                                                                e
                                                                            ) =>
                                                                                handleChange(
                                                                                    e,
                                                                                    "vehicules",
                                                                                    null,
                                                                                    index
                                                                                )
                                                                            }
                                                                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-xs text-gray-500">
                                                                            Capacité
                                                                        </label>
                                                                        <input
                                                                            type="number"
                                                                            name="capacite"
                                                                            value={
                                                                                vehicule.capacite ||
                                                                                ""
                                                                            }
                                                                            onChange={(
                                                                                e
                                                                            ) =>
                                                                                handleChange(
                                                                                    e,
                                                                                    "vehicules",
                                                                                    null,
                                                                                    index
                                                                                )
                                                                            }
                                                                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                                                            min="1"
                                                                            max="100"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="mt-2">
                                                                    <label className="text-xs text-gray-500">
                                                                        Statut
                                                                    </label>
                                                                    <select
                                                                        name="statut"
                                                                        value={
                                                                            vehicule.statut ||
                                                                            ""
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            handleChange(
                                                                                e,
                                                                                "vehicules",
                                                                                null,
                                                                                index
                                                                            )
                                                                        }
                                                                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                                                    >
                                                                        {[
                                                                            "non vérifié",
                                                                            "vérifié",
                                                                            "refusé",
                                                                            "en vérification",
                                                                        ].map(
                                                                            (
                                                                                statut
                                                                            ) => (
                                                                                <option
                                                                                    key={
                                                                                        statut
                                                                                    }
                                                                                    value={
                                                                                        statut
                                                                                    }
                                                                                >
                                                                                    {statut
                                                                                        .charAt(
                                                                                            0
                                                                                        )
                                                                                        .toUpperCase() +
                                                                                        statut.slice(
                                                                                            1
                                                                                        )}
                                                                                </option>
                                                                            )
                                                                        )}
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-gray-500 text-sm">
                                                    Aucun véhicule enregistré
                                                </p>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setFormData({
                                                        ...formData,
                                                        vehicules: [
                                                            ...(formData.vehicules ||
                                                                []),
                                                            {
                                                                type: "voiture",
                                                                plaque: "",
                                                                couleur: "",
                                                                capacite: 50,
                                                                statut: "non vérifié",
                                                            },
                                                        ],
                                                    })
                                                }
                                                className="text-emerald-600 hover:underline text-sm"
                                            >
                                                + Ajouter un véhicule
                                            </button>
                                        </div>

                                        {/* <FormField
                                            label="Distance max (km)"
                                            name="distance_max"
                                            type="number"
                                            value={formData.distance_max || ""}
                                            onChange={handleChange}
                                        /> */}

                                        {/* <div className="col-span-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="disponibilite"
                          name="disponibilite"
                          checked={formData.disponibilite || false}
                          onChange={handleChange}
                          className="h-4 w-4 text-emerald-600 border-gray-300 rounded"
                        />
                        <label htmlFor="disponibilite" className="text-sm font-medium text-gray-700">
                          Disponible
                        </label>
                      </div>
                    </div> */}
                                    </>
                                )}

                                {user.role === "client" && (
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block mb-1 text-sm font-medium text-gray-700">
                                            Adresses favorites
                                        </label>
                                        {formData.adresses_favorites?.map(
                                            (adresse, index) => (
                                                <div
                                                    key={index}
                                                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mb-2"
                                                >
                                                    {[
                                                        "rue",
                                                        "ville",
                                                        "code_postal",
                                                    ].map((field) => (
                                                        <input
                                                            key={field}
                                                            type="text"
                                                            placeholder={
                                                                field
                                                                    .charAt(0)
                                                                    .toUpperCase() +
                                                                field
                                                                    .slice(1)
                                                                    .replace(
                                                                        "_",
                                                                        " "
                                                                    )
                                                            }
                                                            value={
                                                                adresse[
                                                                    field
                                                                ] || ""
                                                            }
                                                            name={field}
                                                            onChange={(e) =>
                                                                handleChange(
                                                                    e,
                                                                    "adresses_favorites",
                                                                    null,
                                                                    index
                                                                )
                                                            }
                                                            className="p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                                        />
                                                    ))}
                                                </div>
                                            )
                                        )}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setFormData({
                                                    ...formData,
                                                    adresses_favorites: [
                                                        ...(formData.adresses_favorites ||
                                                            []),
                                                        {
                                                            rue: "",
                                                            ville: "",
                                                            code_postal: "",
                                                            lat: "",
                                                            lng: "",
                                                        },
                                                    ],
                                                })
                                            }
                                            className="text-emerald-600 hover:underline mt-2"
                                        >
                                            + Ajouter une adresse
                                        </button>
                                    </div>
                                )}

                                <div className="col-span-1 md:col-span-2 flex justify-end mt-4">
                                    <button
                                        type="submit"
                                        className="bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-600 transition"
                                    >
                                        Mettre à jour
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-lg md:text-xl font-bold text-emerald-700 mb-4">
                                        Informations
                                    </p>
                                    <ul className="space-y-2 text-gray-700">
                                        {["nom", "email", "numero", "role"].map(
                                            (field) => (
                                                <li
                                                    key={field}
                                                    className="break-words"
                                                >
                                                    <strong>
                                                        {field
                                                            .charAt(0)
                                                            .toUpperCase() +
                                                            field.slice(1)}{" "}
                                                        :
                                                    </strong>{" "}
                                                    {user[field] || "N/A"}
                                                </li>
                                            )
                                        )}
                                    </ul>
                                </div>
                                <div>
                                    {user.role === "commercant" && (
                                        <ul className="space-y-2 text-gray-700">
                                            <li className="break-words">
                                                <strong>Nom boutique :</strong>{" "}
                                                {user.nom_boutique || "N/A"}
                                            </li>
                                            <li className="break-words">
                                                <strong>
                                                    Adresse boutique :
                                                </strong>{" "}
                                                {user.adresse_boutique?.rue
                                                    ? `${user.adresse_boutique.rue}, ${user.adresse_boutique.ville}`
                                                    : "N/A"}
                                            </li>
                                        </ul>
                                    )}
                                    {user.role === "livreur" && (
                                        <>
                                            <p className="text-lg font-bold text-emerald-700 mb-2">
                                                Véhicules
                                            </p>
                                            {user.vehicules &&
                                            user.vehicules.length > 0 ? (
                                                <div className="space-y-3">
                                                    {user.vehicules.map(
                                                        (vehicule, index) => (
                                                            <div
                                                                key={index}
                                                                className="border rounded-lg p-3 bg-gray-50"
                                                            >
                                                                <div className="flex items-center mb-1">
                                                                    <div
                                                                        className={`w-3 h-3 rounded-full mr-2 ${
                                                                            vehicule.statut ===
                                                                            "vérifié"
                                                                                ? "bg-green-500"
                                                                                : vehicule.statut ===
                                                                                  "refusé"
                                                                                ? "bg-red-500"
                                                                                : vehicule.statut ===
                                                                                  "en vérification"
                                                                                ? "bg-yellow-500"
                                                                                : "bg-gray-500"
                                                                        }`}
                                                                    ></div>
                                                                    <span className="font-medium capitalize">
                                                                        {
                                                                            vehicule.type
                                                                        }
                                                                    </span>
                                                                    {vehicule.current && (
                                                                        <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                                                                            Actuel
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {vehicule.plaque && (
                                                                    <p className="text-sm">
                                                                        Plaque:{" "}
                                                                        {
                                                                            vehicule.plaque
                                                                        }
                                                                    </p>
                                                                )}
                                                                {vehicule.couleur && (
                                                                    <p className="text-sm">
                                                                        Couleur:{" "}
                                                                        {
                                                                            vehicule.couleur
                                                                        }
                                                                    </p>
                                                                )}
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    Statut:{" "}
                                                                    {
                                                                        vehicule.statut
                                                                    }
                                                                </p>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-gray-500">
                                                    Aucun véhicule enregistré
                                                </p>
                                            )}
                                            <ul className="space-y-2 text-gray-700 mt-4">
                                                <li className="break-words">
                                                    <strong>
                                                        Disponibilité :
                                                    </strong>{" "}
                                                    {user.disponibilite
                                                        ? "Oui"
                                                        : "Non"}
                                                </li>
                                                {/* <li className="break-words">
                                                    <strong>
                                                        Distance max :
                                                    </strong>{" "}
                                                    {user.distance_max} km
                                                </li> */}
                                            </ul>
                                        </>
                                    )}
                                    {user.role === "client" && (
                                        <ul className="space-y-2 text-gray-700">
                                            <li>
                                                <strong>
                                                    Adresses favorites :
                                                </strong>
                                                {user.adresses_favorites
                                                    ?.length > 0 ? (
                                                    <ul className="ml-4 list-disc">
                                                        {user.adresses_favorites.map(
                                                            (
                                                                adresse,
                                                                index
                                                            ) => (
                                                                <li
                                                                    key={index}
                                                                    className="break-words"
                                                                >
                                                                    {
                                                                        adresse.rue
                                                                    }{" "}
                                                                    -{" "}
                                                                    {
                                                                        adresse.ville
                                                                    }
                                                                    ,{" "}
                                                                    {
                                                                        adresse.code_postal
                                                                    }
                                                                </li>
                                                            )
                                                        )}
                                                    </ul>
                                                ) : (
                                                    " Aucune"
                                                )}
                                            </li>
                                        </ul>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {activeTab === "statistics" && (
                    <div className="space-y-6">
                        <div className="flex justify-end mb-4">
                            <div className="bg-white rounded-lg shadow-sm p-1 flex items-center">
                                <FaChartLine className="text-emerald-500 mx-2" />
                                <span className="text-sm text-gray-600 mr-2">
                                    Période:
                                </span>
                                <button
                                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                                        timeRange === "week"
                                            ? "bg-emerald-500 text-white shadow-sm"
                                            : "text-gray-600 hover:bg-emerald-100"
                                    }`}
                                    onClick={() => setTimeRange("week")}
                                >
                                    Semaine
                                </button>
                                <button
                                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                                        timeRange === "month"
                                            ? "bg-emerald-500 text-white shadow-sm"
                                            : "text-gray-600 hover:bg-emerald-100"
                                    }`}
                                    onClick={() => setTimeRange("month")}
                                >
                                    Mois
                                </button>
                                <button
                                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                                        timeRange === "year"
                                            ? "bg-emerald-500 text-white shadow-sm"
                                            : "text-gray-600 hover:bg-emerald-100"
                                    }`}
                                    onClick={() => setTimeRange("year")}
                                >
                                    Année
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-emerald-500">
                                <div className="flex items-center justify-between pb-4">
                                    <h3 className="text-base font-semibold text-gray-800">
                                        Total Commandes
                                    </h3>
                                    <div className="p-2 bg-emerald-100 rounded-full">
                                        <FaShoppingBag className="h-5 w-5 text-emerald-600" />
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-emerald-700">
                                    {userStats.totalCommandes}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {timeRange === "week"
                                        ? "Cette semaine"
                                        : timeRange === "month"
                                        ? "Ce mois"
                                        : "Cette année"}
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-blue-500">
                                <div className="flex items-center justify-between pb-4">
                                    <h3 className="text-base font-semibold text-gray-800">
                                        {user.role === "livreur"
                                            ? "Livraisons"
                                            : "Revenus"}
                                    </h3>
                                    <div className="p-2 bg-blue-100 rounded-full">
                                        {user.role === "livreur" ? (
                                            <FaTruck className="h-5 w-5 text-blue-600" />
                                        ) : (
                                            <FaMoneyBillWave className="h-5 w-5 text-blue-600" />
                                        )}
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-blue-700">
                                    {user.role === "livreur"
                                        ? userStats.totalRevenu
                                        : formatCurrency(userStats.totalRevenu)}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {timeRange === "week"
                                        ? "Cette semaine"
                                        : timeRange === "month"
                                        ? "Ce mois"
                                        : "Cette année"}
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-purple-500">
                                <div className="flex items-center justify-between pb-4">
                                    <h3 className="text-base font-semibold text-gray-800">
                                        {user.role === "livreur"
                                            ? "Note moyenne"
                                            : "Taux de conversion"}
                                    </h3>
                                    <div className="p-2 bg-purple-100 rounded-full">
                                        {user.role === "livreur" ? (
                                            <FaStar className="h-5 w-5 text-purple-600" />
                                        ) : (
                                            <FaChartLine className="h-5 w-5 text-purple-600" />
                                        )}
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-purple-700">
                                    {user.role === "livreur"
                                        ? user.note_moyenne || "N/A"
                                        : `${userStats.tauxConversion}%`}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {user.role === "livreur"
                                        ? `${
                                              user.nombre_livraisons || 0
                                          } livraisons`
                                        : "Commandes livrées / Total"}
                                </div>
                            </div>
                        </div>

                        {userStats.commandesParJour.length > 0 && (
                            <div className="bg-white rounded-xl shadow-md p-4 mt-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">
                                    Évolution des commandes
                                </h3>
                                <div className="h-64 border border-gray-100 rounded-lg p-4 bg-gray-50">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <LineChart
                                            data={userStats.commandesParJour}
                                            margin={{
                                                top: 5,
                                                right: 30,
                                                left: 5,
                                                bottom: 5,
                                            }}
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                stroke="#f0f0f0"
                                            />
                                            <XAxis
                                                dataKey="date"
                                                stroke="#6b7280"
                                                tick={{ fontSize: 10 }}
                                            />
                                            <YAxis
                                                yAxisId="left"
                                                stroke="#10b981"
                                                tick={{ fontSize: 10 }}
                                            />
                                            <YAxis
                                                yAxisId="right"
                                                orientation="right"
                                                stroke="#3b82f6"
                                                tick={{ fontSize: 10 }}
                                            />
                                            <Tooltip />
                                            <Legend />
                                            <Line
                                                yAxisId="left"
                                                type="monotone"
                                                dataKey="commandes"
                                                stroke="#10b981"
                                                strokeWidth={2}
                                                name="Nombre de commandes"
                                                dot={{ r: 3 }}
                                            />
                                            {user.role !== "livreur" && (
                                                <Line
                                                    yAxisId="right"
                                                    type="monotone"
                                                    dataKey="revenu"
                                                    stroke="#3b82f6"
                                                    strokeWidth={2}
                                                    name="Revenus (€)"
                                                    dot={{ r: 3 }}
                                                />
                                            )}
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        {userStats.commandesParStatut.length > 0 && (
                            <div className="bg-white rounded-xl shadow-md p-4 mt-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">
                                    Répartition des commandes
                                </h3>
                                <div className="h-64 border border-gray-100 rounded-lg p-4 bg-gray-50">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <PieChart>
                                            <Pie
                                                data={
                                                    userStats.commandesParStatut
                                                }
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                                label={({ name, percent }) =>
                                                    `${name} ${(
                                                        percent * 100
                                                    ).toFixed(0)}%`
                                                }
                                            >
                                                {userStats.commandesParStatut.map(
                                                    (entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={
                                                                COLORS[
                                                                    index %
                                                                        COLORS.length
                                                                ]
                                                            }
                                                        />
                                                    )
                                                )}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        {userStats.commandesRecentes.length > 0 && (
                            <div className="bg-white rounded-xl shadow-md p-4 mt-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">
                                    Commandes récentes
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-gray-50">
                                                <th className="text-left py-3 px-4 font-semibold text-gray-600 rounded-tl-lg">
                                                    ID
                                                </th>
                                                <th className="text-left py-3 px-4 font-semibold text-gray-600">
                                                    Date
                                                </th>
                                                <th className="text-left py-3 px-4 font-semibold text-gray-600">
                                                    Statut
                                                </th>
                                                <th className="text-right py-3 px-4 font-semibold text-gray-600 rounded-tr-lg">
                                                    Montant
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {userStats.commandesRecentes.map(
                                                (cmd) => (
                                                    <tr
                                                        key={cmd._id}
                                                        className="hover:bg-emerald-50 transition-colors duration-150"
                                                    >
                                                        <td className="py-3 px-4 font-medium text-emerald-600">
                                                            #{cmd._id.slice(-6)}
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            {new Date(
                                                                cmd.date_creation
                                                            ).toLocaleDateString()}
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                                {cmd.statut.replace(
                                                                    /_/g,
                                                                    " "
                                                                )}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 text-right font-semibold">
                                                            {formatCurrency(
                                                                cmd.total
                                                            )}
                                                        </td>
                                                    </tr>
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "documents" && user.role === "livreur" && (
                    <div className="space-y-6">
                        <h2 className="text-lg font-bold text-emerald-700 mb-4">
                            Documents
                        </h2>

                        {docsLoading ? (
                            <div className="flex justify-center py-4">
                                <FaSpinner className="animate-spin text-emerald-500 text-2xl" />
                            </div>
                        ) : documents.data?.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {documents.data.map((doc) => (
                                    <div
                                        key={doc._id}
                                        className="border rounded-lg p-3 bg-gray-50"
                                    >
                                        <p className="font-medium">
                                            {doc.type}
                                        </p>

                                        <p className="text-sm text-gray-600 mb-2">
                                            Label:{" "}
                                            <span className="font-semibold">
                                                {doc.label}
                                            </span>
                                        </p>
                                        <p className="text-sm text-gray-600 mb-2">
                                            Statut:{" "}
                                            <span
                                                className={
                                                    doc.statut === "validé"
                                                        ? "text-green-600"
                                                        : "text-amber-600"
                                                }
                                            >
                                                {doc.statut === "validé"
                                                    ? "Vérifié"
                                                    : "En attente"}
                                            </span>
                                        </p>
                                        <Link
                                            to={`/${doc.url.replace(
                                                /\\/g,
                                                "/"
                                            )}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-blue-500 hover:underline text-sm"
                                        >
                                            Voir le document
                                        </Link>
                                        {doc.statut === "en_attente" && (
                                            <div className="mt-2 flex gap-2">
                                                <button
                                                    onClick={() =>
                                                        handleDocumentStatusChange(
                                                            doc._id,
                                                            "validé"
                                                        )
                                                    }
                                                    className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                                                >
                                                    Valider
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleDocumentStatusChange(
                                                            doc._id,
                                                            "refusé"
                                                        )
                                                    }
                                                    className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                                                >
                                                    Refuser
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-600">
                                Aucun document disponible
                            </p>
                        )}
                    </div>
                )}
            </div>
            {showVehicleModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">
                            {actionType === "vérifié"
                                ? "Sélectionner les véhicules à vérifier"
                                : actionType === "en vérification"
                                ? "Sélectionner les véhicules en vérification"
                                : actionType === "non vérifié"
                                ? "Sélectionner les véhicules non vérifiés"
                                : "Sélectionner les véhicules à refuser"}
                        </h3>

                        {actionType === "en vérification" && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                                <strong>Attention :</strong> Si un véhicule
                                actuellement vérifié n'est pas sélectionné, il
                                passera automatiquement au statut "refusé".
                            </div>
                        )}

                        {user?.vehicules && user.vehicules.length > 0 ? (
                            <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                                <div className="border rounded-lg p-3 bg-gray-100 mb-2">
                                    <div className="flex items-center justify-between">
                                        <label
                                            htmlFor="select-all"
                                            className="font-medium cursor-pointer flex items-center"
                                        >
                                            <input
                                                id="select-all"
                                                type="checkbox"
                                                checked={selectAllVehicles}
                                                onChange={() =>
                                                    setSelectAllVehicles(
                                                        !selectAllVehicles
                                                    )
                                                }
                                                className="mr-2 h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                                            />
                                            Sélectionner tous les véhicules
                                        </label>
                                    </div>
                                </div>
                                {user.vehicules.map((vehicule, index) => (
                                    <div
                                        key={index}
                                        className={`border rounded-lg p-3 cursor-pointer transition-all ${
                                            selectedVehicles.includes(index)
                                                ? "bg-emerald-50 border-emerald-500"
                                                : "bg-gray-50 hover:bg-gray-100"
                                        } ${
                                            actionType === "en vérification" &&
                                            vehicule.statut === "vérifié" &&
                                            !selectedVehicles.includes(index)
                                                ? "border-red-300"
                                                : ""
                                        }`}
                                        onClick={() => {
                                            if (
                                                selectedVehicles.includes(index)
                                            ) {
                                                setSelectedVehicles(
                                                    selectedVehicles.filter(
                                                        (i) => i !== index
                                                    )
                                                );
                                                if (
                                                    selectedVehicles.length ===
                                                    user.vehicules.length
                                                ) {
                                                    setSelectAllVehicles(false);
                                                }
                                            } else {
                                                setSelectedVehicles([
                                                    ...selectedVehicles,
                                                    index,
                                                ]);
                                                if (
                                                    selectedVehicles.length +
                                                        1 ===
                                                    user.vehicules.length
                                                ) {
                                                    setSelectAllVehicles(true);
                                                }
                                            }
                                        }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="font-medium capitalize">
                                                    {vehicule.type}
                                                </span>
                                                {vehicule.plaque && (
                                                    <p className="text-sm">
                                                        Plaque:{" "}
                                                        {vehicule.plaque}
                                                    </p>
                                                )}
                                                {vehicule.couleur && (
                                                    <p className="text-sm">
                                                        Couleur:{" "}
                                                        {vehicule.couleur}
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Statut actuel:{" "}
                                                    {vehicule.statut}
                                                </p>
                                                {actionType ===
                                                    "en vérification" &&
                                                    vehicule.statut ===
                                                        "vérifié" &&
                                                    !selectedVehicles.includes(
                                                        index
                                                    ) && (
                                                        <p className="text-xs text-red-500 mt-1 font-medium">
                                                            Ce véhicule passera
                                                            en "refusé" si non
                                                            sélectionné
                                                        </p>
                                                    )}
                                            </div>
                                            <div className="h-5 w-5 border rounded-md flex items-center justify-center bg-white">
                                                {selectedVehicles.includes(
                                                    index
                                                ) && (
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-4 w-4 text-emerald-500"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 mb-4">
                                Aucun véhicule disponible
                            </p>
                        )}

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowVehicleModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={() => {
                                    if (
                                        selectedVehicles.length === 0 &&
                                        user?.vehicules?.length > 0
                                    ) {
                                        const allVehicleIndexes =
                                            user.vehicules.map(
                                                (_, index) => index
                                            );
                                        handleUserStatusChange(
                                            actionType,
                                            allVehicleIndexes
                                        );
                                    } else {
                                        handleUserStatusChange(
                                            actionType,
                                            selectedVehicles
                                        );
                                    }
                                    setShowVehicleModal(false);
                                }}
                                className={`px-4 py-2 rounded-md text-white ${
                                    actionType === "vérifié"
                                        ? "bg-green-500 hover:bg-green-600"
                                        : actionType === "en vérification"
                                        ? "bg-yellow-500 hover:bg-yellow-600"
                                        : actionType === "non vérifié"
                                        ? "bg-gray-500 hover:bg-gray-600"
                                        : "bg-red-500 hover:bg-red-600"
                                }`}
                            >
                                Confirmer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

function FormField({ label, name, value, onChange, type, pattern }) {
    return (
        <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
                {label}
            </label>
            <input
                type={type || "text"}
                name={name}
                value={value || ""}
                onChange={onChange}
                pattern={pattern}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
            />
        </div>
    );
}

export default UserProfileAdmin;

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];
