"use client";

import { useGetUserCommandes, useAuthUserQuery } from "../../Hooks";
import toast from "react-hot-toast";
import PropTypes from "prop-types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router";

const STATUS_STYLES = {
    en_attente: {
        bg: "bg-gray-100",
        text: "text-gray-800",
        dot: "bg-gray-500",
    },
    en_preparation: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        dot: "bg-yellow-500",
    },
    prete_a_etre_recuperee: {
        bg: "bg-purple-100",
        text: "text-purple-800",
        dot: "bg-purple-500",
    },
    recuperee_par_livreur: {
        bg: "bg-pink-100",
        text: "text-pink-800",
        dot: "bg-pink-500",
    },
    en_livraison: {
        bg: "bg-blue-100",
        text: "text-blue-800",
        dot: "bg-blue-500",
    },
    livree: { bg: "bg-green-100", text: "text-green-800", dot: "bg-green-500" },
    annulee: { bg: "bg-red-100", text: "text-red-800", dot: "bg-red-500" },
    refusee: { bg: "bg-red-100", text: "text-red-800", dot: "bg-red-500" },
};

const ROLE_COLUMNS = {
    client: [
        "ID",
        "Commerçant",
        "Livreur",
        "Produits",
        "Total",
        "Statut",
        "Date",
        "Actions",
    ],
    commercant: [
        "ID",
        "Client",
        "Livreur",
        "Produits",
        "Total",
        "Statut",
        "Date",
        "Actions",
    ],
    livreur: [
        "ID",
        "Client",
        "Commerçant",
        "Adresse",
        "Distance",
        "Statut",
        "Date",
        "Actions",
    ],
};

const CommandesListePage = () => {
    const { data: commandesData, isLoading, isError } = useGetUserCommandes(); // Rafraîchir toutes les 10 secondes
    const { data: authUser, isLoading: authLoading } = useAuthUserQuery();
    const queryClient = useQueryClient();

    // Mutation pour mettre à jour le statut d'une commande
    const updateCommandeStatusMutation = useMutation({
        mutationFn: async ({ commandeId, newStatus }) => {
            console.log("commandeId", commandeId, "newStatus", newStatus);

            const res = await fetch(`/api/commandes/update-status`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ commandeId, statut: newStatus }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(
                    errorData.error || "Erreur lors de la mise à jour du statut"
                );
            }

            return res.json();
        },
        onSuccess: (data, variables) => {
            const statusText =
                variables.newStatus === "en_preparation"
                    ? "acceptée"
                    : "refusée";
            toast.success(`Commande ${statusText} avec succès!`);
            // Rafraîchir les données des commandes
            queryClient.invalidateQueries(["getUserCommandes"]);
        },
        onError: (error) => {
            toast.error(
                error.message || "Erreur lors de la mise à jour du statut"
            );
        },
    });

    // Fonction pour accepter une commande
    const acceptCommande = (commandeId) => {
        updateCommandeStatusMutation.mutate({
            commandeId,
            newStatus: "en_preparation",
        });
    };

    // Fonction pour refuser une commande
    const refuseCommande = (commandeId) => {
        updateCommandeStatusMutation.mutate({
            commandeId,
            newStatus: "refusee",
        });
    };

    // Fonction pour annuler une commande (client)
    const cancelCommande = async (id) => {
        try {
            const response = await fetch(`api/commandes/cancel/${id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ statut: "annulee" }),
            });
            if (!response.ok) throw new Error("Échec de l'annulation");

            // Rafraîchir les données au lieu de recharger la page
            queryClient.invalidateQueries(["getUserCommandes"]);
            toast.success("Commande annulée avec succès");
        } catch (error) {
            console.error("Erreur annulation:", error);
            toast.error("Impossible d'annuler la commande");
        }
    };

    if (isLoading || authLoading) return <LoadingSpinner />;
    if (isError || !commandesData || !authUser)
        return <ErrorMessage message="Erreur lors du chargement" />;

    const commandes = (commandesData.commandes || []).sort(
        (a, b) => new Date(b.date_creation) - new Date(a.date_creation)
    );
    const columns = ROLE_COLUMNS[authUser.role] || ROLE_COLUMNS.client;

    return (
        <main className="w-full min-h-full p-6">
            <h1 className="text-2xl font-bold text-emerald-700 mb-6">
                Mes Commandes
            </h1>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-emerald-100 to-emerald-200">
                    <h2 className="text-lg font-semibold text-emerald-800">
                        Liste ({commandes.length})
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="text-left py-4 px-4 font-semibold text-gray-600 rounded-tl-lg">
                                    ID
                                </th>
                                {columns.map(
                                    (col, index) =>
                                        col !== "ID" &&
                                        col !== "Actions" && (
                                            <th
                                                key={col}
                                                className="text-left py-4 px-4 font-semibold text-gray-600"
                                            >
                                                {col}
                                            </th>
                                        )
                                )}
                                <th className="text-right py-4 px-4 font-semibold text-gray-600 rounded-tr-lg">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {commandes.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={columns.length}
                                        className="py-8 text-center text-gray-500"
                                    >
                                        Aucune commande
                                    </td>
                                </tr>
                            ) : (
                                commandes.map((commande, index) => (
                                    <tr
                                        key={commande._id}
                                        className={`hover:bg-emerald-50 transition-colors duration-150 ${
                                            index === commandes.length - 1
                                                ? "rounded-b-lg"
                                                : ""
                                        }`}
                                    >
                                        <td className="py-4 px-4 font-medium text-emerald-600">
                                            {commande._id.slice(-6)}
                                        </td>
                                        {renderRoleSpecificColumns(
                                            commande,
                                            authUser.role
                                        )}
                                        {authUser.role !== "livreur" && (
                                            <>
                                                <td className="py-4 px-4">
                                                    {/* {formatProduits(commande.produits)} */}
                                                </td>
                                                <td className="py-4 px-4 font-medium">
                                                    {commande.total?.toFixed(2)}{" "}
                                                    €
                                                </td>
                                            </>
                                        )}
                                        <td className="py-4 px-4">
                                            <span
                                                className={`px-3 py-1.5 rounded-full text-xs font-medium inline-flex items-center ${
                                                    STATUS_STYLES[
                                                        commande.statut
                                                    ]?.bg || "bg-gray-100"
                                                } ${
                                                    STATUS_STYLES[
                                                        commande.statut
                                                    ]?.text || "text-gray-800"
                                                }`}
                                            >
                                                <span
                                                    className={`w-2 h-2 rounded-full mr-1.5 ${
                                                        STATUS_STYLES[
                                                            commande.statut
                                                        ]?.dot || "bg-gray-500"
                                                    }`}
                                                ></span>
                                                {commande.statut.replace(
                                                    /_/g,
                                                    " "
                                                )}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            {new Date(
                                                commande.date_creation
                                            ).toLocaleDateString("fr-FR")}
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <div className="flex gap-2 justify-end">
                                                <Link
                                                    to={`/commande/${commande._id}`}
                                                >
                                                    <button className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-xs">
                                                        Voir
                                                    </button>
                                                </Link>
                                                {/* Actions pour les commandes en livraison ou livrées */}
                                                {(commande.statut ===
                                                    "prete_a_etre_recuperee" ||
                                                    commande.statut ===
                                                        "recuperee_par_livreur" ||
                                                    commande.statut ===
                                                        "livree" ||
                                                    commande.statut ===
                                                        "en_livraison") && (
                                                    <Link
                                                        to={`/livraison/${commande._id}`}
                                                    >
                                                        <button className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-xs">
                                                            Suivre
                                                        </button>
                                                    </Link>
                                                )}

                                                {/* Actions pour les commandes en attente */}
                                                {commande.statut ===
                                                    "en_attente" && (
                                                    <>
                                                        {/* Actions pour le client */}
                                                        {authUser.role ===
                                                            "client" && (
                                                            <button
                                                                onClick={() =>
                                                                    cancelCommande(
                                                                        commande._id
                                                                    )
                                                                }
                                                                className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-xs"
                                                                disabled={
                                                                    updateCommandeStatusMutation.isPending
                                                                }
                                                            >
                                                                Annuler
                                                            </button>
                                                        )}

                                                        {/* Actions pour le commerçant */}
                                                        {authUser.role ===
                                                            "commercant" && (
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() =>
                                                                        acceptCommande(
                                                                            commande._id
                                                                        )
                                                                    }
                                                                    className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-xs"
                                                                    disabled={
                                                                        updateCommandeStatusMutation.isPending
                                                                    }
                                                                >
                                                                    Accepter
                                                                </button>
                                                                <button
                                                                    onClick={() =>
                                                                        refuseCommande(
                                                                            commande._id
                                                                        )
                                                                    }
                                                                    className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-xs"
                                                                    disabled={
                                                                        updateCommandeStatusMutation.isPending
                                                                    }
                                                                >
                                                                    Refuser
                                                                </button>
                                                            </div>
                                                        )}
                                                    </>
                                                )}

                                                {/* Actions pour les commandes en préparation */}
                                                {commande.statut ===
                                                    "en_preparation" &&
                                                    authUser.role ===
                                                        "commercant" && (
                                                        <a
                                                            href={`/livreurs/${commande._id}`}
                                                            className="px-3 py-1 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors text-xs"
                                                        >
                                                            Assigner un livreur
                                                        </a>
                                                    )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
};

const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-screen">
        <span className="loading loading-spinner loading-lg text-emerald-600"></span>
    </div>
);

const ErrorMessage = ({ message }) => (
    <div className="flex justify-center items-center h-screen text-red-600">
        {message}
    </div>
);

ErrorMessage.propTypes = {
    message: PropTypes.string.isRequired,
};

const renderRoleSpecificColumns = (commande, role) => {
    switch (role) {
        case "client":
            return (
                <>
                    <td className="py-4 px-4">
                        {commande.commercant_id?.nom || "N/A"}
                    </td>
                    <td className="py-4 px-4">
                        {commande.livreur_id?.nom || (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                Non assigné
                            </span>
                        )}
                    </td>
                </>
            );
        case "commercant":
            return (
                <>
                    <td className="py-4 px-4">
                        {commande.client_id?.nom || "N/A"}
                    </td>
                    <td className="py-4 px-4">
                        {commande.livreur_id?.nom || (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                Non assigné
                            </span>
                        )}
                    </td>
                </>
            );
        case "livreur":
            return (
                <>
                    <td className="py-4 px-4">
                        {commande.client_id?.nom || "N/A"}
                    </td>
                    <td className="py-4 px-4">
                        {commande.commercant_id?.nom || "N/A"}
                    </td>
                    <td className="py-4 px-4">
                        {commande.adresse_livraison?.rue || "N/A"}
                    </td>
                    <td className="py-4 px-4">
                        {calculateDistance(commande.adresse_livraison) ? (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                                {calculateDistance(commande.adresse_livraison)}
                            </span>
                        ) : (
                            "N/A"
                        )}
                    </td>
                </>
            );
        default:
            return null;
    }
};

const calculateDistance = (adresse) =>
    adresse?.lat && adresse?.lng ? "2.5 km" : "N/A";

export default CommandesListePage;
