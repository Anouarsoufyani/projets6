"use client";

import { useState } from "react";
import {
    useAuthUserQuery,
    useGetCommandeById,
    useUpdateCommandeStatus,
    useCancelCommande,
} from "../../Hooks";
import { useParams, useNavigate, Link } from "react-router";
import {
    FaUser,
    FaStore,
    FaTruck,
    FaMapMarkerAlt,
    FaEuroSign,
    FaClock,
    FaBarcode,
    FaArrowLeft,
    FaCheck,
    FaTimes,
    FaShippingFast,
    FaStar,
} from "react-icons/fa";
import ReviewForm from "../../Components/Reviews/ReviewForm";
import { useGetReviewsForUser } from "../../Hooks/queries/useGetReviews";

const DetailCommande = () => {
    const { data: authUser } = useAuthUserQuery();
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: commande, isCommandeLoading: isLoading } =
        useGetCommandeById(id);
    const { mutate: updateStatus, isLoading: isUpdating } =
        useUpdateCommandeStatus();
    const { mutate: cancelCommande, isLoading: isCancelling } =
        useCancelCommande();
    const [showCommercantReviewForm, setShowCommercantReviewForm] =
        useState(false);
    const [showLivreurReviewForm, setShowLivreurReviewForm] = useState(false);

    // Récupérer les avis existants pour cette commande
    const { data: commercantReviews } = useGetReviewsForUser(
        commande?.commercant_id?._id
    );
    const { data: livreurReviews } = useGetReviewsForUser(
        commande?.livreur_id?._id
    );

    // Vérifier si l'utilisateur a déjà laissé un avis
    const hasReviewedCommercant = commercantReviews?.some(
        (review) =>
            review.commandeId === id && review.clientId === authUser?._id
    );
    const hasReviewedLivreur = livreurReviews?.some(
        (review) =>
            review.commandeId === id && review.clientId === authUser?._id
    );

    if (isLoading || !commande) {
        return (
            <div className="w-full min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    const {
        _id,
        client_id,
        commercant_id,
        livreur_id,
        total,
        statut,
        date_creation,
        code_Client,
        code_Commercant,
        adresse_livraison,
    } = commande;

    const handleRedirect = () => navigate(`/livraison/${_id}`);

    const handleUpdateStatus = (newStatus) => {
        updateStatus({ commandeId: _id, newStatus });
    };

    const handleCancelCommande = () => {
        cancelCommande(_id, {
            onSuccess: () => {
                navigate("/commandes");
            },
        });
    };

    const getStatusColor = (status) => {
        const statusColors = {
            en_attente: "bg-yellow-100 text-yellow-800 border-yellow-200",
            en_preparation: "bg-blue-100 text-blue-800 border-blue-200",
            prete_a_etre_recuperee:
                "bg-purple-100 text-purple-800 border-purple-200",
            recuperee_par_livreur:
                "bg-indigo-100 text-indigo-800 border-indigo-200",
            en_livraison: "bg-emerald-100 text-emerald-800 border-emerald-200",
            livree: "bg-green-100 text-green-800 border-green-200",
            annulee: "bg-red-100 text-red-800 border-red-200",
            refusee: "bg-red-100 text-red-800 border-red-200",
        };
        return (
            statusColors[status] || "bg-gray-100 text-gray-800 border-gray-200"
        );
    };

    const getStatusDot = (status) => {
        const statusDots = {
            en_attente: "bg-yellow-500",
            en_preparation: "bg-blue-500",
            prete_a_etre_recuperee: "bg-purple-500",
            recuperee_par_livreur: "bg-indigo-500",
            en_livraison: "bg-emerald-500",
            livree: "bg-green-500",
            annulee: "bg-red-500",
            refusee: "bg-red-500",
        };
        return statusDots[status] || "bg-gray-500";
    };

    const renderActionButtons = () => {
        if (!authUser) return null;

        const role = authUser.role;

        if (role === "commercant" && statut === "en_attente") {
            return (
                <div className="flex gap-4">
                    <button
                        className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-md hover:bg-emerald-700 transition-colors"
                        onClick={() => handleUpdateStatus("en_preparation")}
                        disabled={isUpdating}
                    >
                        <FaCheck className="text-white" />
                        {isUpdating ? "Traitement..." : "Valider"}
                    </button>
                    <button
                        className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl shadow-md hover:bg-red-700 transition-colors"
                        onClick={() => handleUpdateStatus("refusee")}
                        disabled={isUpdating}
                    >
                        <FaTimes className="text-white" />
                        {isUpdating ? "Traitement..." : "Refuser"}
                    </button>
                </div>
            );
        }

        if (role === "commercant" && statut === "en_preparation") {
            return (
                <button className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl shadow-md hover:bg-blue-700 transition-colors">
                    <FaTruck className="text-white" />
                    <Link to={`/livreurs/${_id}`}>Assigner un livreur</Link>
                </button>
            );
        }

        if (role === "client" && statut === "en_attente") {
            return (
                <button
                    className="flex items-center gap-2 bg-yellow-600 text-white px-6 py-3 rounded-xl shadow-md hover:bg-yellow-700 transition-colors"
                    onClick={handleCancelCommande}
                    disabled={isCancelling}
                >
                    <FaTimes className="text-white" />
                    {isCancelling ? "Annulation..." : "Annuler"}
                </button>
            );
        }

        if (role === "livreur" && statut === "en_preparation") {
            return (
                <div className="flex gap-4">
                    <button
                        className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-md hover:bg-emerald-700 transition-colors"
                        onClick={() => {}}
                    >
                        <FaCheck className="text-white" />
                        Accepter la course
                    </button>
                    <button
                        className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl shadow-md hover:bg-red-700 transition-colors"
                        onClick={() => {}}
                    >
                        <FaTimes className="text-white" />
                        Refuser
                    </button>
                </div>
            );
        }

        if (
            [
                "prete_a_etre_recuperee",
                "recuperee_par_livreur",
                "livree",
                "en_livraison",
            ].includes(statut)
        ) {
            return (
                <button
                    className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl shadow-md hover:bg-indigo-700 transition-colors"
                    onClick={handleRedirect}
                >
                    <FaShippingFast className="text-white" />
                    Voir la livraison
                </button>
            );
        }

        return null;
    };

    // Afficher les formulaires d'avis uniquement pour les clients et les commandes livrées
    const canReview = authUser?.role === "client" && statut === "livree";

    return (
        <div className="w-full min-h-screen p-6 flex justify-center bg-gradient-to-br from-emerald-50 to-teal-100">
            <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl p-8 space-y-8">
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center text-emerald-700 hover:text-emerald-900 transition-colors"
                    >
                        <FaArrowLeft className="mr-2" />
                        <span>Retour</span>
                    </button>

                    <div className="flex items-center">
                        <span
                            className={`px-4 py-2 rounded-full text-sm font-medium inline-flex items-center ${getStatusColor(
                                statut
                            )}`}
                        >
                            <span
                                className={`w-2 h-2 rounded-full mr-2 ${getStatusDot(
                                    statut
                                )}`}
                            ></span>
                            {statut.replace(/_/g, " ")}
                        </span>
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-emerald-700 border-b border-emerald-100 pb-4">
                    Commande #{_id.slice(-6)}
                </h1>

                <div className="flex flex-col md:flex-row gap-6 mb-8">
                    <div className="flex-1 space-y-6">
                        <div className="bg-gray-50 p-6 rounded-2xl shadow-sm">
                            <div className="flex items-center mb-4 text-emerald-700">
                                <FaUser className="mr-2 text-xl" />
                                <h2 className="text-xl font-semibold">
                                    Client
                                </h2>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Nom</span>
                                    <span className="font-medium">
                                        {client_id.nom}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Email</span>
                                    <span className="font-medium">
                                        {client_id.email}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">
                                        Téléphone
                                    </span>
                                    <span className="font-medium">
                                        {client_id.numero}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">
                                        Code Client
                                    </span>
                                    <span className="font-medium bg-emerald-50 px-3 py-1 rounded-full text-emerald-700">
                                        {code_Client}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-6 rounded-2xl shadow-sm">
                            <div className="flex items-center mb-4 text-emerald-700">
                                <FaStore className="mr-2 text-xl" />
                                <h2 className="text-xl font-semibold">
                                    Commerçant
                                </h2>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">
                                        Boutique
                                    </span>
                                    <span className="font-medium">
                                        {commercant_id.nom_boutique}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Email</span>
                                    <span className="font-medium">
                                        {commercant_id.email}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">
                                        Téléphone
                                    </span>
                                    <span className="font-medium">
                                        {commercant_id.numero}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">
                                        Code Commerçant
                                    </span>
                                    <span className="font-medium bg-blue-50 px-3 py-1 rounded-full text-blue-700">
                                        {code_Commercant}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 space-y-6">
                        <div className="bg-gray-50 p-6 rounded-2xl shadow-sm">
                            <div className="flex items-center mb-4 text-emerald-700">
                                <FaTruck className="mr-2 text-xl" />
                                <h2 className="text-xl font-semibold">
                                    Livreur
                                </h2>
                            </div>
                            {!livreur_id ? (
                                <div className="flex items-center justify-center h-32 bg-gray-100 rounded-xl">
                                    <p className="text-gray-500">
                                        Aucun livreur n'a été attribué
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">
                                            Nom
                                        </span>
                                        <span className="font-medium">
                                            {livreur_id.nom}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">
                                            Email
                                        </span>
                                        <span className="font-medium">
                                            {livreur_id.email}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">
                                            Téléphone
                                        </span>
                                        <span className="font-medium">
                                            {livreur_id.numero}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">
                                            Véhicule
                                        </span>
                                        <span className="font-medium">
                                            {livreur_id?.vehicule?.type &&
                                            livreur_id?.vehicule?.plaque
                                                ? `${livreur_id.vehicule.type} - ${livreur_id.vehicule.plaque}`
                                                : "Aucune information disponible"}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-gray-50 p-6 rounded-2xl shadow-sm">
                            <div className="flex items-center mb-4 text-emerald-700">
                                <FaMapMarkerAlt className="mr-2 text-xl" />
                                <h2 className="text-xl font-semibold">
                                    Adresse de Livraison
                                </h2>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Rue</span>
                                    <span className="font-medium">
                                        {adresse_livraison.rue}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Ville</span>
                                    <span className="font-medium">
                                        {adresse_livraison.ville}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">
                                        Code Postal
                                    </span>
                                    <span className="font-medium">
                                        {adresse_livraison.code_postal}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-emerald-50 p-6 rounded-2xl text-center">
                        <FaClock
                            className="text-emerald-600 mx-auto mb-3"
                            size={28}
                        />
                        <p className="font-semibold text-gray-700 mb-1">
                            Créée le
                        </p>
                        <p className="text-lg font-bold text-emerald-700">
                            {new Date(date_creation).toLocaleString()}
                        </p>
                    </div>
                    <div className="bg-emerald-50 p-6 rounded-2xl text-center">
                        <FaBarcode
                            className="text-emerald-600 mx-auto mb-3"
                            size={28}
                        />
                        <p className="font-semibold text-gray-700 mb-1">
                            Statut
                        </p>
                        <p className="text-lg font-bold text-emerald-700 capitalize">
                            {statut.replace(/_/g, " ")}
                        </p>
                    </div>
                    <div className="bg-emerald-50 p-6 rounded-2xl text-center">
                        <FaEuroSign
                            className="text-emerald-600 mx-auto mb-3"
                            size={28}
                        />
                        <p className="font-semibold text-gray-700 mb-1">
                            Total
                        </p>
                        <p className="text-lg font-bold text-emerald-700">
                            {total.toFixed(2)} €
                        </p>
                    </div>
                </div>

                <div className="flex justify-center pt-6">
                    {renderActionButtons()}
                </div>

                {/* Section d'avis pour le client */}
                {canReview && (
                    <div className="mt-12 space-y-8">
                        <h2 className="text-2xl font-semibold text-emerald-700 border-b border-emerald-200 pb-2 flex items-center">
                            <FaStar className="mr-2 text-yellow-500" />
                            Évaluations
                        </h2>

                        {/* Avis pour le commerçant */}
                        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-800 flex items-center">
                                    <FaStore className="mr-2 text-emerald-600" />
                                    Évaluer le commerçant
                                </h3>
                                {hasReviewedCommercant ? (
                                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                                        Avis déjà soumis
                                    </span>
                                ) : (
                                    <button
                                        onClick={() =>
                                            setShowCommercantReviewForm(
                                                !showCommercantReviewForm
                                            )
                                        }
                                        className="text-emerald-600 hover:text-emerald-800 font-medium flex items-center"
                                    >
                                        {showCommercantReviewForm ? (
                                            <>
                                                <FaTimes className="mr-1" />
                                                Annuler
                                            </>
                                        ) : (
                                            <>
                                                <FaStar className="mr-1 text-yellow-500" />
                                                Laisser un avis
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>

                            {showCommercantReviewForm &&
                                !hasReviewedCommercant && (
                                    <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                                        <ReviewForm
                                            targetId={commercant_id._id}
                                            targetType="commercant"
                                            commandeId={_id}
                                            onReviewSubmitted={() =>
                                                setShowCommercantReviewForm(
                                                    false
                                                )
                                            }
                                        />
                                    </div>
                                )}
                        </div>

                        {/* Avis pour le livreur (seulement si un livreur a été assigné) */}
                        {livreur_id && (
                            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-medium text-gray-800 flex items-center">
                                        <FaTruck className="mr-2 text-emerald-600" />
                                        Évaluer le livreur
                                    </h3>
                                    {hasReviewedLivreur ? (
                                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                                            Avis déjà soumis
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() =>
                                                setShowLivreurReviewForm(
                                                    !showLivreurReviewForm
                                                )
                                            }
                                            className="text-emerald-600 hover:text-emerald-800 font-medium flex items-center"
                                        >
                                            {showLivreurReviewForm ? (
                                                <>
                                                    <FaTimes className="mr-1" />
                                                    Annuler
                                                </>
                                            ) : (
                                                <>
                                                    <FaStar className="mr-1 text-yellow-500" />
                                                    Laisser un avis
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>

                                {showLivreurReviewForm &&
                                    !hasReviewedLivreur && (
                                        <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                                            <ReviewForm
                                                targetId={livreur_id._id}
                                                targetType="livreur"
                                                commandeId={_id}
                                                onReviewSubmitted={() =>
                                                    setShowLivreurReviewForm(
                                                        false
                                                    )
                                                }
                                            />
                                        </div>
                                    )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DetailCommande;
