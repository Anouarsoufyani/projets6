"use client";

import { useState, useMemo, useCallback } from "react";
import { useGetCommandes } from "../../Hooks/queries/useGetCommandes";
import { useUpdateCommandeStatus } from "../../Hooks/mutations/useUpdateCommandeStatus";
import { useCancelCommande } from "../../Hooks/mutations/useCancelCommande";
import { useGetUsersByRole } from "../../Hooks/queries/useGetUsers";
import DataTable from "../../Components/UI/DataTable";
import StatusBadge from "../../Components/UI/StatusBadge";
import ActionButton from "../../Components/UI/ActionButton";
import {
    FaEye,
    FaEdit,
    FaTrash,
    FaUserAlt,
    FaStore,
    FaMotorcycle,
    FaCalendarAlt,
    FaMapMarkerAlt,
    FaSearch,
    FaFilter,
    FaTimes,
} from "react-icons/fa";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "react-hot-toast";

// Order statuses from the Commandes model
const ORDER_STATUSES = [
    { value: "en_attente", label: "En attente" },
    { value: "refusee", label: "Refusée" },
    { value: "en_preparation", label: "En préparation" },
    { value: "prete_a_etre_recuperee", label: "Prête à être récupérée" },
    { value: "recuperee_par_livreur", label: "Récupérée par livreur" },
    { value: "livree", label: "Livrée" },
    { value: "annulee", label: "Annulée" },
    { value: "probleme", label: "Problème" },
];

const GestionCommandePage = () => {
    // State for selected commande and modal visibility
    const [selectedCommande, setSelectedCommande] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isStatusUpdating, setIsStatusUpdating] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState("");

    // State for filters
    const [statusFilter, setStatusFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState({ start: "", end: "" });
    const [userFilter, setUserFilter] = useState("");
    const [userType, setUserType] = useState("client");
    const [searchQuery, setSearchQuery] = useState("");
    const [isFilterExpanded, setIsFilterExpanded] = useState(true);

    // Fetch commandes with error handling
    const { data, isLoading, isError, error, refetch } = useGetCommandes();

    // Safely access commandes array with fallback to empty array
    const commandes =
        data?.success && Array.isArray(data.commandes) ? data.commandes : [];

    // Fetch users for filtering with proper error handling
    const { data: clientsData, isLoading: isClientsLoading } =
        useGetUsersByRole("client");
    const { data: commercantsData, isLoading: isCommercantsLoading } =
        useGetUsersByRole("commercant");
    const { data: livreursData, isLoading: isLivreursLoading } =
        useGetUsersByRole("livreur");

    // Ensure all user arrays are properly initialized
    const clients = Array.isArray(clientsData) ? clientsData : [];
    const commercants = Array.isArray(commercantsData) ? commercantsData : [];
    const livreurs = Array.isArray(livreursData) ? livreursData : [];

    // Mutations
    const updateCommandeStatus = useUpdateCommandeStatus();
    const cancelCommande = useCancelCommande();

    // Initialize selected status when opening edit modal
    const openEditModal = useCallback((commande) => {
        setSelectedCommande(commande);
        setSelectedStatus(commande.statut || "en_attente");
        setIsEditModalOpen(true);
    }, []);

    // Filter commandes based on selected filters
    const filteredCommandes = useMemo(() => {
        return commandes.filter((commande) => {
            // Status filter
            if (statusFilter !== "all" && commande.statut !== statusFilter)
                return false;

            // Date filter
            if (
                dateFilter.start &&
                new Date(commande.date_creation) < new Date(dateFilter.start)
            )
                return false;
            if (
                dateFilter.end &&
                new Date(commande.date_creation) >
                    new Date(`${dateFilter.end}T23:59:59`)
            )
                return false;

            // User filter

            // Search query
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesId = commande._id?.toLowerCase().includes(query);
                const matchesClient =
                    commande.client_id?.nom?.toLowerCase().includes(query) ||
                    commande.client_id?.prenom?.toLowerCase().includes(query);
                const matchesCommercant = commande.commercant_id?.nom
                    ?.toLowerCase()
                    .includes(query);
                const matchesLivreur =
                    commande.livreur_id?.nom?.toLowerCase().includes(query) ||
                    commande.livreur_id?.prenom?.toLowerCase().includes(query);

                if (
                    !(
                        matchesId ||
                        matchesClient ||
                        matchesCommercant ||
                        matchesLivreur
                    )
                )
                    return false;
            }

            return true;
        });
    }, [commandes, statusFilter, dateFilter, userType, searchQuery]);

    // Handle status update
    const handleStatusUpdate = async () => {
        if (!selectedCommande || !selectedStatus) {
            toast.error(
                "Informations manquantes pour la mise à jour du statut"
            );
            return;
        }

        try {
            setIsStatusUpdating(true);
            await updateCommandeStatus.mutateAsync({
                commandeId: selectedCommande._id,
                newStatus: selectedStatus,
            });

            // Success message is handled in the mutation hook
            refetch();
            setIsEditModalOpen(false);
        } catch (error) {
            toast.error(
                `Erreur lors de la mise à jour du statut: ${
                    error.message || "Erreur inconnue"
                }`
            );
            console.error("Status update error:", error);
        } finally {
            setIsStatusUpdating(false);
        }
    };

    // Handle commande cancellation
    const handleCancelCommande = async (commandeId) => {
        if (
            !window.confirm("Êtes-vous sûr de vouloir annuler cette commande ?")
        )
            return;

        try {
            await cancelCommande.mutateAsync(commandeId);
            toast.success("Commande annulée avec succès");
            refetch();
            setIsEditModalOpen(false);
        } catch (error) {
            toast.error(
                `Erreur lors de l'annulation de la commande: ${
                    error.message || "Erreur inconnue"
                }`
            );
            console.error(error);
        }
    };

    // Reset filters
    const resetFilters = () => {
        setStatusFilter("all");
        setDateFilter({ start: "", end: "" });
        setUserFilter("");
        setSearchQuery("");
    };

    // Format date safely
    const formatDate = (dateString) => {
        try {
            if (!dateString) return "N/A";
            return format(new Date(dateString), "dd MMM yyyy", { locale: fr });
        } catch (error) {
            console.error("Error formatting date:", error);
            return "Date invalide";
        }
    };

    // Table columns configuration
    const columns = [
        {
            key: "_id",
            header: "ID",
            render: (row) => (
                <span className="font-mono text-xs">
                    {row._id ? row._id.substring(0, 8) + "..." : "N/A"}
                </span>
            ),
        },
        {
            key: "client_id.nom",
            header: "Client",
            render: (row) => (
                <div className="flex items-center">
                    <FaUserAlt className="mr-2 text-emerald-500" />
                    <span>
                        {row.client_id?.nom || "N/A"}{" "}
                        {row.client_id?.prenom || ""}
                    </span>
                </div>
            ),
        },
        {
            key: "commercant_id.nom",
            header: "Commerçant",
            render: (row) => (
                <div className="flex items-center">
                    <FaStore className="mr-2 text-amber-500" />
                    <span>{row.commercant_id?.nom || "N/A"}</span>
                </div>
            ),
        },
        {
            key: "livreur_id.nom",
            header: "Livreur",
            render: (row) => (
                <div className="flex items-center">
                    <FaMotorcycle className="mr-2 text-indigo-500" />
                    <span>
                        {row.livreur_id
                            ? `${row.livreur_id.nom} ${
                                  row.livreur_id.prenom || ""
                              }`
                            : "Non assigné"}
                    </span>
                </div>
            ),
        },
        {
            key: "total",
            header: "Total",
            render: (row) => (
                <span className="font-semibold">
                    {row.total ? `${row.total.toFixed(2)} €` : "0.00 €"}
                </span>
            ),
        },
        {
            key: "statut",
            header: "Statut",
            render: (row) => <StatusBadge status={row.statut || "inconnu"} />,
        },
        {
            key: "date_creation",
            header: "Date",
            render: (row) => (
                <div className="flex items-center">
                    <FaCalendarAlt className="mr-2 text-gray-400" />
                    <span>{formatDate(row.date_creation)}</span>
                </div>
            ),
        },
        {
            key: "actions",
            header: "Actions",
            render: (row) => (
                <div className="flex space-x-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCommande(row);
                            setIsDetailModalOpen(true);
                        }}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors"
                        title="Voir les détails"
                    >
                        <FaEye />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(row);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                        title="Modifier le statut"
                    >
                        <FaEdit />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleCancelCommande(row._id);
                        }}
                        className={`p-2 rounded-full transition-colors ${
                            ["annulee", "livree"].includes(row.statut)
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-red-600 hover:bg-red-50"
                        }`}
                        disabled={["annulee", "livree"].includes(row.statut)}
                        title={
                            ["annulee", "livree"].includes(row.statut)
                                ? "Impossible d'annuler cette commande"
                                : "Annuler la commande"
                        }
                    >
                        <FaTrash />
                    </button>
                </div>
            ),
        },
    ];

    // Loading states
    const isUsersLoading =
        isClientsLoading || isCommercantsLoading || isLivreursLoading;

    if (isLoading) {
        return (
            <div className="w-full h-full p-6 flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="w-full h-full p-6 flex justify-center items-center">
                <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                    <h3 className="font-bold mb-2">
                        Erreur lors du chargement des commandes
                    </h3>
                    <p>
                        {error?.message ||
                            "Une erreur s'est produite. Veuillez réessayer."}
                    </p>
                    <button
                        onClick={() => refetch()}
                        className="mt-2 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
                    >
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                    Gestion des Commandes
                </h1>
                <p className="text-gray-600">
                    {filteredCommandes.length} commande
                    {filteredCommandes.length !== 1 ? "s" : ""} trouvée
                    {filteredCommandes.length !== 1 ? "s" : ""}
                </p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-md p-4 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Filtres</h2>
                    <button
                        onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        {isFilterExpanded ? <FaTimes /> : <FaFilter />}
                    </button>
                </div>

                {isFilterExpanded && (
                    <>
                        <div className="mb-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    placeholder="Rechercher par ID, client, commerçant ou livreur..."
                                    className="w-full border border-gray-300 rounded-lg p-2 pl-10 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                    >
                                        <FaTimes />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Status filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Statut
                                </label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) =>
                                        setStatusFilter(e.target.value)
                                    }
                                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                >
                                    <option value="all">
                                        Tous les statuts
                                    </option>
                                    {ORDER_STATUSES.map((status) => (
                                        <option
                                            key={status.value}
                                            value={status.value}
                                        >
                                            {status.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Date range filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date de début
                                </label>
                                <input
                                    type="date"
                                    value={dateFilter.start}
                                    onChange={(e) =>
                                        setDateFilter({
                                            ...dateFilter,
                                            start: e.target.value,
                                        })
                                    }
                                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date de fin
                                </label>
                                <input
                                    type="date"
                                    value={dateFilter.end}
                                    onChange={(e) =>
                                        setDateFilter({
                                            ...dateFilter,
                                            end: e.target.value,
                                        })
                                    }
                                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                        </div>

                        <div className="mt-4 flex justify-end">
                            <ActionButton
                                label="Réinitialiser les filtres"
                                onClick={resetFilters}
                                color="gray"
                                disabled={
                                    statusFilter === "all" &&
                                    !dateFilter.start &&
                                    !dateFilter.end &&
                                    !userFilter &&
                                    !searchQuery
                                }
                            />
                        </div>
                    </>
                )}
            </div>

            {/* Commandes Table */}
            <DataTable
                data={filteredCommandes}
                columns={columns}
                onRowClick={(row) => {
                    setSelectedCommande(row);
                    // setIsDetailModalOpen(true);
                }}
                selectedRow={selectedCommande}
                emptyMessage={
                    <div className="text-center py-8">
                        <p className="text-gray-500 mb-2">
                            Aucune commande trouvée
                        </p>
                        {(statusFilter !== "all" ||
                            dateFilter.start ||
                            dateFilter.end ||
                            userFilter ||
                            searchQuery) && (
                            <button
                                onClick={resetFilters}
                                className="text-emerald-600 hover:text-emerald-700 font-medium"
                            >
                                Réinitialiser les filtres
                            </button>
                        )}
                    </div>
                }
            />

            {/* Detail Modal */}
            {isDetailModalOpen && selectedCommande && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold">
                                    Détails de la commande
                                </h2>
                                <button
                                    onClick={() => setIsDetailModalOpen(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <svg
                                        className="w-6 h-6"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-semibold mb-3">
                                        Informations générales
                                    </h3>
                                    <div className="space-y-2">
                                        <p>
                                            <span className="font-medium">
                                                ID:
                                            </span>{" "}
                                            {selectedCommande._id}
                                        </p>
                                        <p>
                                            <span className="font-medium">
                                                Total:
                                            </span>{" "}
                                            {selectedCommande.total
                                                ? `${selectedCommande.total.toFixed(
                                                      2
                                                  )} €`
                                                : "0.00 €"}
                                        </p>
                                        <p>
                                            <span className="font-medium">
                                                Statut:
                                            </span>{" "}
                                            <StatusBadge
                                                status={
                                                    selectedCommande.statut ||
                                                    "inconnu"
                                                }
                                            />
                                        </p>
                                        <p>
                                            <span className="font-medium">
                                                Date de création:
                                            </span>{" "}
                                            {selectedCommande.date_creation
                                                ? format(
                                                      new Date(
                                                          selectedCommande.date_creation
                                                      ),
                                                      "dd MMMM yyyy à HH:mm",
                                                      { locale: fr }
                                                  )
                                                : "N/A"}
                                        </p>
                                        {selectedCommande.date_recuperation && (
                                            <p>
                                                <span className="font-medium">
                                                    Date de récupération:
                                                </span>{" "}
                                                {format(
                                                    new Date(
                                                        selectedCommande.date_recuperation
                                                    ),
                                                    "dd MMMM yyyy à HH:mm",
                                                    { locale: fr }
                                                )}
                                            </p>
                                        )}
                                        {selectedCommande.date_livraison && (
                                            <p>
                                                <span className="font-medium">
                                                    Date de livraison:
                                                </span>{" "}
                                                {format(
                                                    new Date(
                                                        selectedCommande.date_livraison
                                                    ),
                                                    "dd MMMM yyyy à HH:mm",
                                                    { locale: fr }
                                                )}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold mb-3">
                                        Participants
                                    </h3>
                                    <div className="space-y-4">
                                        {selectedCommande.client_id && (
                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                <p className="font-medium flex items-center">
                                                    <FaUserAlt className="mr-2 text-emerald-500" />{" "}
                                                    Client
                                                </p>
                                                <p>
                                                    {
                                                        selectedCommande
                                                            .client_id?.nom
                                                    }{" "}
                                                    {
                                                        selectedCommande
                                                            .client_id?.prenom
                                                    }
                                                </p>
                                                <p>
                                                    {
                                                        selectedCommande
                                                            .client_id?.email
                                                    }
                                                </p>
                                                <p>
                                                    {
                                                        selectedCommande
                                                            .client_id
                                                            ?.telephone
                                                    }
                                                </p>
                                            </div>
                                        )}

                                        {selectedCommande.commercant_id && (
                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                <p className="font-medium flex items-center">
                                                    <FaStore className="mr-2 text-amber-500" />{" "}
                                                    Commerçant
                                                </p>
                                                <p>
                                                    {
                                                        selectedCommande
                                                            .commercant_id?.nom
                                                    }
                                                </p>
                                                <p>
                                                    {
                                                        selectedCommande
                                                            .commercant_id
                                                            ?.email
                                                    }
                                                </p>
                                                <p>
                                                    {
                                                        selectedCommande
                                                            .commercant_id
                                                            ?.telephone
                                                    }
                                                </p>
                                            </div>
                                        )}

                                        {selectedCommande.livreur_id && (
                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                <p className="font-medium flex items-center">
                                                    <FaMotorcycle className="mr-2 text-indigo-500" />{" "}
                                                    Livreur
                                                </p>
                                                <p>
                                                    {
                                                        selectedCommande
                                                            .livreur_id?.nom
                                                    }{" "}
                                                    {
                                                        selectedCommande
                                                            .livreur_id?.prenom
                                                    }
                                                </p>
                                                <p>
                                                    {
                                                        selectedCommande
                                                            .livreur_id?.email
                                                    }
                                                </p>
                                                <p>
                                                    {
                                                        selectedCommande
                                                            .livreur_id
                                                            ?.telephone
                                                    }
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {selectedCommande.adresse_livraison && (
                                    <div className="md:col-span-2">
                                        <h3 className="text-lg font-semibold mb-3 flex items-center">
                                            <FaMapMarkerAlt className="mr-2 text-red-500" />{" "}
                                            Adresse de livraison
                                        </h3>
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <p>
                                                {
                                                    selectedCommande
                                                        .adresse_livraison?.rue
                                                }
                                            </p>
                                            <p>
                                                {
                                                    selectedCommande
                                                        .adresse_livraison
                                                        ?.code_postal
                                                }{" "}
                                                {
                                                    selectedCommande
                                                        .adresse_livraison
                                                        ?.ville
                                                }
                                            </p>
                                            {selectedCommande.adresse_livraison
                                                ?.lat &&
                                                selectedCommande
                                                    .adresse_livraison?.lng && (
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        Coordonnées:{" "}
                                                        {
                                                            selectedCommande
                                                                .adresse_livraison
                                                                ?.lat
                                                        }
                                                        ,{" "}
                                                        {
                                                            selectedCommande
                                                                .adresse_livraison
                                                                ?.lng
                                                        }
                                                    </p>
                                                )}
                                        </div>
                                    </div>
                                )}

                                {(selectedCommande.code_Client ||
                                    selectedCommande.code_Commercant) && (
                                    <div className="md:col-span-2">
                                        <h3 className="text-lg font-semibold mb-3">
                                            Codes de vérification
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {selectedCommande.code_Client && (
                                                <div className="p-3 bg-gray-50 rounded-lg">
                                                    <p className="font-medium">
                                                        Code Client
                                                    </p>
                                                    <p className="text-2xl font-mono font-bold text-center my-2">
                                                        {
                                                            selectedCommande.code_Client
                                                        }
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {selectedCommande.is_client_verifie
                                                            ? "Vérifié ✓"
                                                            : "Non vérifié"}
                                                    </p>
                                                </div>
                                            )}

                                            {selectedCommande.code_Commercant && (
                                                <div className="p-3 bg-gray-50 rounded-lg">
                                                    <p className="font-medium">
                                                        Code Commerçant
                                                    </p>
                                                    <p className="text-2xl font-mono font-bold text-center my-2">
                                                        {
                                                            selectedCommande.code_Commercant
                                                        }
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {selectedCommande.is_commercant_verifie
                                                            ? "Vérifié ✓"
                                                            : "Non vérifié"}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 flex justify-end space-x-3">
                                <ActionButton
                                    label="Fermer"
                                    onClick={() => setIsDetailModalOpen(false)}
                                    color="gray"
                                />
                                <ActionButton
                                    label="Modifier le statut"
                                    onClick={() => {
                                        setIsDetailModalOpen(false);
                                        openEditModal(selectedCommande);
                                    }}
                                    color="blue"
                                    icon={<FaEdit />}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && selectedCommande && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold">
                                    Modifier le statut de la commande
                                </h2>
                                <button
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <svg
                                        className="w-6 h-6"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Statut actuel
                                    </label>
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <StatusBadge
                                            status={
                                                selectedCommande.statut ||
                                                "inconnu"
                                            }
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nouveau statut
                                    </label>
                                    <select
                                        value={selectedStatus}
                                        onChange={(e) =>
                                            setSelectedStatus(e.target.value)
                                        }
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        disabled={isStatusUpdating}
                                    >
                                        {ORDER_STATUSES.map((status) => (
                                            <option
                                                key={status.value}
                                                value={status.value}
                                            >
                                                {status.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800">
                                    <p className="text-sm">
                                        <strong>Note:</strong> La modification
                                        du statut d'une commande peut déclencher
                                        des notifications automatiques aux
                                        utilisateurs concernés. Assurez-vous que
                                        cette action est appropriée.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end space-x-3">
                                <ActionButton
                                    label="Annuler"
                                    onClick={() => setIsEditModalOpen(false)}
                                    color="gray"
                                    disabled={isStatusUpdating}
                                />
                                <ActionButton
                                    label="Mettre à jour le statut"
                                    onClick={handleStatusUpdate}
                                    color="emerald"
                                    icon={<FaEdit />}
                                    disabled={
                                        isStatusUpdating ||
                                        selectedStatus ===
                                            selectedCommande.statut
                                    }
                                    loading={isStatusUpdating}
                                />
                                <ActionButton
                                    label="Annuler la commande"
                                    onClick={() => {
                                        handleCancelCommande(
                                            selectedCommande._id
                                        );
                                    }}
                                    color="red"
                                    icon={<FaTrash />}
                                    disabled={
                                        ["annulee", "livree"].includes(
                                            selectedCommande.statut
                                        ) || isStatusUpdating
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GestionCommandePage;
