"use client";

import { useGetUserCommandes } from "../../Hooks/useGetCommandes";
import { useAuthUserQuery } from "../../Hooks/useAuthQueries";
import toast from "react-hot-toast";
import PropTypes from "prop-types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const STATUS_STYLES = {
    en_attente: "bg-gray-100 text-gray-800",
    en_preparation: "bg-yellow-100 text-yellow-800",
    en_livraison: "bg-blue-100 text-blue-800",
    livree: "bg-green-100 text-green-800",
    annulee: "bg-red-100 text-red-800",
    refusee: "bg-red-100 text-red-800",
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
    const {
        data: commandesData,
        isLoading,
        isError,
    } = useGetUserCommandes(10000); // Rafraîchir toutes les 10 secondes
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
        <main className="w-full min-h-full bg-gray-100 p-6">
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
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                {columns.map((col) => (
                                    <th
                                        key={col}
                                        className="py-3 px-4 text-sm font-semibold text-gray-700"
                                    >
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {commandes.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={columns.length}
                                        className="py-3 px-4 text-center text-gray-500"
                                    >
                                        Aucune commande
                                    </td>
                                </tr>
                            ) : (
                                commandes.map((commande) => (
                                    <tr
                                        key={commande._id}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="py-3 px-4">
                                            {commande._id.slice(-6)}
                                        </td>
                                        {renderRoleSpecificColumns(
                                            commande,
                                            authUser.role
                                        )}
                                        {authUser.role !== "livreur" && (
                                            <>
                                                <td className="py-3 px-4">
                                                    {/* {formatProduits(commande.produits)} */}
                                                </td>
                                                <td className="py-3 px-4">
                                                    {commande.total?.toFixed(2)}{" "}
                                                    €
                                                </td>
                                            </>
                                        )}
                                        <td className="py-3 px-4">
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    STATUS_STYLES[
                                                        commande.statut
                                                    ] ||
                                                    "bg-gray-100 text-gray-800"
                                                }`}
                                            >
                                                {commande.statut.replace(
                                                    /_/g,
                                                    " "
                                                )}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            {new Date(
                                                commande.date_creation
                                            ).toLocaleDateString("fr-FR")}
                                        </td>
                                        <td className="py-3 px-4 flex gap-2">
                                            {/* Actions pour les commandes en livraison ou livrées */}
                                            {(commande.statut ===
                                                "prete_a_etre_recuperee" ||
                                                commande.statut ===
                                                    "recuperee_par_livreur" ||
                                                commande.statut === "livree" ||
                                                commande.statut ===
                                                    "en_livraison") && (
                                                <a
                                                    href={`/livraison/${commande._id}`}
                                                    className="text-emerald-500 hover:text-emerald-800 transition-colors"
                                                >
                                                    Suivre
                                                </a>
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
                                                            className="text-red-500 hover:text-red-700 transition-colors"
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
                                                                className="px-2 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-xs"
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
                                                                className="px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-xs"
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
                                                        className="text-emerald-500 hover:text-emerald-700 transition-colors"
                                                    >
                                                        Assigner un livreur
                                                    </a>
                                                )}
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
                    <td className="py-3 px-4">
                        {commande.commercant_id?.nom || "N/A"}
                    </td>
                    <td className="py-3 px-4">
                        {commande.livreur_id?.nom || "Non assigné"}
                    </td>
                </>
            );
        case "commercant":
            return (
                <>
                    <td className="py-3 px-4">
                        {commande.client_id?.nom || "N/A"}
                    </td>
                    <td className="py-3 px-4">
                        {commande.livreur_id?.nom || "Non assigné"}
                    </td>
                </>
            );
        case "livreur":
            return (
                <>
                    <td className="py-3 px-4">
                        {commande.client_id?.nom || "N/A"}
                    </td>
                    <td className="py-3 px-4">
                        {commande.commercant_id?.nom || "N/A"}
                    </td>
                    <td className="py-3 px-4">
                        {commande.adresse_livraison?.rue || "N/A"}
                    </td>
                    <td className="py-3 px-4">
                        {calculateDistance(commande.adresse_livraison)}
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
