"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAssignLivreur, useAuthUserQuery } from "../../Hooks";
import { useState } from "react";
import toast from "react-hot-toast";
import {
    FaBell,
    FaCheck,
    FaTrash,
    FaStore,
    FaTruck,
    FaUser,
    FaExclamationTriangle,
} from "react-icons/fa";
import { Link } from "react-router";

const getNotifications = async () => {
    try {
        const res = await fetch(`/api/notifications`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "Erreur lors du chargement");
        }

        return data;
    } catch (error) {
        toast.error(error.message);
        throw error;
    }
};

const NotificationsPage = () => {
    const [filter, setFilter] = useState("all");
    const queryClient = useQueryClient();

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["notifications"],
        queryFn: getNotifications,
        retry: false,
        refetchInterval: 5000,
    });

    const assignLivreur = useAssignLivreur();
    const { data: authUser } = useAuthUserQuery();

    // Mutation pour marquer comme lu
    const markAsReadMutation = useMutation({
        mutationFn: async (notificationId) => {
            const res = await fetch(
                `/api/notifications/read/${notificationId}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                }
            );

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(
                    errorData.error || "Erreur lors de la mise à jour"
                );
            }

            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["notifications"]);
            toast.success("Notification marquée comme lue");
        },
        onError: (error) => {
            toast.error(error.message || "Erreur lors de la mise à jour");
        },
    });

    // Mutation pour supprimer
    const deleteNotificationMutation = useMutation({
        mutationFn: async (notificationId) => {
            const res = await fetch(
                `/api/notifications/delete/${notificationId}`,
                {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                }
            );

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(
                    errorData.error || "Erreur lors de la suppression"
                );
            }

            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["notifications"]);
            toast.success("Notification supprimée");
        },
        onError: (error) => {
            toast.error(error.message || "Erreur lors de la suppression");
        },
    });

    const handleMarkAsRead = (id) => {
        markAsReadMutation.mutate(id);
    };

    const handleDelete = (id) => {
        deleteNotificationMutation.mutate(id);
    };

    const getNotificationIcon = (type) => {
        switch (type?.toLowerCase()) {
            case "acceptation de commande":
                return <FaStore className="text-emerald-500" />;
            case "nouveau livreur assigné":
                return <FaTruck className="text-blue-500" />;
            case "utilisateur":
                return <FaUser className="text-purple-500" />;
            case "alerte":
                return <FaExclamationTriangle className="text-amber-500" />;
            default:
                return <FaBell className="text-gray-500" />;
        }
    };

    const getTimeAgo = (dateString) => {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffInSeconds = Math.floor((now - date) / 1000);

            if (diffInSeconds < 60) return "À l'instant";
            if (diffInSeconds < 3600)
                return `Il y a ${Math.floor(diffInSeconds / 60)} minutes`;
            if (diffInSeconds < 86400)
                return `Il y a ${Math.floor(diffInSeconds / 3600)} heures`;
            if (diffInSeconds < 604800)
                return `Il y a ${Math.floor(diffInSeconds / 86400)} jours`;

            return date.toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
            });
        } catch {
            return "Date inconnue";
        }
    };

    const getFormattedDate = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return "Date inconnue";
        }
    };

    const filteredNotifications =
        data?.notifications?.filter((notification) => {
            if (filter === "all") return true;
            if (filter === "unread") return !notification.read;
            return notification.type?.toLowerCase() === filter;
        }) || [];

    if (isLoading) {
        return (
            <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-teal-100 p-6 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-emerald-700">
                        Notifications
                    </h1>
                </div>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="w-full h-full p-6 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-emerald-700">
                        Notifications
                    </h1>
                </div>
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <FaExclamationTriangle className="h-5 w-5 text-red-500" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">
                                Une erreur est survenue lors du chargement des
                                notifications.
                            </p>
                            <button
                                onClick={() => refetch()}
                                className="mt-2 px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors"
                            >
                                Réessayer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-teal-100 p-6 flex flex-col">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
                <h1 className="text-2xl font-bold text-emerald-700">
                    Notifications
                </h1>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Filtrer:</span>
                    <div className="flex bg-white rounded-lg shadow-sm overflow-hidden">
                        <button
                            className={`px-3 py-1.5 text-sm transition-colors ${
                                filter === "all"
                                    ? "bg-emerald-500 text-white"
                                    : "hover:bg-gray-100"
                            }`}
                            onClick={() => setFilter("all")}
                        >
                            Toutes
                        </button>
                        <button
                            className={`px-3 py-1.5 text-sm transition-colors ${
                                filter === "unread"
                                    ? "bg-emerald-500 text-white"
                                    : "hover:bg-gray-100"
                            }`}
                            onClick={() => setFilter("unread")}
                        >
                            Non lues
                        </button>
                        <button
                            className={`px-3 py-1.5 text-sm transition-colors ${
                                filter === "nouvelle commande"
                                    ? "bg-emerald-500 text-white"
                                    : "hover:bg-gray-100"
                            }`}
                            onClick={() => setFilter("nouvelle commande")}
                        >
                            Commandes
                        </button>
                        <button
                            className={`px-3 py-1.5 text-sm transition-colors ${
                                filter === "livraison"
                                    ? "bg-emerald-500 text-white"
                                    : "hover:bg-gray-100"
                            }`}
                            onClick={() => setFilter("livraison")}
                        >
                            Livraisons
                        </button>
                    </div>
                </div>
            </div>

            {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg shadow-sm">
                    <div className="bg-gray-100 p-4 rounded-full mb-4">
                        <FaBell className="h-8 w-8 text-gray-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">
                        Aucune notification
                    </h2>
                    <p className="text-gray-500 text-center max-w-md">
                        {filter !== "all"
                            ? `Vous n'avez pas de notifications dans la catégorie "${filter}".`
                            : "Vous n'avez pas encore reçu de notifications. Elles apparaîtront ici lorsque vous en recevrez."}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredNotifications.map((notification) => (
                        <div
                            key={notification._id}
                            className={`p-4 bg-white rounded-lg shadow-sm border-l-4 ${
                                notification.read
                                    ? "border-gray-200"
                                    : "border-emerald-500"
                            } transition-all hover:shadow-md transform hover:-translate-y-1 duration-200`}
                        >
                            <div className="flex items-start">
                                <div className="flex-shrink-0 p-2 bg-gray-50 rounded-full mr-4">
                                    {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between">
                                        <p
                                            className={`text-sm font-medium ${
                                                notification.read
                                                    ? "text-gray-700"
                                                    : "text-emerald-700"
                                            }`}
                                        >
                                            {notification.type ||
                                                "Notification"}
                                        </p>
                                        <span className="text-xs text-gray-500">
                                            {getTimeAgo(notification.createdAt)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-800 mt-1 leading-relaxed">
                                        <>
                                            Notification de{" "}
                                            <span className="font-semibold">
                                                {notification.sender?.nom ??
                                                    "Système"}
                                            </span>
                                        </>
                                        <br />
                                        {notification.description && (
                                            <>
                                                <span className="font-semibold">
                                                    Description du probleme :
                                                </span>{" "}
                                                {notification.description}
                                                <br />
                                            </>
                                        )}
                                        {notification.isRequest &&
                                            (notification.isAccepted &&
                                            notification.commande_id
                                                .livreur_id == authUser._id ? (
                                                <>
                                                    <span className="mt-2 text-green-600">
                                                        Vous avez accepté la
                                                        commande
                                                    </span>
                                                    <br />
                                                    <Link
                                                        to={`/livraison/${notification.commande_id._id}`}
                                                        className="text-emerald-600 underline hover:text-emerald-400 transition-all mt-2"
                                                    >
                                                        Suivi de la commande
                                                    </Link>
                                                </>
                                            ) : notification.isRefused ? (
                                                <span className="mt-2 text-red-600">
                                                    Vous avez refusé la commande
                                                </span>
                                            ) : notification.commande_id &&
                                              notification.commande_id
                                                  .livreur_id ==
                                                  authUser._id ? (
                                                <>
                                                    <span className="mt-2 text-green-600">
                                                        Vous avez accepté la
                                                        commande
                                                    </span>
                                                    <br />
                                                    <Link
                                                        to={`/livraison/${notification.commande_id._id}`}
                                                        className="text-emerald-600 underline hover:text-emerald-400 transition-all mt-2"
                                                    >
                                                        Suivi de la commande
                                                    </Link>
                                                </>
                                            ) : notification.commande_id &&
                                              notification.commande_id
                                                  .livreur_id ? (
                                                <span className="mt-2 text-gray-600">
                                                    La commande a déjà un
                                                    livreur assigné
                                                </span>
                                            ) : (
                                                <div className="mt-2 flex gap-2">
                                                    <button
                                                        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                                                        onClick={() => {
                                                            assignLivreur(
                                                                notification.commande_id,
                                                                authUser._id,
                                                                notification._id,
                                                                "accepter"
                                                            );
                                                        }}
                                                    >
                                                        Accepter
                                                    </button>
                                                    <button
                                                        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                                                        onClick={() => {
                                                            assignLivreur(
                                                                notification.commande_id,
                                                                authUser._id,
                                                                notification._id,
                                                                "refuser"
                                                            );
                                                        }}
                                                    >
                                                        Refuser
                                                    </button>
                                                </div>
                                            ))}
                                    </p>
                                    <div className="mt-2 flex justify-between items-center">
                                        <span className="text-xs text-gray-500">
                                            {getFormattedDate(
                                                notification.createdAt
                                            )}
                                        </span>
                                        <div className="flex space-x-2">
                                            {!notification.read && (
                                                <button
                                                    onClick={() =>
                                                        handleMarkAsRead(
                                                            notification._id
                                                        )
                                                    }
                                                    className="p-1.5 bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-100 transition-colors"
                                                    title="Marquer comme lu"
                                                    disabled={
                                                        markAsReadMutation.isLoading
                                                    }
                                                >
                                                    <FaCheck className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() =>
                                                    handleDelete(
                                                        notification._id
                                                    )
                                                }
                                                className="p-1.5 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors"
                                                title="Supprimer"
                                                disabled={
                                                    deleteNotificationMutation.isLoading
                                                }
                                            >
                                                <FaTrash className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;
