"use client";

import {
    useAuthUserQuery,
    useToggleActive,
    useDeliveryPosition,
    useGetLatestPendingCommande,
    useAssignLivreur,
    useGetUserById,
} from "../../Hooks";
import { GoogleMap, Marker, DirectionsRenderer } from "@react-google-maps/api";
import {
    StarRating,
    getAverageRating,
} from "../../Components/Reviews/ReviewDisplay";
import { FaStar, FaBell } from "react-icons/fa";
import { useGetReviewsForUser } from "../../Hooks";
import { useNavigate } from "react-router";
const containerStyle = {
    width: "100%",
    height: "100%",
};
import toast from "react-hot-toast";
import { Link } from "react-router";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

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

const DashboardPageLivreur = () => {
    const [selectedShop, setSelectedShop] = useState(null);
    const [directions, setDirections] = useState(null);
    const { data: authUser } = useAuthUserQuery();
    const { toggleActive, isToggleActive } = useToggleActive();
    const { data: commandeEnCours, isLoading } = useGetLatestPendingCommande();
    const { data: notifications, isLoading: isLoadingNotifications } = useQuery(
        {
            queryKey: ["notifications"],
            queryFn: getNotifications,
            retry: false,
            refetchInterval: 5000,
        }
    );

    const assignLivreur = useAssignLivreur();
    const getUserById = useGetUserById();

    const { position, loading, error } = useDeliveryPosition(
        authUser?.isWorking,
        authUser?._id,
        commandeEnCours?._id
    );

    // Récupérer les avis pour le livreur
    const { data: reviews } = useGetReviewsForUser(authUser?._id);
    const averageRating = getAverageRating(reviews);

    const [selectedVehicle, setSelectedVehicle] = useState("");
    const [showVehicleSelector, setShowVehicleSelector] = useState(false);

    const handleToggleActive = async () => {
        if (!authUser?._id) return;

        if (!authUser.isWorking) {
            // If starting to work, show vehicle selector
            setShowVehicleSelector(true);
        } else {
            // If stopping work, directly toggle and reset current vehicle
            try {
                // First update all vehicles to set current = false
                const updateVehicleRes = await fetch(`/api/user/update`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        _id: authUser._id,
                        isWorking: false,
                        disponibilite: false,
                    }),
                });

                if (!updateVehicleRes.ok) {
                    const errorData = await updateVehicleRes.json();
                    throw new Error(
                        errorData.error ||
                            "Erreur lors de la mise à jour du statut"
                    );
                }

                // Then toggle active status
                await toggleActive(authUser._id);
                setShowVehicleSelector(false);
                window.location.reload();
            } catch (error) {
                toast.error(error.message || "Une erreur est survenue");
            }
        }
    };

    const handleVehicleSelect = async () => {
        if (!selectedVehicle) {
            toast.error("Veuillez sélectionner un véhicule");
            return;
        }

        try {
            const updateVehicleRes = await fetch(
                `/api/user/vehicules/current`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        userId: authUser._id,
                        vehiculeId: selectedVehicle,
                    }),
                }
            );

            if (!updateVehicleRes.ok) {
                const errorData = await updateVehicleRes.json();
                throw new Error(
                    errorData.error || "Erreur lors de la mise à jour du statut"
                );
            }

            // Then toggle active status
            await toggleActive(authUser._id);
            setShowVehicleSelector(false);
            window.location.reload();
        } catch (error) {
            toast.error(error.message || "Une erreur est survenue");
        }
    };

    const showShopDirections = async (commandeId) => {
        try {
            // Get the commande details to extract commercant ID
            const commandeRes = await fetch(
                `/api/commandes/itineraire/${commandeId}`,
                {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                }
            );

            if (!commandeRes.ok) {
                throw new Error(
                    "Erreur lors de la récupération de la commande"
                );
            }

            const commande = await commandeRes.json();

            // Get the commercant details using the user ID
            const commercantRes = await fetch(
                `/api/user/${commande.data.commercant_id._id}`,
                {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                }
            );

            if (!commercantRes.ok) {
                throw new Error("Erreur lors de la récupération du commerçant");
            }
            console.log("commercantRes", commercantRes);

            const commercantData = await commercantRes.json();
            const commercant = commercantData.data;

            console.log("commercant", commercant);

            if (!commercant || !commercant.adresse_boutique) {
                toast.error("Adresse de la boutique non disponible");
                return;
            }

            setSelectedShop(commercant);

            // If we have the current position and shop coords, calculate directions
            if (
                position &&
                commercant.adresse_boutique.lat &&
                commercant.adresse_boutique.lng
            ) {
                const shopPosition = {
                    lat: commercant.adresse_boutique.lat,
                    lng: commercant.adresse_boutique.lng,
                };

                // Get directions using the Google Maps Directions Service
                const directionsService =
                    new window.google.maps.DirectionsService();

                directionsService.route(
                    {
                        origin: position,
                        destination: shopPosition,
                        travelMode: window.google.maps.TravelMode.DRIVING,
                    },
                    (result, status) => {
                        if (status === window.google.maps.DirectionsStatus.OK) {
                            setDirections(result);
                            toast.success(
                                "Itinéraire vers la boutique affiché"
                            );
                        } else {
                            toast.error("Impossible de calculer l'itinéraire");
                        }
                    }
                );
            } else if (
                !commercant.adresse_boutique.lat ||
                !commercant.adresse_boutique.lng
            ) {
                // If coordinates aren't directly available, try to geocode the address
                const addressString = `${commercant.adresse_boutique.rue}, ${commercant.adresse_boutique.code_postal} ${commercant.adresse_boutique.ville}`;

                // You mentioned useGetCoords hook, assuming it works like this:
                try {
                    const geocodeRes = await fetch(
                        `/api/geocode?address=${encodeURIComponent(
                            addressString
                        )}`,
                        {
                            method: "GET",
                        }
                    );

                    if (!geocodeRes.ok) {
                        throw new Error("Erreur de géocodage de l'adresse");
                    }

                    const coords = await geocodeRes.json();

                    if (coords && coords.lat && coords.lng) {
                        const shopPosition = {
                            lat: coords.lat,
                            lng: coords.lng,
                        };

                        // Get directions
                        const directionsService =
                            new window.google.maps.DirectionsService();

                        directionsService.route(
                            {
                                origin: position,
                                destination: shopPosition,
                                travelMode:
                                    window.google.maps.TravelMode.DRIVING,
                            },
                            (result, status) => {
                                if (
                                    status ===
                                    window.google.maps.DirectionsStatus.OK
                                ) {
                                    setDirections(result);
                                    toast.success(
                                        "Itinéraire vers la boutique affiché"
                                    );
                                } else {
                                    toast.error(
                                        "Impossible de calculer l'itinéraire"
                                    );
                                }
                            }
                        );
                    }
                } catch (error) {
                    toast.error(
                        "Erreur lors de la géolocalisation de l'adresse"
                    );
                }
            } else {
                toast.error("Position actuelle non disponible");
            }
        } catch (error) {
            toast.error(error.message || "Une erreur est survenue");
            console.error(error);
        }
    };

    // Function to clear directions and return to normal map view
    const clearDirections = () => {
        setDirections(null);
        setSelectedShop(null);
    };

    const navigate = useNavigate();

    if (commandeEnCours != null && !isLoading) {
        navigate(`/livraison/${commandeEnCours._id}`);
    }

    if (isLoadingNotifications) {
        return (
            <div className="w-full h-full p-6 flex flex-col">
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
                                    : authUser.isWorking
                                    ? "Arrêter de livrer"
                                    : "Commencer à livrer"}
                            </button>
                        </div>
                        {showVehicleSelector && (
                            <div className="mt-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                                <h3 className="text-lg font-semibold text-emerald-700 mb-3">
                                    Sélectionnez un véhicule
                                </h3>
                                {authUser.vehicules &&
                                authUser.vehicules.length > 0 ? (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                            {authUser.vehicules.map(
                                                (vehicule) => (
                                                    <div
                                                        key={vehicule._id}
                                                        onClick={() =>
                                                            setSelectedVehicle(
                                                                vehicule._id
                                                            )
                                                        }
                                                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                                            selectedVehicle ===
                                                            vehicule._id
                                                                ? "bg-emerald-100 border-emerald-500"
                                                                : "bg-white border-gray-200 hover:border-emerald-300"
                                                        }`}
                                                    >
                                                        <div className="flex items-center">
                                                            <div
                                                                className={`w-4 h-4 rounded-full mr-2 ${
                                                                    vehicule.statut ===
                                                                    "vérifié"
                                                                        ? "bg-green-500"
                                                                        : "bg-yellow-500"
                                                                }`}
                                                            ></div>
                                                            <span className="font-medium capitalize">
                                                                {vehicule.type}
                                                            </span>
                                                        </div>
                                                        {vehicule.plaque && (
                                                            <p className="text-sm text-gray-600 mt-1">
                                                                Plaque:{" "}
                                                                {
                                                                    vehicule.plaque
                                                                }
                                                            </p>
                                                        )}
                                                        {vehicule.couleur && (
                                                            <p className="text-sm text-gray-600">
                                                                Couleur:{" "}
                                                                {
                                                                    vehicule.couleur
                                                                }
                                                            </p>
                                                        )}
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Statut:{" "}
                                                            {vehicule.statut}
                                                        </p>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() =>
                                                    setShowVehicleSelector(
                                                        false
                                                    )
                                                }
                                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                                            >
                                                Annuler
                                            </button>
                                            <button
                                                onClick={handleVehicleSelect}
                                                disabled={
                                                    !selectedVehicle ||
                                                    authUser.vehicules.find(
                                                        (v) =>
                                                            v._id ===
                                                            selectedVehicle
                                                    )?.statut !== "vérifié"
                                                }
                                                className={`px-4 py-2 rounded-md transition ${
                                                    !selectedVehicle ||
                                                    authUser.vehicules.find(
                                                        (v) =>
                                                            v._id ===
                                                            selectedVehicle
                                                    )?.statut !== "vérifié"
                                                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                        : "bg-emerald-500 text-white hover:bg-emerald-600"
                                                }`}
                                            >
                                                Commencer à livrer
                                            </button>
                                        </div>
                                        {selectedVehicle &&
                                            authUser.vehicules.find(
                                                (v) => v._id === selectedVehicle
                                            )?.statut !== "vérifié" && (
                                                <p className="text-sm text-amber-600 mt-2">
                                                    Ce véhicule n'est pas encore
                                                    vérifié. Veuillez choisir un
                                                    véhicule vérifié ou
                                                    contacter un administrateur.
                                                </p>
                                            )}
                                    </>
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-gray-600 mb-3">
                                            Vous n'avez pas encore ajouté de
                                            véhicule.
                                        </p>
                                        <a
                                            href="/profile"
                                            className="text-emerald-600 hover:text-emerald-700 font-medium underline"
                                        >
                                            Ajouter un véhicule dans votre
                                            profil
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}
                        {commandeEnCours && (
                            <p className="text-center text-amber-600 mt-2">
                                Vous ne pouvez pas arrêter de livrer pendant une
                                commande en cours.
                            </p>
                        )}

                        {authUser.isWorking && (
                            <div className="w-full h-[500px] mt-4 relative">
                                {loading ? (
                                    <p className="text-gray-600">
                                        Chargement de la carte...
                                    </p>
                                ) : error ? (
                                    <p className="text-red-500">{error}</p>
                                ) : position ? (
                                    <>
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
                                            {/* Current position marker */}
                                            {/* <Marker
                                                position={position}
                                                icon={{
                                                    url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
                                                }}
                                            /> */}

                                            {/* Shop marker if we have a selected shop but no directions yet */}
                                            {selectedShop &&
                                                !directions &&
                                                selectedShop.adresse_boutique && (
                                                    <Marker
                                                        position={{
                                                            lat: selectedShop
                                                                .adresse_boutique
                                                                .lat,
                                                            lng: selectedShop
                                                                .adresse_boutique
                                                                .lng,
                                                        }}
                                                        icon={{
                                                            url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                                                        }}
                                                    />
                                                )}

                                            {/* Display directions if available */}
                                            {directions && (
                                                <DirectionsRenderer
                                                    directions={directions}
                                                    options={{
                                                        suppressMarkers: false,
                                                        polylineOptions: {
                                                            strokeColor:
                                                                "#4CAF50",
                                                            strokeWeight: 6,
                                                        },
                                                    }}
                                                />
                                            )}
                                        </GoogleMap>

                                        {/* Shop info and clear button when directions are shown */}
                                        {selectedShop && (
                                            <div className="absolute bottom-4 left-4 right-4 bg-white p-3 rounded-lg shadow-lg max-w-md mx-auto">
                                                <div className="flex justify-between items-center">
                                                    <h3 className="font-medium text-emerald-700">
                                                        {selectedShop.nom_etablissement ||
                                                            "Boutique"}
                                                    </h3>
                                                    <button
                                                        onClick={
                                                            clearDirections
                                                        }
                                                        className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded transition-colors"
                                                    >
                                                        Fermer
                                                    </button>
                                                </div>
                                                {selectedShop.adresse_boutique && (
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {
                                                            selectedShop
                                                                .adresse_boutique
                                                                .rue
                                                        }
                                                        ,{" "}
                                                        {
                                                            selectedShop
                                                                .adresse_boutique
                                                                .code_postal
                                                        }{" "}
                                                        {
                                                            selectedShop
                                                                .adresse_boutique
                                                                .ville
                                                        }
                                                    </p>
                                                )}
                                                {directions &&
                                                    directions.routes[0]
                                                        ?.legs[0] && (
                                                        <div className="mt-2 text-sm border-t pt-2 border-gray-100">
                                                            <p className="text-emerald-600 font-medium">
                                                                Distance:{" "}
                                                                {
                                                                    directions
                                                                        .routes[0]
                                                                        .legs[0]
                                                                        .distance
                                                                        .text
                                                                }
                                                            </p>
                                                            <p className="text-emerald-600 font-medium">
                                                                Durée estimée:{" "}
                                                                {
                                                                    directions
                                                                        .routes[0]
                                                                        .legs[0]
                                                                        .duration
                                                                        .text
                                                                }
                                                            </p>
                                                        </div>
                                                    )}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-gray-600">
                                        Impossible de récupérer votre position.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Affichage des notifications de demande de livraison */}
                    {notifications &&
                        notifications.notifications.length > 0 && (
                            <div className="bg-white p-6 rounded-lg shadow-lg">
                                <h2 className="text-xl font-semibold text-emerald-700 mb-4 border-b border-emerald-100 pb-2">
                                    Demandes de livraison
                                </h2>
                                <ul className="space-y-4">
                                    {notifications.notifications
                                        .filter(
                                            (notification) =>
                                                notification.isRequest
                                        )
                                        .map((notification) => (
                                            <li
                                                key={notification._id}
                                                className="flex items-center justify-between p-4 bg-gray-100 rounded-lg shadow-md"
                                            >
                                                {notification.isRequest &&
                                                    (notification.isAccepted &&
                                                    notification.commande_id
                                                        .livreur_id ==
                                                        authUser._id ? (
                                                        <>
                                                            <span className="mt-2 text-green-600">
                                                                Vous avez
                                                                accepté la
                                                                commande
                                                            </span>
                                                            <br />
                                                            <Link
                                                                to={`/livraison/${notification.commande_id._id}`}
                                                                className="text-emerald-600 underline hover:text-emerald-400 transition-all mt-2"
                                                            >
                                                                Suivi de la
                                                                commande
                                                            </Link>
                                                        </>
                                                    ) : notification.isRefused ? (
                                                        <span className="mt-2 text-red-600">
                                                            Vous avez refusé la
                                                            commande
                                                        </span>
                                                    ) : notification.commande_id &&
                                                      notification.commande_id
                                                          .livreur_id ==
                                                          authUser._id ? (
                                                        <>
                                                            <span className="mt-2 text-green-600">
                                                                Vous avez
                                                                accepté la
                                                                commande
                                                            </span>
                                                            <br />
                                                            <Link
                                                                to={`/livraison/${notification.commande_id._id}`}
                                                                className="text-emerald-600 underline hover:text-emerald-400 transition-all mt-2"
                                                            >
                                                                Suivi de la
                                                                commande
                                                            </Link>
                                                        </>
                                                    ) : notification.commande_id &&
                                                      notification.commande_id
                                                          .livreur_id ? (
                                                        <span className="mt-2 text-gray-600">
                                                            La commande a déjà
                                                            un livreur assigné
                                                        </span>
                                                    ) : (
                                                        <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full transition-all duration-200">
                                                            {/* Notification content */}
                                                            <div className="flex-1">
                                                                <span className="block text-gray-700 mb-1">
                                                                    {notification.message ? (
                                                                        notification.message
                                                                    ) : (
                                                                        <div className="flex items-center">
                                                                            <FaBell />

                                                                            <span className="ml-2">
                                                                                Demande
                                                                                de
                                                                                livraison
                                                                                de{" "}
                                                                                <span className="font-medium text-gray-900">
                                                                                    {notification
                                                                                        .sender
                                                                                        ?.nom ??
                                                                                        "Système"}
                                                                                </span>
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </span>

                                                                {/* Order details - can be expanded with more info */}
                                                                <div className="mt-1 text-sm text-gray-500">
                                                                    {notification
                                                                        .commande_id
                                                                        ?.details && (
                                                                        <p>
                                                                            Adresse:{" "}
                                                                            {notification
                                                                                .commande_id
                                                                                .details
                                                                                .address ||
                                                                                "Non spécifiée"}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Action buttons */}
                                                            <div className="flex gap-2 mt-2 sm:mt-0">
                                                                <button
                                                                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                                                    onClick={() =>
                                                                        showShopDirections(
                                                                            notification
                                                                                .commande_id
                                                                                ._id
                                                                        )
                                                                    }
                                                                >
                                                                    Voir
                                                                </button>
                                                                <button
                                                                    className="bg-emerald-500 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded"
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
                                                        </div>
                                                    ))}
                                            </li>
                                        ))}
                                </ul>
                            </div>
                        )}

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
