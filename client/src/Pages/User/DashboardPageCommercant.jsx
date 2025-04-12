"use client";

import { useState, useMemo } from "react";
import {
    FaStar,
    FaRegStar,
    FaShoppingBag,
    FaUsers,
    FaMoneyBillWave,
    FaChartLine,
    FaChartPie,
    FaClock,
    FaListAlt,
    FaFilter,
    FaChartBar,
    FaUserFriends,
} from "react-icons/fa";
import { useAuthUserQuery } from "../../Hooks/useAuthQueries";
import { useGetUserCommandes } from "../../Hooks/useGetCommandes";
import PropTypes from "prop-types";
import {
    Bar,
    BarChart,
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

// Composants réutilisables
const StarRating = ({ rating }) => (
    <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
            <span key={i} className="mr-0.5">
                {i < rating ? (
                    <FaStar className="text-yellow-500 h-5 w-5" />
                ) : (
                    <FaRegStar className="text-gray-300 h-5 w-5" />
                )}
            </span>
        ))}
    </div>
);

StarRating.propTypes = {
    rating: PropTypes.number.isRequired,
};

const ReviewCard = ({ review }) => (
    <div className="bg-white p-5 rounded-xl shadow-md mb-5 border-l-4 border-emerald-500 hover:shadow-lg transition-shadow duration-300">
        <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-emerald-700 text-lg">
                {review.name}
            </h3>
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {review.date}
            </span>
        </div>
        <div className="mb-2">
            <StarRating rating={review.rating} />
        </div>
        <p className="text-gray-700 mt-2 italic">{review.comment}</p>
    </div>
);

ReviewCard.propTypes = {
    review: PropTypes.shape({
        name: PropTypes.string.isRequired,
        date: PropTypes.string.isRequired,
        rating: PropTypes.number.isRequired,
        comment: PropTypes.string.isRequired,
    }).isRequired,
};

// Données d'exemple pour les avis
const fakeReviews = [
    {
        id: 1,
        name: "Jean Dupont",
        comment: "Service impeccable et livraison rapide !",
        rating: 5,
        date: "12 Mars 2025",
    },
    {
        id: 2,
        name: "Sophie Martin",
        comment: "Bon service mais un peu de retard sur la commande.",
        rating: 4,
        date: "10 Mars 2025",
    },
    {
        id: 3,
        name: "Paul Bernard",
        comment: "Très satisfait, je recommande !",
        rating: 5,
        date: "8 Mars 2025",
    },
    {
        id: 4,
        name: "Alice Morel",
        comment: "Peut mieux faire sur le service client.",
        rating: 3,
        date: "6 Mars 2025",
    },
];

const getAverageRating = (reviews) => {
    if (!reviews.length) return 0;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / reviews.length).toFixed(1);
};

// Couleurs pour les graphiques
const COLORS = [
    "#10b981",
    "#3b82f6",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
];
const STATUS_COLORS = {
    en_attente: "#f59e0b",
    en_preparation: "#3b82f6",
    prete_a_etre_recuperee: "#8b5cf6",
    recuperee_par_livreur: "#ec4899",
    en_livraison: "#10b981",
    livree: "#10b981",
    annulee: "#ef4444",
    refusee: "#ef4444",
};

const DashboardPageCommercant = () => {
    const { data: authUser } = useAuthUserQuery();
    const { data: commandesData, isLoading } = useGetUserCommandes();
    const [timeRange, setTimeRange] = useState("month");
    const [activeTab, setActiveTab] = useState("statistiques");

    // Traitement des données des commandes
    const {
        totalCommandes,
        totalRevenu,
        revenuLivrees,
        revenuNonLivrees,
        clientsUniques,
        commandesParStatut,
        nombreCommandesParStatut,
        commandesParJour,
        commandesParHeure,
        commandesRecentes,
        tauxConversion,
        valeurMoyenneCommande,
        topClients,
        commandesParJourSemaine,
    } = useMemo(() => {
        if (!commandesData?.commandes) {
            return {
                totalCommandes: 0,
                totalRevenu: 0,
                revenuLivrees: 0,
                revenuNonLivrees: 0,
                clientsUniques: 0,
                commandesParStatut: [],
                nombreCommandesParStatut: {},
                commandesParJour: [],
                commandesParHeure: [],
                commandesRecentes: [],
                tauxConversion: 0,
                valeurMoyenneCommande: 0,
                topClients: [],
                commandesParJourSemaine: [],
            };
        }

        const commandes = commandesData.commandes.filter(
            (cmd) =>
                cmd.commercant_id?._id === authUser?._id ||
                cmd.commercant_id === authUser?._id
        );

        // Filtrer par période
        const now = new Date();
        const filteredCommandes = commandes.filter((cmd) => {
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

        // Statistiques globales
        const totalCommandes = filteredCommandes.length;

        // Filtrer les commandes annulées et refusées pour les calculs de revenus
        const commandesValides = filteredCommandes.filter(
            (cmd) => cmd.statut !== "annulee" && cmd.statut !== "refusee"
        );

        // Revenus par statut - IMPORTANT: exclure les commandes annulées et refusées
        const totalRevenu = commandesValides.reduce(
            (sum, cmd) => sum + (cmd.total || 0),
            0
        );
        const revenuLivrees = commandesValides
            .filter((cmd) => cmd.statut === "livree")
            .reduce((sum, cmd) => sum + (cmd.total || 0), 0);
        const revenuNonLivrees = commandesValides
            .filter((cmd) => cmd.statut !== "livree")
            .reduce((sum, cmd) => sum + (cmd.total || 0), 0);

        // Clients uniques
        const clientsIds = new Set(
            filteredCommandes.map((cmd) => cmd.client_id?._id || cmd.client_id)
        );
        const clientsUniques = clientsIds.size;

        // Commandes par statut
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

        // Nombre de commandes par statut (pour affichage détaillé)
        const nombreCommandesParStatut = {
            livrees: filteredCommandes.filter((cmd) => cmd.statut === "livree")
                .length,
            enCours: filteredCommandes.filter(
                (cmd) =>
                    cmd.statut === "en_attente" ||
                    cmd.statut === "en_preparation" ||
                    cmd.statut === "prete_a_etre_recuperee" ||
                    cmd.statut === "recuperee_par_livreur" ||
                    cmd.statut === "en_livraison"
            ).length,
            annulees: filteredCommandes.filter(
                (cmd) => cmd.statut === "annulee" || cmd.statut === "refusee"
            ).length,
            enAttente: filteredCommandes.filter(
                (cmd) => cmd.statut === "en_attente"
            ).length,
            enPreparation: filteredCommandes.filter(
                (cmd) => cmd.statut === "en_preparation"
            ).length,
            enLivraison: filteredCommandes.filter(
                (cmd) => cmd.statut === "en_livraison"
            ).length,
        };

        // Commandes par jour (pour le graphique d'évolution)
        const commandesParDate = {};
        filteredCommandes.forEach((cmd) => {
            const date = new Date(cmd.date_creation).toLocaleDateString();
            if (!commandesParDate[date]) {
                commandesParDate[date] = {
                    date,
                    commandes: 0,
                    revenu: 0,
                    revenuLivrees: 0,
                };
            }
            commandesParDate[date].commandes += 1;

            // N'ajouter au revenu que si la commande n'est pas annulée ou refusée
            if (cmd.statut !== "annulee" && cmd.statut !== "refusee") {
                commandesParDate[date].revenu += cmd.total || 0;
                if (cmd.statut === "livree") {
                    commandesParDate[date].revenuLivrees += cmd.total || 0;
                }
            }
        });

        // Trier par date
        const commandesParJour = Object.values(commandesParDate).sort(
            (a, b) => new Date(a.date) - new Date(b.date)
        );

        // Commandes par heure
        const heuresCount = {};
        filteredCommandes.forEach((cmd) => {
            const heure = new Date(cmd.date_creation).getHours();
            heuresCount[heure] = (heuresCount[heure] || 0) + 1;
        });

        const commandesParHeure = Array.from({ length: 24 }, (_, i) => ({
            heure: `${i}h`,
            commandes: heuresCount[i] || 0,
        }));

        // Commandes par jour de la semaine
        const joursSemaine = [
            "Dimanche",
            "Lundi",
            "Mardi",
            "Mercredi",
            "Jeudi",
            "Vendredi",
            "Samedi",
        ];
        const commandesParJourCount = {
            0: 0,
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
            6: 0,
        };

        filteredCommandes.forEach((cmd) => {
            const jourSemaine = new Date(cmd.date_creation).getDay();
            commandesParJourCount[jourSemaine] =
                (commandesParJourCount[jourSemaine] || 0) + 1;
        });

        const commandesParJourSemaine = Object.entries(
            commandesParJourCount
        ).map(([jour, count]) => ({
            jour: joursSemaine[Number.parseInt(jour)],
            commandes: count,
        }));

        // Commandes récentes
        const commandesRecentes = [...filteredCommandes]
            .sort(
                (a, b) => new Date(b.date_creation) - new Date(a.date_creation)
            )
            .slice(0, 5);

        // Taux de conversion (commandes livrées / total des commandes valides)
        const commandesValidesTotal = commandesValides.length;
        const tauxConversion =
            commandesValidesTotal > 0
                ? (
                      (nombreCommandesParStatut.livrees /
                          commandesValidesTotal) *
                      100
                  ).toFixed(1)
                : 0;

        // Valeur moyenne des commandes (uniquement pour les commandes valides)
        const valeurMoyenneCommande =
            commandesValidesTotal > 0
                ? (totalRevenu / commandesValidesTotal).toFixed(2)
                : 0;

        // Top clients (exclure les commandes annulées et refusées)
        const clientsMap = {};
        commandesValides.forEach((cmd) => {
            const clientId = cmd.client_id?._id || cmd.client_id;
            const clientNom = cmd.client_id?.nom || "Client inconnu";

            if (!clientsMap[clientId]) {
                clientsMap[clientId] = {
                    id: clientId,
                    nom: clientNom,
                    commandes: 0,
                    montant: 0,
                };
            }

            clientsMap[clientId].commandes += 1;
            clientsMap[clientId].montant += cmd.total || 0;
        });

        const topClients = Object.values(clientsMap)
            .sort((a, b) => b.montant - a.montant)
            .slice(0, 5);

        return {
            totalCommandes,
            totalRevenu,
            revenuLivrees,
            revenuNonLivrees,
            clientsUniques,
            commandesParStatut,
            nombreCommandesParStatut,
            commandesParJour,
            commandesParHeure,
            commandesRecentes,
            tauxConversion,
            valeurMoyenneCommande,
            topClients,
            commandesParJourSemaine,
        };
    }, [commandesData, authUser, timeRange]);

    // Fonction pour formater les montants et éviter les nombres scientifiques
    const formatCurrency = (amount) => {
        if (amount === undefined || amount === null) return "0.00 €";

        // Si le montant est trop grand, le limiter pour éviter les notations scientifiques
        if (amount > 1000000000) {
            return "999,999,999.99 €";
        }

        // Formater avec 2 décimales et ajouter le symbole €
        return (
            amount.toLocaleString("fr-FR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }) + " €"
        );
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-emerald-600"></div>
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-teal-100 p-6 overflow-x-hidden">
            <h1 className="text-3xl font-bold text-emerald-800 mb-8 border-b-2 border-emerald-300 pb-2">
                Bienvenue {authUser?.nom}
            </h1>

            {/* Onglets personnalisés */}
            <div className="mb-8">
                <div className="flex border-b-2 border-emerald-200 bg-white rounded-t-lg shadow-sm">
                    <button
                        className={`py-3 px-6 font-medium text-sm focus:outline-none transition-all duration-200 ${
                            activeTab === "statistiques"
                                ? "text-emerald-700 border-b-3 border-emerald-500 bg-emerald-50 rounded-t-lg"
                                : "text-gray-600 hover:text-emerald-600 hover:bg-emerald-50"
                        }`}
                        onClick={() => setActiveTab("statistiques")}
                    >
                        <div className="flex items-center">
                            <FaChartLine className="mr-2" />
                            Statistiques
                        </div>
                    </button>
                    <button
                        className={`py-3 px-6 font-medium text-sm focus:outline-none transition-all duration-200 ${
                            activeTab === "avis"
                                ? "text-emerald-700 border-b-3 border-emerald-500 bg-emerald-50 rounded-t-lg"
                                : "text-gray-600 hover:text-emerald-600 hover:bg-emerald-50"
                        }`}
                        onClick={() => setActiveTab("avis")}
                    >
                        <div className="flex items-center">
                            <FaStar className="mr-2" />
                            Avis clients
                        </div>
                    </button>
                </div>
            </div>

            {/* Contenu de l'onglet Statistiques */}
            {activeTab === "statistiques" && (
                <div className="space-y-8 max-h-[calc(100vh-12rem)]">
                    {/* Filtres de période */}
                    <div className="flex justify-end mb-4">
                        <div className="bg-white rounded-lg shadow-md p-1 flex items-center">
                            <FaFilter className="text-emerald-500 mx-2" />
                            <span className="text-sm text-gray-600 mr-2">
                                Période:
                            </span>
                            <button
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                                    timeRange === "week"
                                        ? "bg-emerald-500 text-white shadow-sm"
                                        : "text-gray-600 hover:bg-emerald-100"
                                }`}
                                onClick={() => setTimeRange("week")}
                            >
                                Semaine
                            </button>
                            <button
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                                    timeRange === "month"
                                        ? "bg-emerald-500 text-white shadow-sm"
                                        : "text-gray-600 hover:bg-emerald-100"
                                }`}
                                onClick={() => setTimeRange("month")}
                            >
                                Mois
                            </button>
                            <button
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
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

                    {/* Cartes de statistiques */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
                        {/* Carte Total Commandes */}
                        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-emerald-500 hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
                            <div className="flex flex-row items-center justify-between pb-4">
                                <h3 className="text-lg font-semibold text-gray-800">
                                    Total Commandes
                                </h3>
                                <div className="p-3 bg-emerald-100 rounded-full">
                                    <FaShoppingBag className="h-6 w-6 text-emerald-600" />
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-emerald-700">
                                {totalCommandes}
                            </div>
                            <div className="flex justify-between mt-2 text-sm">
                                <span className="text-gray-500">
                                    {timeRange === "week"
                                        ? "Cette semaine"
                                        : timeRange === "month"
                                        ? "Ce mois"
                                        : "Cette année"}
                                </span>
                                <div className="flex gap-2">
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                                        {nombreCommandesParStatut.livrees}{" "}
                                        livrées
                                    </span>
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                                        {nombreCommandesParStatut.enCours} en
                                        cours
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Carte Revenus */}
                        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
                            <div className="flex flex-row items-center justify-between pb-4">
                                <h3 className="text-lg font-semibold text-gray-800">
                                    Revenus
                                </h3>
                                <div className="p-3 bg-blue-100 rounded-full">
                                    <FaMoneyBillWave className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-blue-700">
                                {formatCurrency(totalRevenu)}
                            </div>
                            <div className="flex justify-between mt-2 text-sm">
                                <span className="text-gray-500">
                                    {timeRange === "week"
                                        ? "Cette semaine"
                                        : timeRange === "month"
                                        ? "Ce mois"
                                        : "Cette année"}
                                </span>
                                <div className="flex gap-2">
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                                        {formatCurrency(revenuLivrees)}
                                    </span>
                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs">
                                        {formatCurrency(revenuNonLivrees)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Carte Clients Uniques */}
                        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500 hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
                            <div className="flex flex-row items-center justify-between pb-4">
                                <h3 className="text-lg font-semibold text-gray-800">
                                    Clients Uniques
                                </h3>
                                <div className="p-3 bg-purple-100 rounded-full">
                                    <FaUsers className="h-6 w-6 text-purple-600" />
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-purple-700">
                                {clientsUniques}
                            </div>
                            <div className="flex justify-between mt-2 text-sm">
                                <span className="text-gray-500">
                                    {timeRange === "week"
                                        ? "Cette semaine"
                                        : timeRange === "month"
                                        ? "Ce mois"
                                        : "Cette année"}
                                </span>
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                                    {valeurMoyenneCommande} € par commande
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Statistiques détaillées */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                        {/* Taux de conversion */}
                        <div className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-shadow duration-300">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-medium text-gray-600">
                                    Taux de conversion
                                </h3>
                                <span className="text-xs text-gray-400">
                                    Commandes livrées / Total
                                </span>
                            </div>
                            <div className="flex items-end gap-2">
                                <span className="text-2xl font-bold text-emerald-600">
                                    {tauxConversion}%
                                </span>
                                <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-emerald-500 h-2 rounded-full"
                                        style={{ width: `${tauxConversion}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {/* Commandes par statut */}
                        <div className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-shadow duration-300">
                            <h3 className="text-sm font-medium text-gray-600 mb-2">
                                Commandes par statut
                            </h3>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="flex items-center gap-1">
                                    <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                                    <span>
                                        En attente:{" "}
                                        {nombreCommandesParStatut.enAttente}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                                    <span>
                                        En préparation:{" "}
                                        {nombreCommandesParStatut.enPreparation}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                                    <span>
                                        En livraison:{" "}
                                        {nombreCommandesParStatut.enLivraison}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                                    <span>
                                        Livrées:{" "}
                                        {nombreCommandesParStatut.livrees}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                                    <span>
                                        Annulées:{" "}
                                        {nombreCommandesParStatut.annulees}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Valeur moyenne */}
                        <div className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-shadow duration-300">
                            <h3 className="text-sm font-medium text-gray-600 mb-2">
                                Valeur moyenne
                            </h3>
                            <div className="flex items-center justify-between">
                                <span className="text-2xl font-bold text-blue-600">
                                    {formatCurrency(
                                        Number.parseFloat(valeurMoyenneCommande)
                                    )}
                                </span>
                                <span className="text-xs text-gray-400 bg-blue-50 px-2 py-1 rounded-full">
                                    par commande
                                </span>
                            </div>
                        </div>

                        {/* Revenus par statut */}
                        <div className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-shadow duration-300">
                            <h3 className="text-sm font-medium text-gray-600 mb-2">
                                Revenus par statut
                            </h3>
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between items-center">
                                    <span className="flex items-center gap-1">
                                        <span className="w-3 h-3 rounded-full bg-green-500"></span>
                                        <span>Livrées:</span>
                                    </span>
                                    <span className="font-semibold">
                                        {formatCurrency(revenuLivrees)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="flex items-center gap-1">
                                        <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                                        <span>En cours:</span>
                                    </span>
                                    <span className="font-semibold">
                                        {formatCurrency(revenuNonLivrees)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="flex items-center gap-1">
                                        <span className="w-3 h-3 rounded-full bg-gray-500"></span>
                                        <span>Total:</span>
                                    </span>
                                    <span className="font-semibold">
                                        {formatCurrency(totalRevenu)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Graphiques */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-hidden">
                        {/* Évolution des ventes */}
                        <div className="bg-white rounded-xl shadow-lg p-6 col-span-1 lg:col-span-2 hover:shadow-xl transition-shadow duration-300">
                            <div className="mb-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold text-gray-800">
                                        Évolution des ventes
                                    </h3>
                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                                        {timeRange === "week"
                                            ? "Cette semaine"
                                            : timeRange === "month"
                                            ? "Ce mois"
                                            : "Cette année"}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                    Suivi des commandes et revenus dans le temps
                                </p>
                            </div>
                            <div className="h-64 md:h-80 border border-gray-100 rounded-lg p-4 bg-gray-50 overflow-x-auto">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={commandesParJour}
                                        margin={{
                                            top: 5,
                                            right: 30,
                                            left: 20,
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
                                        />
                                        <YAxis
                                            yAxisId="left"
                                            stroke="#10b981"
                                        />
                                        <YAxis
                                            yAxisId="right"
                                            orientation="right"
                                            stroke="#3b82f6"
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor:
                                                    "rgba(255, 255, 255, 0.95)",
                                                borderRadius: "8px",
                                                border: "none",
                                                boxShadow:
                                                    "0 4px 6px rgba(0, 0, 0, 0.1)",
                                            }}
                                        />
                                        <Legend
                                            wrapperStyle={{
                                                paddingTop: "10px",
                                            }}
                                        />
                                        <Line
                                            yAxisId="left"
                                            type="monotone"
                                            dataKey="commandes"
                                            stroke="#10b981"
                                            strokeWidth={3}
                                            name="Nombre de commandes"
                                            activeDot={{
                                                r: 8,
                                                fill: "#10b981",
                                                stroke: "#fff",
                                                strokeWidth: 2,
                                            }}
                                            dot={{
                                                r: 4,
                                                fill: "#10b981",
                                                stroke: "#fff",
                                                strokeWidth: 2,
                                            }}
                                        />
                                        <Line
                                            yAxisId="right"
                                            type="monotone"
                                            dataKey="revenu"
                                            stroke="#3b82f6"
                                            strokeWidth={3}
                                            name="Revenus (€)"
                                            activeDot={{
                                                r: 8,
                                                fill: "#3b82f6",
                                                stroke: "#fff",
                                                strokeWidth: 2,
                                            }}
                                            dot={{
                                                r: 4,
                                                fill: "#3b82f6",
                                                stroke: "#fff",
                                                strokeWidth: 2,
                                            }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Répartition par statut */}
                        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                            <div className="mb-6">
                                <div className="flex items-center">
                                    <FaChartPie className="text-emerald-600 mr-2" />
                                    <h3 className="text-xl font-bold text-gray-800">
                                        Répartition des commandes
                                    </h3>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                    Par statut
                                </p>
                            </div>
                            <div className="h-64 border border-gray-100 rounded-lg p-4 bg-gray-50 overflow-x-auto">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={commandesParStatut}
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
                                            {commandesParStatut.map(
                                                (entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={
                                                            STATUS_COLORS[
                                                                entry.name.replace(
                                                                    / /g,
                                                                    "_"
                                                                )
                                                            ] ||
                                                            COLORS[
                                                                index %
                                                                    COLORS.length
                                                            ]
                                                        }
                                                    />
                                                )
                                            )}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor:
                                                    "rgba(255, 255, 255, 0.95)",
                                                borderRadius: "8px",
                                                border: "none",
                                                boxShadow:
                                                    "0 4px 6px rgba(0, 0, 0, 0.1)",
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Heures de pointe */}
                        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                            <div className="mb-6">
                                <div className="flex items-center">
                                    <FaClock className="text-emerald-600 mr-2" />
                                    <h3 className="text-xl font-bold text-gray-800">
                                        Heures de pointe
                                    </h3>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                    Nombre de commandes par heure
                                </p>
                            </div>
                            <div className="h-64 border border-gray-100 rounded-lg p-4 bg-gray-50 overflow-x-auto">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={commandesParHeure}>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="#f0f0f0"
                                        />
                                        <XAxis
                                            dataKey="heure"
                                            stroke="#6b7280"
                                        />
                                        <YAxis stroke="#6b7280" />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor:
                                                    "rgba(255, 255, 255, 0.95)",
                                                borderRadius: "8px",
                                                border: "none",
                                                boxShadow:
                                                    "0 4px 6px rgba(0, 0, 0, 0.1)",
                                            }}
                                        />
                                        <Bar
                                            dataKey="commandes"
                                            fill="#10b981"
                                            name="Commandes"
                                            radius={[4, 4, 0, 0]}
                                            barSize={20}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Graphiques supplémentaires */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                        {/* Commandes par jour de la semaine */}
                        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                            <div className="mb-6">
                                <div className="flex items-center">
                                    <FaChartBar className="text-emerald-600 mr-2" />
                                    <h3 className="text-xl font-bold text-gray-800">
                                        Commandes par jour
                                    </h3>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                    Répartition hebdomadaire
                                </p>
                            </div>
                            <div className="h-64 border border-gray-100 rounded-lg p-4 bg-gray-50 overflow-x-auto">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={commandesParJourSemaine}>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="#f0f0f0"
                                        />
                                        <XAxis
                                            dataKey="jour"
                                            stroke="#6b7280"
                                        />
                                        <YAxis stroke="#6b7280" />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor:
                                                    "rgba(255, 255, 255, 0.95)",
                                                borderRadius: "8px",
                                                border: "none",
                                                boxShadow:
                                                    "0 4px 6px rgba(0, 0, 0, 0.1)",
                                            }}
                                        />
                                        <Bar
                                            dataKey="commandes"
                                            name="Commandes"
                                        >
                                            {commandesParJourSemaine.map(
                                                (entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={
                                                            index ===
                                                            new Date().getDay()
                                                                ? "#10b981"
                                                                : "#3b82f6"
                                                        }
                                                        radius={[4, 4, 0, 0]}
                                                    />
                                                )
                                            )}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Top clients */}
                        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                            <div className="mb-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <FaUserFriends className="text-emerald-600 mr-2" />
                                        <h3 className="text-xl font-bold text-gray-800">
                                            Top Clients
                                        </h3>
                                    </div>
                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                                        Par montant
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {topClients.length > 0 ? (
                                    topClients.map((client, index) => (
                                        <div
                                            key={client.id}
                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                        >
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold">
                                                    {index + 1}
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm font-medium text-gray-800">
                                                        {client.nom}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {client.commandes}{" "}
                                                        commandes
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-emerald-600">
                                                    {formatCurrency(
                                                        client.montant
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        Aucune donnée disponible
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Commandes récentes */}
                    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                        <div className="mb-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <FaListAlt className="text-emerald-600 mr-2" />
                                    <h3 className="text-xl font-bold text-gray-800">
                                        Commandes récentes
                                    </h3>
                                </div>
                                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                                    {commandesRecentes.length} commandes
                                </span>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="text-left py-4 px-4 font-semibold text-gray-600 rounded-tl-lg">
                                            ID
                                        </th>
                                        <th className="text-left py-4 px-4 font-semibold text-gray-600">
                                            Client
                                        </th>
                                        <th className="text-left py-4 px-4 font-semibold text-gray-600">
                                            Date
                                        </th>
                                        <th className="text-left py-4 px-4 font-semibold text-gray-600">
                                            Statut
                                        </th>
                                        <th className="text-right py-4 px-4 font-semibold text-gray-600 rounded-tr-lg">
                                            Montant
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {commandesRecentes.length > 0 ? (
                                        commandesRecentes.map((cmd, index) => (
                                            <tr
                                                key={cmd._id}
                                                className={`hover:bg-emerald-50 transition-colors duration-150 ${
                                                    index ===
                                                    commandesRecentes.length - 1
                                                        ? "rounded-b-lg"
                                                        : ""
                                                }`}
                                            >
                                                <td className="py-4 px-4 font-medium text-emerald-600 truncate max-w-[100px]">
                                                    #{cmd._id.slice(-6)}
                                                </td>
                                                <td className="py-4 px-4 truncate max-w-[150px]">
                                                    {cmd.client_id?.nom ||
                                                        "Client inconnu"}
                                                </td>
                                                <td className="py-4 px-4">
                                                    {new Date(
                                                        cmd.date_creation
                                                    ).toLocaleDateString()}
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span
                                                        className="px-3 py-1.5 rounded-full text-xs font-medium inline-flex items-center"
                                                        style={{
                                                            backgroundColor: `${
                                                                STATUS_COLORS[
                                                                    cmd.statut
                                                                ]
                                                            }20`,
                                                            color: STATUS_COLORS[
                                                                cmd.statut
                                                            ],
                                                        }}
                                                    >
                                                        <span
                                                            className="w-2 h-2 rounded-full mr-1.5"
                                                            style={{
                                                                backgroundColor:
                                                                    STATUS_COLORS[
                                                                        cmd
                                                                            .statut
                                                                    ],
                                                            }}
                                                        ></span>
                                                        {cmd.statut.replace(
                                                            /_/g,
                                                            " "
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-right font-semibold">
                                                    {formatCurrency(cmd.total)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan="5"
                                                className="py-8 text-center text-gray-500"
                                            >
                                                Aucune commande récente
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Contenu de l'onglet Avis */}
            {activeTab === "avis" && (
                <div>
                    <div className="bg-white p-8 rounded-xl shadow-lg mb-8 hover:shadow-xl transition-shadow duration-300">
                        <h2 className="text-2xl font-bold text-emerald-800 mb-4 border-b border-emerald-100 pb-2">
                            Note Globale
                        </h2>
                        <div className="flex items-center text-3xl font-bold">
                            <span className="text-4xl text-yellow-500 mr-3">
                                {getAverageRating(fakeReviews)}
                            </span>
                            <span className="mr-3">/</span>
                            <span className="text-gray-400">5</span>
                            <span className="ml-4">
                                <StarRating
                                    rating={Math.round(
                                        getAverageRating(fakeReviews)
                                    )}
                                />
                            </span>
                        </div>
                        <p className="text-gray-500 mt-2 text-sm">
                            Basé sur {fakeReviews.length} avis clients
                        </p>
                    </div>
                    <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <h2 className="text-2xl font-bold text-emerald-800 mb-6 border-b border-emerald-100 pb-2">
                            Avis des Clients
                        </h2>
                        <div className="space-y-6">
                            {fakeReviews.map((review) => (
                                <ReviewCard key={review.id} review={review} />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardPageCommercant;
