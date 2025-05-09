"use client";

import { FaStar, FaRegStar } from "react-icons/fa";
import { useAuthUserQuery } from "../../Hooks/useAuthQueries";
import useToggleActive from "../../Hooks/useToggleActive";

import { GoogleMap, Marker } from "@react-google-maps/api";
import PropTypes from "prop-types";
import useDeliveryPosition from "../../Hooks/useDeliveryPosition";
import { useGetUserCommandes } from "../../Hooks/useGetCommandes";


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

const containerStyle = {
    width: "100%",
    height: "100%",
    borderRadius: "8px",
};

const getAverageRating = (reviews) => {
    if (!reviews.length) return 0;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / reviews.length).toFixed(1);
};

const StarRating = ({ rating }) => (
    <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
            <span key={i}>
                {i < rating ? (
                    <FaStar className="text-yellow-500" />
                ) : (
                    <FaRegStar className="text-gray-300" />
                )}
            </span>
        ))}
    </div>
);

StarRating.propTypes = {
    rating: PropTypes.number.isRequired,
};

const ReviewCard = ({ review }) => (
    <div className="bg-white p-4 rounded-lg shadow-md mb-4">
        <div className="flex items-center justify-between">
            <h3 className="font-semibold text-emerald-700">{review.name}</h3>
            <span className="text-sm text-gray-500">{review.date}</span>
        </div>
        <StarRating rating={review.rating} />
        <p className="text-gray-700 mt-2">{review.comment}</p>
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

const DashboardPage = () => {
    const { data: authUser } = useAuthUserQuery();
    const { toggleActive, isToggleActive } = useToggleActive();
    const { data: commandesData } = useGetUserCommandes();
    const commandeEnCours = commandesData?.commandes?.find(
        (cmd) => cmd.statut === "en_livraison"
    );
    const { position, loading, error } = useDeliveryPosition(
        authUser?.isWorking,
        authUser?._id,
        commandeEnCours?._id
    );

    const handleToggleActive = async () => {
        if (!authUser?._id) return;
        await toggleActive(authUser._id);
        window.location.reload();
    };

    return (
        <div className="w-full h-full bg-gray-100 p-6">
            <h1 className="text-2xl font-bold text-emerald-700 mb-6">
                Bienvenue {authUser.nom}
            </h1>

            {authUser?.role === "livreur" ? (
                <div
                    className={
                        authUser.isWorking
                            ? " h-9/10 flex flex-col gap-4 bg-white p-6 rounded-lg shadow-lg mb-6 text-center"
                            : "flex flex-col gap-4 bg-white p-6 rounded-lg shadow-lg mb-6 text-center"
                    }
                >
                    <div className="flex justify-center items-center">
                        <button
                            onClick={() => {
                                handleToggleActive();
                            }}
                            disabled={isToggleActive}
                            className={`${
                                isToggleActive
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-emerald-500 hover:bg-emerald-700"
                            } text-white font-bold py-2 px-6 rounded-full shadow-md transition duration-300`}
                        >
                            {isToggleActive
                                ? "Activation..."
                                : authUser.isWorking
                                ? "Arrêter de livrer"
                                : "Commencer à livrer"}
                        </button>
                    </div>

                    {authUser.isWorking && (
                        <div className="w-full h-full">
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
            ) : (
                <>
                    <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
                        <h2 className="text-lg font-semibold text-emerald-800 mb-2">
                            Note Globale
                        </h2>
                        <div className="flex items-center text-2xl font-bold text-yellow-500">
                            {getAverageRating(fakeReviews)}
                            <span className="ml-2">
                                <StarRating
                                    rating={Math.round(
                                        getAverageRating(fakeReviews)
                                    )}
                                />
                            </span>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h2 className="text-lg font-semibold text-emerald-800 mb-4">
                            Avis des Clients
                        </h2>
                        {fakeReviews.map((review) => (
                            <ReviewCard key={review.id} review={review} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default DashboardPage;
