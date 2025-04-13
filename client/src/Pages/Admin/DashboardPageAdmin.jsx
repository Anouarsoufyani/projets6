"use client";

import { useState, useMemo } from "react";
import {
    FaShoppingBag,
    FaUsers,
    FaMoneyBillWave,
    FaChartLine,
    FaChartPie,
    FaListAlt,
    FaFilter,
    FaChartBar,
    FaUserFriends,
    FaTruck,
    FaStore,
    FaUserTie,
} from "react-icons/fa";
import {
    useAuthUserQuery,
    useGetUserCommandes,
    useGetUsersByRole,
} from "../../Hooks";
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

const DashboardPageAdmin = () => {
    const { data: authUser } = useAuthUserQuery();
    const [timeRange, setTimeRange] = useState("month");
    const [activeTab, setActiveTab] = useState("statistiques");

    // Récupérer les données des commandes et des utilisateurs
    const { data: commandesData, isLoading: isLoadingCommandes } =
        useGetUserCommandes();
    const { data: clientsData, isLoading: isLoadingClients } =
        useGetUsersByRole("client");
    const { data: livreursData, isLoading: isLoadingLivreurs } =
        useGetUsersByRole("livreur");
    const { data: commercantsData, isLoading: isLoadingCommercants } =
        useGetUsersByRole("commercant");

    // Traitement des données des commandes et utilisateurs
    const {
        totalCommandes,
        totalRevenu,
        revenuLivrees,
        revenuNonLivrees,
        clientsCount,
        livreursCount,
        commercantsCount,
        commandesParStatut,
        nombreCommandesParStatut,
        commandesParJour,
        commandesParHeure,
        commandesRecentes,
        tauxConversion,
        valeurMoyenneCommande,
        topClients,
        commandesParJourSemaine,
        livreursPendingVerification,
    } = useMemo(() => {
        if (
            !commandesData?.commandes ||
            !clientsData?.data ||
            !livreursData?.data ||
            !commercantsData?.data
        ) {
            return {
                totalCommandes: 0,
                totalRevenu: 0,
                revenuLivrees: 0,
                revenuNonLivrees: 0,
                clientsCount: 0,
                livreursCount: 0,
                commercantsCount: 0,
                commandesParStatut: [],
                nombreCommandesParStatut: {},
                commandesParJour: [],
                commandesParHeure: [],
                commandesRecentes: [],
                tauxConversion: 0,
                valeurMoyenneCommande: 0,
                topClients: [],
                commandesParJourSemaine: [],
                livreursPendingVerification: 0,
            };
        }

        const commandes = commandesData.commandes || [];
        const clients = clientsData.data || [];
        const livreurs = livreursData.data || [];
        const commercants = commercantsData.data || [];

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
        const clientsCount = clients.length;
        const livreursCount = livreurs.length;
        const commercantsCount = commercants.length;

        // Livreurs en attente de vérification
        const livreursPendingVerification = livreurs.filter(
            (livreur) => livreur.statut === "en vérification"
        ).length;

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
            clientsCount,
            livreursCount,
            commercantsCount,
            commandesParStatut,
            nombreCommandesParStatut,
            commandesParJour,
            commandesParHeure,
            commandesRecentes,
            tauxConversion,
            valeurMoyenneCommande,
            topClients,
            commandesParJourSemaine,
            livreursPendingVerification,
        };
    }, [commandesData, clientsData, livreursData, commercantsData, timeRange]);

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

    if (
        isLoadingCommandes ||
        isLoadingClients ||
        isLoadingLivreurs ||
        isLoadingCommercants
    ) {
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
                            activeTab === "utilisateurs"
                                ? "text-emerald-700 border-b-3 border-emerald-500 bg-emerald-50 rounded-t-lg"
                                : "text-gray-600 hover:text-emerald-600 hover:bg-emerald-50"
                        }`}
                        onClick={() => setActiveTab("utilisateurs")}
                    >
                        <div className="flex items-center">
                            <FaUsers className="mr-2" />
                            Utilisateurs
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
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 overflow-hidden">
                        {/* Carte Total Commandes */}
                        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-emerald-500">
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
                        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
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

                        {/* Carte Utilisateurs */}
                        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                            <div className="flex flex-row items-center justify-between pb-4">
                                <h3 className="text-lg font-semibold text-gray-800">
                                    Utilisateurs
                                </h3>
                                <div className="p-3 bg-purple-100 rounded-full">
                                    <FaUsers className="h-6 w-6 text-purple-600" />
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-purple-700">
                                {clientsCount +
                                    livreursCount +
                                    commercantsCount}
                            </div>
                            <div className="flex justify-between mt-2 text-sm">
                                <span className="text-gray-500">Total</span>
                                <div className="flex gap-2">
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                                        {clientsCount} clients
                                    </span>
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                                        {livreursCount} livreurs
                                    </span>
                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                                        {commercantsCount} commercants
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Carte Livreurs en attente */}
                        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-amber-500">
                            <div className="flex flex-row items-center justify-between pb-4">
                                <h3 className="text-lg font-semibold text-gray-800">
                                    Vérifications
                                </h3>
                                <div className="p-3 bg-amber-100 rounded-full">
                                    <FaTruck className="h-6 w-6 text-amber-600" />
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-amber-700">
                                {livreursPendingVerification}
                            </div>
                            <div className="flex justify-between mt-2 text-sm">
                                <span className="text-gray-500">
                                    Livreurs en attente
                                </span>
                                <a
                                    href="/gestion/livreur"
                                    className="text-amber-600 hover:underline"
                                >
                                    Voir tous
                                </a>
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

                        {/* Répartition utilisateurs */}
                        <div className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-shadow duration-300">
                            <h3 className="text-sm font-medium text-gray-600 mb-2">
                                Répartition utilisateurs
                            </h3>
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between items-center">
                                    <span className="flex items-center gap-1">
                                        <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                                        <span>Clients:</span>
                                    </span>
                                    <span className="font-semibold">
                                        {clientsCount}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="flex items-center gap-1">
                                        <span className="w-3 h-3 rounded-full bg-green-500"></span>
                                        <span>Livreurs:</span>
                                    </span>
                                    <span className="font-semibold">
                                        {livreursCount}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="flex items-center gap-1">
                                        <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                                        <span>Commerçants:</span>
                                    </span>
                                    <span className="font-semibold">
                                        {commercantsCount}
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

            {/* Contenu de l'onglet Utilisateurs */}
            {activeTab === "utilisateurs" && (
                <div className="space-y-8">
                    {/* Cartes de statistiques utilisateurs */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Carte Clients */}
                        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow duration-300">
                            <div className="flex flex-row items-center justify-between pb-4">
                                <h3 className="text-lg font-semibold text-gray-800">
                                    Clients
                                </h3>
                                <div className="p-3 bg-blue-100 rounded-full">
                                    <FaUserFriends className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-blue-700">
                                {clientsCount}
                            </div>
                            <div className="flex justify-between mt-2 text-sm">
                                <span className="text-gray-500">Total</span>
                                <a
                                    href="/gestion/client"
                                    className="text-blue-600 hover:underline"
                                >
                                    Gérer les clients
                                </a>
                            </div>
                        </div>

                        {/* Carte Livreurs */}
                        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow duration-300">
                            <div className="flex flex-row items-center justify-between pb-4">
                                <h3 className="text-lg font-semibold text-gray-800">
                                    Livreurs
                                </h3>
                                <div className="p-3 bg-green-100 rounded-full">
                                    <FaTruck className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-green-700">
                                {livreursCount}
                            </div>
                            <div className="flex justify-between mt-2 text-sm">
                                <span className="text-gray-500">Total</span>
                                <div className="flex gap-2">
                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs">
                                        {livreursPendingVerification} en attente
                                    </span>
                                    <a
                                        href="/gestion/livreur"
                                        className="text-green-600 hover:underline"
                                    >
                                        Gérer
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Carte Commerçants */}
                        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500 hover:shadow-xl transition-shadow duration-300">
                            <div className="flex flex-row items-center justify-between pb-4">
                                <h3 className="text-lg font-semibold text-gray-800">
                                    Commerçants
                                </h3>
                                <div className="p-3 bg-purple-100 rounded-full">
                                    <FaStore className="h-6 w-6 text-purple-600" />
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-purple-700">
                                {commercantsCount}
                            </div>
                            <div className="flex justify-between mt-2 text-sm">
                                <span className="text-gray-500">Total</span>
                                <a
                                    href="/gestion/commercant"
                                    className="text-purple-600 hover:underline"
                                >
                                    Gérer les commerçants
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Répartition des utilisateurs */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Graphique de répartition */}
                        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                            <div className="mb-6">
                                <div className="flex items-center">
                                    <FaChartPie className="text-emerald-600 mr-2" />
                                    <h3 className="text-xl font-bold text-gray-800">
                                        Répartition des utilisateurs
                                    </h3>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                    Par type
                                </p>
                            </div>
                            <div className="h-64 border border-gray-100 rounded-lg p-4 bg-gray-50 overflow-x-auto">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={[
                                                {
                                                    name: "Clients",
                                                    value: clientsCount,
                                                },
                                                {
                                                    name: "Livreurs",
                                                    value: livreursCount,
                                                },
                                                {
                                                    name: "Commerçants",
                                                    value: commercantsCount,
                                                },
                                            ]}
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
                                            <Cell fill="#3b82f6" />
                                            <Cell fill="#10b981" />
                                            <Cell fill="#8b5cf6" />
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

                        {/* Livreurs en attente de vérification */}
                        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                            <div className="mb-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <FaUserTie className="text-amber-600 mr-2" />
                                        <h3 className="text-xl font-bold text-gray-800">
                                            Livreurs en attente
                                        </h3>
                                    </div>
                                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                                        {livreursPendingVerification} livreurs
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                    Vérification des documents
                                </p>
                            </div>
                            {livreursPendingVerification > 0 ? (
                                <div className="space-y-4">
                                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                        <p className="text-amber-800">
                                            {livreursPendingVerification}{" "}
                                            livreur
                                            {livreursPendingVerification > 1
                                                ? "s"
                                                : ""}{" "}
                                            en attente de vérification. Veuillez
                                            vérifier leurs documents pour les
                                            activer.
                                        </p>
                                        <a
                                            href="/gestion/livreur"
                                            className="mt-2 inline-block px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors"
                                        >
                                            Voir les livreurs
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-green-800">
                                        Tous les livreurs ont été vérifiés.
                                        Aucune action requise.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Liens rapides vers les pages de gestion */}
                    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                        <div className="mb-6">
                            <div className="flex items-center">
                                <FaUsers className="text-emerald-600 mr-2" />
                                <h3 className="text-xl font-bold text-gray-800">
                                    Gestion des utilisateurs
                                </h3>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                                Accès rapide
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <a
                                href="/gestion/client"
                                className="p-4 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors flex items-center"
                            >
                                <FaUserFriends className="text-blue-600 mr-2" />
                                <span className="font-medium text-blue-700">
                                    Gestion des clients
                                </span>
                            </a>
                            <a
                                href="/gestion/livreur"
                                className="p-4 bg-green-50 rounded-lg border border-green-100 hover:bg-green-100 transition-colors flex items-center"
                            >
                                <FaTruck className="text-green-600 mr-2" />
                                <span className="font-medium text-green-700">
                                    Gestion des livreurs
                                </span>
                            </a>
                            <a
                                href="/gestion/commercant"
                                className="p-4 bg-purple-50 rounded-lg border border-purple-100 hover:bg-purple-100 transition-colors flex items-center"
                            >
                                <FaStore className="text-purple-600 mr-2" />
                                <span className="font-medium text-purple-700">
                                    Gestion des commerçants
                                </span>
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardPageAdmin;
