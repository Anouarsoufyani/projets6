"use client";

import {
    useAuthUserQuery,
    useToggleActive,
    useDeliveryPosition,
    useGetLatestPendingCommande,
} from "../../Hooks";
import { GoogleMap, Marker } from "@react-google-maps/api";
import {
    StarRating,
    getAverageRating,
} from "../../Components/Reviews/ReviewDisplay";
import { FaStar } from "react-icons/fa";
import { useGetReviewsForUser } from "../../Hooks/queries/useGetReviews";
import { useNavigate } from "react-router";
const containerStyle = {
    width: "100%",
    height: "100%",
};

const DashboardPageLivreur = () => {
    const { data: authUser } = useAuthUserQuery();
    const { toggleActive, isToggleActive } = useToggleActive();
    const { data: commandeEnCours, isLoading } = useGetLatestPendingCommande();
    console.log(commandeEnCours);

    const { position, loading, error } = useDeliveryPosition(
        authUser?.disponibilite,
        authUser?._id,
        commandeEnCours?._id
    );

    // Récupérer les avis pour le livreur
    const { data: reviews } = useGetReviewsForUser(authUser?._id);
    const averageRating = getAverageRating(reviews);

    const handleToggleActive = async () => {
        if (!authUser?._id) return;
        await toggleActive(authUser._id);
        window.location.reload();
    };

    const navigate = useNavigate();

    if (commandeEnCours && !isLoading) {
        navigate(`/livraison/${commandeEnCours._id}`);
    }

    return (
        <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-teal-100 p-6">
            {authUser?.statut !== "vérifié" ? (
                <div className="flex flex-col gap-4 bg-white p-6 rounded-lg shadow-lg mb-6 text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-6">
                        Compte non vérifié
                    </h1>
                    <p className="text-gray-700">
                        Votre compte n'est pas encore vérifié. Veuillez
                        soumettre vos pièces justificatives pour finaliser votre
                        inscription, ou patienter pendant la vérification par un
                        administrateur.
                        <br />
                        <br />
                        <a
                            href="justificative"
                            className="text-emerald-700 font-bold underline"
                        >
                            Suivez votre statut ici
                        </a>
                    </p>
                </div>
            ) : (
                <>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                        <h1 className="text-2xl font-bold text-emerald-700">
                            Bienvenue {authUser.nom}
                        </h1>

                        {/* Affichage de la note moyenne */}
                        <div className="bg-white px-4 py-2 rounded-lg shadow-md flex items-center gap-3 mt-2 md:mt-0">
                            <FaStar className="text-yellow-500 h-6 w-6" />
                            <div>
                                <div className="flex items-center">
                                    <span className="text-xl font-bold text-gray-800 mr-2">
                                        {authUser.note_moyenne}
                                    </span>
                                    <StarRating
                                        rating={Math.round(averageRating)}
                                    />
                                </div>
                                <p className="text-xs text-gray-500">
                                    {reviews?.length || 0} avis client
                                    {reviews?.length !== 1 ? "s" : ""}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div
                        className={`flex flex-col gap-4 bg-white p-6 rounded-lg shadow-lg mb-6`}
                    >
                        <div className="flex justify-center items-center">
                            <button
                                onClick={() => {
                                    handleToggleActive();
                                }}
                                disabled={isToggleActive || commandeEnCours}
                                className={`${
                                    isToggleActive || commandeEnCours
                                        ? "bg-gray-400 cursor-not-allowed"
                                        : "bg-emerald-500 hover:bg-emerald-700"
                                } text-white font-bold py-2 px-6 rounded-full shadow-md transition duration-300`}
                            >
                                {isToggleActive
                                    ? "Activation..."
                                    : commandeEnCours
                                    ? "Livraison en cours"
                                    : authUser.disponibilite
                                    ? "Arrêter de livrer"
                                    : "Commencer à livrer"}
                            </button>
                        </div>
                        {commandeEnCours && (
                            <p className="text-center text-amber-600 mt-2">
                                Vous ne pouvez pas arrêter de livrer pendant une
                                commande en cours.
                            </p>
                        )}

                        {authUser.disponibilite && (
                            <div className="w-full h-[500px] mt-4">
                                {loading ? (
                                    <p className="text-gray-600">
                                        Chargement de la carte...
                                    </p>
                                ) : error ? (
                                    <p className="text-red-500">{error}</p>
                                ) : position ? (
                                    <GoogleMap
                                        mapContainerStyle={containerStyle}
                                        center={position}
                                        zoom={13}
                                        options={{
                                            mapTypeControl: false,
                                            streetViewControl: false,
                                            fullscreenControl: true,
                                            zoomControl: true,
                                        }}
                                    >
                                        <Marker
                                            position={position}
                                            icon={{
                                                url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
                                            }}
                                        />
                                    </GoogleMap>
                                ) : (
                                    <p className="text-gray-600">
                                        Impossible de récupérer votre position.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Affichage des derniers avis reçus */}
                    {reviews && reviews.length > 0 && (
                        <div className="bg-white p-6 rounded-lg shadow-lg">
                            <h2 className="text-xl font-semibold text-emerald-700 mb-4 border-b border-emerald-100 pb-2">
                                Derniers avis reçus
                            </h2>
                            <div className="space-y-4">
                                {reviews.slice(0, 3).map((review) => (
                                    <div
                                        key={review._id}
                                        className="bg-gray-50 p-4 rounded-lg border-l-4 border-emerald-400"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center">
                                                    <StarRating
                                                        rating={review.rating}
                                                    />
                                                    <span className="ml-2 text-sm text-gray-500">
                                                        {new Date(
                                                            review.createdAt
                                                        ).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="mt-2 text-gray-700">
                                                    {review.comment}
                                                </p>
                                            </div>
                                            <div className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                                                Commande #
                                                {review.commandeId.slice(-6)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {reviews.length > 3 && (
                                    <div className="text-center mt-4">
                                        <button className="text-emerald-600 hover:text-emerald-800 font-medium text-sm">
                                            Voir tous les avis ({reviews.length}
                                            )
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default DashboardPageLivreur;
