"use client";
import {
    useGetCoords,
    useAuthUserQuery,
    useLivreurTracking,
} from "../../Hooks";
import { useEffect, useState, useRef, useCallback } from "react";
import {
    GoogleMap,
    Marker,
    DirectionsRenderer,
    Polyline,
} from "@react-google-maps/api";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
    FaArrowLeft,
    FaRoute,
    FaClock,
    FaShippingFast,
    FaCheck,
    FaUser,
    FaStore,
    FaTruck,
    FaBox,
    FaCar,
    FaExclamationTriangle,
    FaTimes,
    FaMotorcycle,
    FaBiking,
} from "react-icons/fa";
// Ajouter l'import pour le composant ReviewForm et useGetUserReviews
import ReviewForm from "../../Components/Reviews/ReviewForm";
import LoadingSpinner from "../../Components/UI/Loading";
import { useGetUserReviews } from "../../Hooks/queries/useGetReviews";

const containerStyle = {
    width: "100%",
    height: "100%",
    borderRadius: "0.75rem",
};



const CommandeSuivi = () => {
    const { data: authUser } = useAuthUserQuery();
    const { id } = useParams();
    const navigate = useNavigate();
    const [mapInitialized, setMapInitialized] = useState(false);
    const [mapCenter, setMapCenter] = useState(null);
    const [commercantCode, setCommercantCode] = useState("");
    const [clientCode, setClientCode] = useState("");
    const [distance, setDistance] = useState(null);
    const [duration, setDuration] = useState(null);
    const mapRef = useRef(null);
    const directionsRendererRef = useRef(null);
    const [directions, setDirections] = useState(null);
    const intervalRef = useRef(null);
    const lastRouteCalculationRef = useRef(0);
    const [deliveryStatus, setDeliveryStatus] = useState("en_attente");
    const [showLivreurProblemModal, setShowLivreurProblemModal] =
        useState(false);
    const [showClientProblemModal, setShowClientProblemModal] = useState(false);
    const [selectedProblem, setSelectedProblem] = useState("");
    const [problemDescription, setProblemDescription] = useState("");

    // Utiliser un intervalle personnalisé au lieu du refresh automatique du hook
    const [refreshKey, setRefreshKey] = useState(0);

    // Utiliser le hook useLivreurTracking pour la position initiale (avec un intervalle de 15 secondes)
    const {
        livreurPosition,
        livreurStatus,
        isLoading: isLoadingLivreur,
    } = useLivreurTracking(id, 15000);

    // Récupérer les avis de l'utilisateur pour vérifier s'il a déjà laissé un avis
    const { data: userReviews, isLoading: isLoadingReviews } =
        useGetUserReviews();

    const queryClient = useQueryClient();

    const livreurProblems = [
        "Adresse introuvable ou incorrecte",
        "Client injoignable",
        "Problème avec le véhicule (panne, crevaison)",
        "Commande endommagée ou incomplète",
        "Temps d'attente trop long au point de retrait",
        "Accident ou blessure pendant la livraison",
        "Accès impossible (porte bloquée, code erroné, barrière fermée)",
        "Comportement agressif ou menaçant d'un client",
    ];

    const clientProblems = [
        "Commande non livrée",
        "Commande incomplète ou erronée",
        "Produit endommagé ou renversé",
        "Retard de livraison important",
        "Livreur impoli ou comportement inapproprié",
        "Article manquant ou remplacé sans consentement",
        "Article manquant ou remplacé sans consentement",
    ];

    // Récupérer les données de la commande
    const { data: commande, isLoading } = useQuery({
        queryKey: ["getCommande", id],
        queryFn: async () => {
            try {
                const res = await fetch(`/api/commandes/${id}`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                });

                const data = await res.json();

                if (data.error || !res.ok) {
                    throw new Error(data.error || "Erreur lors du chargement");
                }

                return data;
            } catch (error) {
                toast.error(error.message);
                if (error.message === "Forbidden : Access denied") {
                    window.location.href = "/commandes";
                }
                throw error;
            }
        },
        retry: false,
        refetchInterval: 5000, // Rafraîchir toutes les 5 secondes
    });

    // Vérifier si l'utilisateur a déjà laissé un avis pour le livreur et le commerçant
    const [hasReviewedLivreur, setHasReviewedLivreur] = useState(false);
    const [hasReviewedCommercant, setHasReviewedCommercant] = useState(false);

    useEffect(() => {
        if (userReviews && commande?.data) {
            // Vérifier si l'utilisateur a déjà laissé un avis pour le livreur
            if (commande.data.livreur_id) {
                const reviewedLivreur = userReviews.some(
                    (review) =>
                        review.targetId === commande.data.livreur_id._id &&
                        review.commandeId === commande.data._id
                );
                setHasReviewedLivreur(reviewedLivreur);
            }

            // Vérifier si l'utilisateur a déjà laissé un avis pour le commerçant
            if (commande.data.commercant_id) {
                const reviewedCommercant = userReviews.some(
                    (review) =>
                        review.targetId === commande.data.commercant_id._id &&
                        review.commandeId === commande.data._id
                );
                setHasReviewedCommercant(reviewedCommercant);
            }
        }
    }, [userReviews, commande]);

    // Mutation pour valider le code commerçant
    const validateCommercantMutation = useMutation({
        mutationFn: async (code) => {
            const res = await fetch(
                `/api/commandes/code/validationCommercant`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id, code }),
                }
            );

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erreur de validation");
            return data;
        },
        onSuccess: () => {
            toast.success("Commande récupérée avec succès!");
            setCommercantCode("");
            // Invalider les requêtes pour forcer un rafraîchissement
            queryClient.invalidateQueries({ queryKey: ["getCommande", id] });
            queryClient.invalidateQueries({ queryKey: ["getUserCommandes"] });
        },
        onError: (error) => {
            toast.error(error.message || "Code invalide");
        },
    });

    // Mutation pour valider le code client
    const validateClientMutation = useMutation({
        mutationFn: async (code) => {
            const res = await fetch(`/api/commandes/code/validationClient`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, code }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erreur de validation");
            return data;
        },
        onSuccess: () => {
            toast.success("Livraison confirmée avec succès!");
            setClientCode("");
            // Invalider les requêtes pour forcer un rafraîchissement
            queryClient.invalidateQueries({ queryKey: ["getCommande", id] });
            queryClient.invalidateQueries({ queryKey: ["getUserCommandes"] });
        },
        onError: (error) => {
            toast.error(error.message || "Code invalide");
        },
    });

    const reportProblemMutation = useMutation({
        mutationFn: async (problemData) => {
            const res = await fetch(`/api/commandes/problems`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    commandeId: id,
                    problem: problemData.problem,
                    description: problemData.description,
                    reportedBy: problemData.reportedBy,
                }),
            });

            const data = await res.json();
            if (!res.ok)
                throw new Error(data.error || "Erreur lors du signalement");
            return data;
        },
        onSuccess: () => {
            toast.success("Problème signalé avec succès!");
            setSelectedProblem("");
            setProblemDescription("");
            setShowLivreurProblemModal(false);
            setShowClientProblemModal(false);
            // Invalider les requêtes pour forcer un rafraîchissement
            queryClient.invalidateQueries({ queryKey: ["getCommande", id] });
        },
        onError: (error) => {
            toast.error(
                error.message || "Erreur lors du signalement du problème"
            );
        },
    });

    // Avoir la geolocalisation exacte grâce à l'adresse
    const adresseClient = commande?.data?.adresse_livraison
        ? `${commande.data.adresse_livraison.rue}, ${commande.data.adresse_livraison.ville}, ${commande.data.adresse_livraison.code_postal}`
        : "";
    const adresseCommercant = commande?.data?.commercant_id?.adresse_boutique
        ? `${commande.data.commercant_id.adresse_boutique.rue}, ${commande.data.commercant_id.adresse_boutique.ville}, ${commande.data.commercant_id.adresse_boutique.code_postal}`
        : "";

    const { data: coordsCommercant, isLoading: isLoadingCoordsCommercant } =
        useGetCoords(adresseCommercant);

    const { data: coords, isLoading: isLoadingCoords } =
        useGetCoords(adresseClient);

    // Refactored calculateRoute function to use DirectionsRenderer properly
    const calculateRoute = useCallback(async () => {
        if (!livreurPosition || !window.google || !mapRef.current) {
            return;
        }

        // Determine the destination based on status
        let destination;
        let travelMode = window.google.maps.TravelMode.DRIVING;

        if (deliveryStatus === "prete_a_etre_recuperee" && coordsCommercant) {
            // If the livreur must pick up the order, the destination is the merchant
            destination = {
                lat: coordsCommercant.lat,
                lng: coordsCommercant.lng,
            };
        } else if (coords) {
            // Otherwise, the destination is the client
            destination = { lat: coords.lat, lng: coords.lng };
        } else {
            return; // No valid destination
        }

        // Check if coordinates are valid
        if (
            isNaN(livreurPosition.lat) ||
            isNaN(destination.lat) ||
            isNaN(livreurPosition.lng) ||
            isNaN(destination.lng)
        ) {
            console.warn("Invalid coordinates detected");
            return;
        }

        try {
            // Get the livreur's vehicle type to determine travel mode
            let vehicleType = "voiture"; // Default

            if (commande?.data?.livreur_id?.vehicules) {
                // First check for current vehicle
                const currentVehicle = commande.data.livreur_id.vehicules.find(
                    (v) => v.current
                );
                if (currentVehicle) {
                    vehicleType = currentVehicle.type.toLowerCase();
                } else if (commande.data.livreur_id.vehicule?.type) {
                    vehicleType =
                        commande.data.livreur_id.vehicule.type.toLowerCase();
                }

                // Set appropriate travel mode based on vehicle type
                if (vehicleType === "vélo") {
                    travelMode = window.google.maps.TravelMode.BICYCLING;
                } else if (vehicleType === "autres") {
                    travelMode = window.google.maps.TravelMode.WALKING;
                }
            }

            // Get directions using the Google Maps Directions Service
            const directionsService =
                new window.google.maps.DirectionsService();

            directionsService.route(
                {
                    origin: {
                        lat: livreurPosition.lat,
                        lng: livreurPosition.lng,
                    },
                    destination: destination,
                    travelMode: travelMode,
                    avoidHighways: vehicleType === "vélo",
                    avoidTolls: vehicleType === "vélo",
                },
                (result, status) => {
                    if (status === window.google.maps.DirectionsStatus.OK) {
                        // Extract information
                        setDistance(result.routes[0].legs[0].distance.text);
                        setDuration(result.routes[0].legs[0].duration.text);

                        // Store the directions result for rendering
                        setDirections(result);
                    } else {
                        console.error("Error calculating route:", status);
                        toast.error("Impossible de calculer l'itinéraire");
                    }
                }
            );
        } catch (error) {
            console.error("Error calculating route:", error);
            toast.error("Erreur lors du calcul de l'itinéraire");
        }
    }, [
        livreurPosition,
        coords,
        coordsCommercant,
        deliveryStatus,
        commande?.data?.livreur_id,
    ]);

    // Add a clearDirections function:
    const clearDirections = () => {
        setDirections(null);
    };

    // Add a cleanup function to remove the directions renderer when component unmounts
    useEffect(() => {
        return () => {
            if (directionsRendererRef.current) {
                directionsRendererRef.current.setMap(null);
            }
        };
    }, []);

    // Mettre à jour l'itinéraire lorsque la position du livreur change
    useEffect(() => {
        if (livreurPosition && mapRef.current) {
            calculateRoute();
        }
    }, [livreurPosition, calculateRoute]);

    // Initialiser la carte et le centre une seule fois
    useEffect(() => {
        if (!mapInitialized && coords && coords.lat && coords.lng) {
            setMapCenter({ lat: coords.lat, lng: coords.lng });
            setMapInitialized(true);
        }
    }, [coords, mapInitialized]);

    // Gérer le chargement de la carte
    const handleMapLoad = useCallback(
        (map) => {
            mapRef.current = map;

            // Si nous avons déjà les positions, calculer l'itinéraire
            if (livreurPosition && coords) {
                calculateRoute();
            }
        },
        [calculateRoute, livreurPosition, coords]
    );

    // Gérer la soumission du code commerçant
    const handleCommercantCodeSubmit = (e) => {
        e.preventDefault();
        if (commercantCode.trim()) {
            validateCommercantMutation.mutate(commercantCode);
        } else {
            toast.error("Veuillez entrer un code");
        }
    };

    // Gérer la soumission du code client
    const handleClientCodeSubmit = (e) => {
        e.preventDefault();
        if (clientCode.trim()) {
            validateClientMutation.mutate(clientCode);
        } else {
            toast.error("Veuillez entrer un code");
        }
    };

    const handleProblemSubmit = (reportedBy) => {
        if (!selectedProblem) {
            toast.error("Veuillez sélectionner un problème");
            return;
        }

        reportProblemMutation.mutate({
            problem: selectedProblem,
            description: problemDescription,
            reportedBy,
        });
    };

    useEffect(() => {
        if (livreurStatus && livreurStatus.status) {
            setDeliveryStatus(livreurStatus.status);
        }
    }, [livreurStatus]);

    // Mettre à jour le statut de livraison quand la commande change
    useEffect(() => {
        if (commande?.data?.statut) {
            setDeliveryStatus(commande.data.statut);
        }
    }, [commande]);

    // Callback pour rafraîchir les avis après soumission
    const handleReviewSubmitted = () => {
        queryClient.invalidateQueries({ queryKey: ["getUserReviews"] });
    };

    // Get vehicle type for styling the route
    const getVehicleType = () => {
        if (!commande?.data?.livreur_id) return "voiture"; // Default

        // Check for current vehicle in vehicules array
        if (
            commande.data.livreur_id.vehicules &&
            Array.isArray(commande.data.livreur_id.vehicules)
        ) {
            const currentVehicle = commande.data.livreur_id.vehicules.find(
                (v) => v.current
            );
            if (currentVehicle) {
                return currentVehicle.type.toLowerCase();
            }
        }

        // Fallback to vehicule object
        if (commande.data.livreur_id.vehicule?.type) {
            return commande.data.livreur_id.vehicule.type.toLowerCase();
        }

        return "voiture"; // Default fallback
    };

    // Get route color based on vehicle type
    const getRouteColor = () => {
        const vehicleType = getVehicleType();

        switch (vehicleType) {
            case "vélo":
                return "#10b981"; // Green for bikes
            case "moto":
                return "#3b82f6"; // Blue for motorcycles
            case "voiture":
                return "#f59e0b"; // Amber for cars
            default:
                return "#8b5cf6"; // Purple for others
        }
    };

    if (
        isLoading ||
        isLoadingLivreur ||
        isLoadingCoords ||
        isLoadingCoordsCommercant ||
        isLoadingReviews
    ) {
        return <LoadingSpinner />;
    }

    // Calculer l'heure d'arrivée estimée en fonction de la durée réelle
    const estimatedArrival = new Date();
    if (duration) {
        // Parse duration like "15 mins" to minutes
        const durationMatch = duration.match(/(\d+)\s*mins?/);
        if (durationMatch && durationMatch[1]) {
            estimatedArrival.setMinutes(
                estimatedArrival.getMinutes() +
                    Number.parseInt(durationMatch[1])
            );
        } else {
            // Fallback to 15 minutes if parsing fails
            estimatedArrival.setMinutes(estimatedArrival.getMinutes() + 15);
        }
    } else {
        // Default 15 minutes if no duration available
        estimatedArrival.setMinutes(estimatedArrival.getMinutes() + 15);
    }

    const formattedArrival = estimatedArrival.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });

    // Calculate the percentage of progress based on elapsed time and distance
    const calculateProgressPercentage = () => {
        if (!distance || !duration) return 0;

        // Extract minutes from the duration (e.g., "15 mins")
        const durationMatch = duration.match(/(\d+)\s*mins?/);
        if (!durationMatch || !durationMatch[1]) return 0;

        const totalMinutes = Number.parseInt(durationMatch[1]);
        if (totalMinutes <= 0) return 100; // If duration is 0, we've arrived

        // Extract distance in meters
        const distanceMatch = distance.match(/(\d+(?:\.\d+)?)\s*(km|m)/);
        if (!distanceMatch) return 0;

        const distanceValue = Number.parseFloat(distanceMatch[1]);
        const distanceUnit = distanceMatch[2];

        // Convert to meters
        const distanceInMeters =
            distanceUnit === "km" ? distanceValue * 1000 : distanceValue;

        // If we have the itinerary data, calculate progress based on actual distance traveled
        if (
            commande?.data?.itineraire_parcouru_client &&
            commande.data.itineraire_parcouru_client.length > 0
        ) {
            // Calculate total distance of the route
            let totalDistance = 0;
            let traveledDistance = 0;

            // This is a simplified calculation - in a real app, you'd use the Google Maps Distance Matrix API
            // to get more accurate distances along the route
            const lastPoint =
                commande.data.itineraire_parcouru_client[
                    commande.data.itineraire_parcouru_client.length - 1
                ].position;

            // Calculate remaining distance to destination
            const remainingDistance =
                getDirectDistance(
                    lastPoint.lat,
                    lastPoint.lng,
                    coords.lat,
                    coords.lng
                ) * 1000; // Convert km to meters

            // Estimate total distance as traveled + remaining
            totalDistance = distanceInMeters;
            traveledDistance = totalDistance - remainingDistance;

            // Calculate percentage
            const percentage = Math.max(
                0,
                Math.min(100, (traveledDistance / totalDistance) * 100)
            );
            return Math.round(percentage);
        }

        // Fallback to time-based estimation
        const minutesRemaining = (estimatedArrival - new Date()) / (1000 * 60);
        const minutesElapsed = totalMinutes - minutesRemaining;

        // Calculate percentage (limited between 0 and 100)
        const percentage = Math.max(
            0,
            Math.min(100, (minutesElapsed / totalMinutes) * 100)
        );
        return Math.round(percentage);
    };

    // Add this helper function for direct distance calculation
    const getDirectDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Radius of the Earth in km
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) *
                Math.cos((lat2 * Math.PI) / 180) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in km
    };

    // Vérifier si nous avons les coordonnées nécessaires
    const hasValidCoordinates =
        livreurPosition && coords && coords.lat && coords.lng;

    // Vérifier si l'utilisateur est le livreur assigné à cette commande
    const isAssignedClient =
        authUser &&
        commande?.data?.client_id &&
        authUser._id === commande.data.client_id._id;

    const isAssignedCommercant =
        authUser &&
        commande?.data?.commercant_id &&
        authUser._id === commande.data.commercant_id._id;

    const isAssignedLivreur =
        authUser &&
        commande?.data?.livreur_id &&
        authUser._id === commande.data.livreur_id._id;

    // Déterminer l'étape actuelle de la livraison
    const canConfirmPickup =
        isAssignedLivreur && deliveryStatus === "prete_a_etre_recuperee";
    const canConfirmDelivery =
        isAssignedLivreur && deliveryStatus === "recuperee_par_livreur";

    // Fonction pour obtenir la couleur du statut
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

    // Function to create path points from itinerary data
    const createPathFromItinerary = (itinerary) => {
        if (!itinerary || !Array.isArray(itinerary) || itinerary.length === 0) {
            return [];
        }

        return itinerary.map((point) => ({
            lat: point.position.lat,
            lng: point.position.lng,
        }));
    };

    return (
        <div className="w-full min-h-full bg-gradient-to-br from-emerald-50 to-teal-100 p-4 md:p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-emerald-700 hover:text-emerald-900 transition-colors"
                >
                    <FaArrowLeft className="mr-2" />
                    <span>Retour</span>
                </button>

                <h1 className="text-2xl font-bold text-emerald-700">
                    Suivi de livraison
                </h1>

                <div className="flex items-center">
                    <span
                        className={`px-4 py-2 rounded-full text-sm font-medium inline-flex items-center ${getStatusColor(
                            deliveryStatus
                        )}`}
                    >
                        <span
                            className="w-2 h-2 rounded-full mr-2"
                            style={{
                                backgroundColor:
                                    deliveryStatus === "livree"
                                        ? "#10b981"
                                        : deliveryStatus === "en_livraison"
                                        ? "#3b82f6"
                                        : deliveryStatus ===
                                          "recuperee_par_livreur"
                                        ? "#8b5cf6"
                                        : deliveryStatus ===
                                          "prete_a_etre_recuperee"
                                        ? "#ec4899"
                                        : "#f59e0b",
                            }}
                        ></span>
                        {deliveryStatus.replace(/_/g, " ")}
                    </span>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row flex-1 gap-6">
                <div className="w-full lg:w-1/3 space-y-6">
                    {/* Livreur info */}
                    <div className="bg-white p-6 rounded-2xl shadow-md">
                        <h3 className="font-semibold text-emerald-800 mb-4 flex items-center">
                            <FaTruck className="mr-2 text-emerald-600" />
                            Votre livreur
                        </h3>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                <img
                                    src={
                                        commande?.data?.livreur_id
                                            ?.profilePic ||
                                        "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                                    }
                                    alt="Livreur"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div>
                                <p className="text-emerald-700 text-lg font-semibold">
                                    {commande?.data?.livreur_id?.nom ||
                                        "Livreur non assigné"}
                                </p>
                                <p className="text-sm text-gray-600">
                                    ID :{" "}
                                    {commande?.data?.livreur_id?._id?.slice(
                                        -6
                                    ) || "N/A"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Vehicle info */}
                    {commande?.data?.livreur_id?.vehicules ? (
    <div className="bg-white p-6 rounded-2xl shadow-md">
        <h3 className="font-semibold text-emerald-800 mb-4 flex items-center">
            <FaCar className="mr-2 text-emerald-600" />
            Détails du Vehicule
        </h3>
        <div className="space-y-3">
            {/* Get current vehicle from the array or fallback to vehicule object */}
            {(() => {
                // First try to find the current vehicle in the vehicules array
                if (commande?.data?.livreur_id?.vehicules && Array.isArray(commande.data.livreur_id.vehicules)) {
                    const currentVehicle = commande.data.livreur_id.vehicules.find(v => v.current);
                    if (currentVehicle) {
                        return (
                            <>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Type</span>
                                    <span className="font-medium flex items-center gap-1">
                                        {currentVehicle.type?.toLowerCase() === "voiture" ? (
                                            <FaCar className="text-blue-600" />
                                        ) : currentVehicle.type?.toLowerCase() === "moto" ? (
                                            <FaMotorcycle className="text-red-600" />
                                        ) : currentVehicle.type?.toLowerCase() === "vélo" ? (
                                            <FaBiking className="text-green-600" />
                                        ) : (
                                            <FaBox className="text-purple-600" />
                                        )}
                                        {currentVehicle.type || "N/A"}
                                    </span>
                                </div>
                                {currentVehicle.modele && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Modèle</span>
                                        <span className="font-medium">{currentVehicle.modele}</span>
                                    </div>
                                )}
                                {currentVehicle.plaque && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Plaque</span>
                                        <span className="font-medium">{currentVehicle.plaque}</span>
                                    </div>
                                )}
                                {currentVehicle.couleur && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Couleur</span>
                                        <span className="font-medium flex items-center gap-1">
                                            <span
                                                className="inline-block w-3 h-3 rounded-full"
                                                style={{ backgroundColor: currentVehicle.couleur }}
                                            ></span>
                                            {currentVehicle.couleur}
                                        </span>
                                    </div>
                                )}
                                {currentVehicle.capacite && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Capacité</span>
                                        <span className="font-medium">{currentVehicle.capacite} kg</span>
                                    </div>
                                )}
                            </>
                        );
                    }
                }
                

                
                // No vehicle data available
                return (
                    <div className="flex justify-center items-center text-gray-500">
                        Aucune information de véhicule disponible
                    </div>
                );
            })()}
        </div>
    </div>
) : null}

                    {/* Commande info */}
                    {commande && (
                        <div className="bg-white p-6 rounded-2xl shadow-md">
                            <h3 className="font-semibold text-emerald-800 mb-4 flex items-center">
                                <FaBox className="mr-2 text-emerald-600" />
                                Détails de la Commande
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">
                                        ID Commande
                                    </span>
                                    <span className="font-medium">
                                        {commande.data._id?.slice(-6) || "N/A"}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">
                                        Client
                                    </span>
                                    <span className="font-medium">
                                        {commande.data.client_id?.nom || "N/A"}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">
                                        Boutique
                                    </span>
                                    <span className="font-medium">
                                        {commande.data.commercant_id
                                            ?.nom_boutique || "N/A"}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Total</span>
                                    <span className="font-medium">
                                        {commande.data.total
                                            ? `${commande.data.total} €`
                                            : "N/A"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Delivery status with actual distance and duration */}
                    {commande.data.statut === "livree" ? (
                        <div>
                            {isAssignedClient && (
                                <div className="space-y-6">
                                    <div className="p-6 bg-green-50 rounded-2xl shadow-md text-center">
                                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <FaCheck className="text-green-600 text-2xl" />
                                        </div>
                                        <h3 className="font-semibold text-green-800 mb-2 text-xl">
                                            Commande livrée avec succès
                                        </h3>
                                        <p className="text-green-700">
                                            Merci d'avoir utilisé notre service.
                                            Nous espérons vous revoir bientôt !
                                        </p>
                                    </div>

                                    {/* Section d'avis pour le client */}
                                    <div className="grid grid-cols-1 gap-3">
                                        {/* Avis pour le livreur */}
                                        {commande.data.livreur_id && (
                                            <div className="bg-white p-6 rounded-2xl shadow-md">
                                                <h3 className="text-lg font-semibold text-emerald-700 mb-4 flex items-center">
                                                    <FaTruck className="mr-2 text-emerald-600" />
                                                    Évaluer le livreur
                                                </h3>
                                                {hasReviewedLivreur ? (
                                                    <div className="bg-green-50 p-4 rounded-lg text-center">
                                                        <p className="text-green-700">
                                                            Vous avez déjà
                                                            évalué ce livreur.
                                                        </p>
                                                        <p className="text-green-600 text-sm mt-1">
                                                            Merci pour votre
                                                            avis !
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <ReviewForm
                                                        targetId={
                                                            commande.data
                                                                .livreur_id._id
                                                        }
                                                        targetType="livreur"
                                                        commandeId={
                                                            commande.data._id
                                                        }
                                                        onReviewSubmitted={
                                                            handleReviewSubmitted
                                                        }
                                                    />
                                                )}
                                            </div>
                                        )}

                                        {/* Avis pour le commerçant */}
                                        <div className="bg-white p-6 rounded-2xl shadow-md">
                                            <h3 className="text-lg font-semibold text-emerald-700 mb-4 flex items-center">
                                                <FaStore className="mr-2 text-emerald-600" />
                                                Évaluer le commerçant
                                            </h3>
                                            {hasReviewedCommercant ? (
                                                <div className="bg-green-50 p-4 rounded-lg text-center">
                                                    <p className="text-green-700">
                                                        Vous avez déjà évalué ce
                                                        commerçant.
                                                    </p>
                                                    <p className="text-green-600 text-sm mt-1">
                                                        Merci pour votre avis !
                                                    </p>
                                                </div>
                                            ) : (
                                                <ReviewForm
                                                    targetId={
                                                        commande.data
                                                            .commercant_id._id
                                                    }
                                                    targetType="commercant"
                                                    commandeId={
                                                        commande.data._id
                                                    }
                                                    onReviewSubmitted={
                                                        handleReviewSubmitted
                                                    }
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {!isAssignedClient && (
                                <div className="p-6 bg-green-50 rounded-2xl shadow-md text-center">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FaCheck className="text-green-600 text-2xl" />
                                    </div>
                                    <h3 className="font-semibold text-green-800 mb-2 text-xl">
                                        Commande livrée avec succès
                                    </h3>
                                    <p className="text-green-700">
                                        Merci d'avoir utilisé notre service.
                                        Nous espérons vous revoir bientôt !
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Bloc d'information sur le statut de livraison */}
                            <div className="bg-white p-6 rounded-2xl shadow-md">
                                <h3 className="font-semibold text-emerald-800 mb-4 flex items-center">
                                    <FaShippingFast className="mr-2 text-emerald-600" />
                                    Statut de la livraison
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-emerald-700 font-medium">
                                            {deliveryStatus === "en_livraison"
                                                ? "En cours de livraison"
                                                : deliveryStatus ===
                                                  "commande_prise"
                                                ? "Commande récupérée"
                                                : deliveryStatus ===
                                                  "en_route_vers_commercant"
                                                ? "En route vers le commerçant"
                                                : deliveryStatus === "arrive"
                                                ? "Arrivé à destination"
                                                : "En route"}
                                        </p>
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                                deliveryStatus
                                            )}`}
                                        >
                                            {deliveryStatus.replace(/_/g, " ")}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm">
                                        <FaClock className="text-blue-600" />
                                        <span className="text-gray-600">
                                            Arrivée estimée:
                                        </span>
                                        <span className="font-medium">
                                            {formattedArrival}
                                        </span>
                                    </div>

                                    {distance && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <FaRoute className="text-blue-600" />
                                            <span className="text-gray-600">
                                                Distance:
                                            </span>
                                            <span className="font-medium">
                                                {distance}
                                            </span>
                                        </div>
                                    )}

                                    {duration && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <FaClock className="text-blue-600" />
                                            <span className="text-gray-600">
                                                Durée estimée:
                                            </span>
                                            <span className="font-medium">
                                                {duration}
                                            </span>
                                        </div>
                                    )}

                                    <div className="mt-4">
                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                            <span>Départ</span>
                                            <span>Arrivée</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div
                                                className="bg-emerald-600 h-2.5 rounded-full"
                                                style={{
                                                    width: `${calculateProgressPercentage()}%`,
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {isAssignedLivreur && (
                                <div className="space-y-4 mt-4">
                                    {canConfirmPickup && (
                                        <div className="bg-white p-6 rounded-2xl shadow-md">
                                            <h3 className="font-semibold text-amber-800 mb-4 flex items-center">
                                                <FaStore className="mr-2 text-amber-600" />
                                                Confirmer la prise de commande
                                            </h3>
                                            <form
                                                onSubmit={
                                                    handleCommercantCodeSubmit
                                                }
                                                className="space-y-3"
                                            >
                                                <div className="flex flex-col">
                                                    <label
                                                        htmlFor="commercant-code"
                                                        className="text-sm text-gray-600 mb-1"
                                                    >
                                                        Code commerçant
                                                    </label>
                                                    <input
                                                        id="commercant-code"
                                                        type="text"
                                                        value={commercantCode}
                                                        onChange={(e) =>
                                                            setCommercantCode(
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="Entrez le code"
                                                        className="p-3 border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                                                    />
                                                </div>
                                                <button
                                                    type="submit"
                                                    disabled={
                                                        validateCommercantMutation.isPending
                                                    }
                                                    className="w-full bg-amber-500 text-white px-4 py-3 rounded-xl hover:bg-amber-600 transition-colors disabled:bg-amber-300 flex items-center justify-center gap-2"
                                                >
                                                    <FaCheck className="text-white" />
                                                    {validateCommercantMutation.isPending
                                                        ? "Validation..."
                                                        : "Valider le code"}
                                                </button>
                                            </form>
                                        </div>
                                    )}

                                    {canConfirmDelivery && (
                                        <div className="bg-white p-6 rounded-2xl shadow-md">
                                            <h3 className="font-semibold text-green-800 mb-4 flex items-center">
                                                <FaUser className="mr-2 text-green-600" />
                                                Confirmer la livraison
                                            </h3>
                                            <form
                                                onSubmit={
                                                    handleClientCodeSubmit
                                                }
                                                className="space-y-3"
                                            >
                                                <div className="flex flex-col">
                                                    <label
                                                        htmlFor="client-code"
                                                        className="text-sm text-gray-600 mb-1"
                                                    >
                                                        Code client
                                                    </label>
                                                    <input
                                                        id="client-code"
                                                        type="text"
                                                        value={clientCode}
                                                        onChange={(e) =>
                                                            setClientCode(
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="Entrez le code"
                                                        className="p-3 border border-green-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                                                    />
                                                </div>
                                                <button
                                                    type="submit"
                                                    disabled={
                                                        validateClientMutation.isPending
                                                    }
                                                    className="w-full bg-green-500 text-white px-4 py-3 rounded-xl hover:bg-green-600 transition-colors disabled:bg-green-300 flex items-center justify-center gap-2"
                                                >
                                                    <FaCheck className="text-white" />
                                                    {validateClientMutation.isPending
                                                        ? "Validation..."
                                                        : "Valider le code"}
                                                </button>
                                            </form>
                                        </div>
                                    )}
                                    {isAssignedLivreur &&
                                        deliveryStatus !== "livree" && (
                                            <div className="bg-white p-6 rounded-2xl shadow-md">
                                                <h3 className="font-semibold text-red-800 mb-4 flex items-center">
                                                    <FaExclamationTriangle className="mr-2 text-red-600" />
                                                    Signaler un problème
                                                </h3>
                                                <button
                                                    onClick={() =>
                                                        setShowLivreurProblemModal(
                                                            true
                                                        )
                                                    }
                                                    className="w-full bg-red-500 text-white px-4 py-3 rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <FaExclamationTriangle className="text-white" />
                                                    Signaler un problème
                                                </button>
                                            </div>
                                        )}
                                </div>
                            )}

                            {isAssignedCommercant &&
                                deliveryStatus === "prete_a_etre_recuperee" && (
                                    <div className="bg-white p-6 rounded-2xl shadow-md">
                                        <h3 className="font-semibold text-amber-800 mb-4 flex items-center">
                                            <FaStore className="mr-2 text-amber-600" />
                                            Code commerçant
                                        </h3>
                                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                                            <div className="text-center mb-2">
                                                <span className="text-2xl font-bold text-amber-700">
                                                    {
                                                        commande.data
                                                            .code_Commercant
                                                    }
                                                </span>
                                            </div>
                                            <p className="text-amber-600 text-sm">
                                                ⚠️ Veuillez remettre ce code au
                                                livreur lorsque la commande est
                                                prise en main.
                                            </p>
                                        </div>
                                    </div>
                                )}

                            {isAssignedCommercant &&
                                deliveryStatus === "recuperee_par_livreur" && (
                                    <div className="bg-white p-6 rounded-2xl shadow-md">
                                        <h3 className="font-semibold text-green-800 mb-4 flex items-center">
                                            <FaCheck className="mr-2 text-green-600" />
                                            Code commerçant remis
                                        </h3>
                                        <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                                            <p className="text-green-600 text-sm flex items-center">
                                                <FaCheck className="mr-2 text-green-600" />
                                                Le code a bien été donné au
                                                livreur.
                                            </p>
                                        </div>
                                    </div>
                                )}

                            {isAssignedClient && (
                                <div className="bg-white p-6 rounded-2xl shadow-md">
                                    <h3 className="font-semibold text-amber-800 mb-4 flex items-center">
                                        <FaUser className="mr-2 text-amber-600" />
                                        Code client
                                    </h3>
                                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                                        <div className="text-center mb-2">
                                            <span className="text-2xl font-bold text-amber-700">
                                                {commande.data.code_Client}
                                            </span>
                                        </div>
                                        <p className="text-amber-600 text-sm">
                                            ⚠️ Veuillez remettre ce code au
                                            livreur lorsque la commande est
                                            livrée.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {isAssignedClient &&
                                deliveryStatus !== "livree" && (
                                    <div className="bg-white p-6 rounded-2xl shadow-md mt-4">
                                        <h3 className="font-semibold text-red-800 mb-4 flex items-center">
                                            <FaExclamationTriangle className="mr-2 text-red-600" />
                                            Signaler un problème
                                        </h3>
                                        <button
                                            onClick={() =>
                                                setShowClientProblemModal(true)
                                            }
                                            className="w-full bg-red-500 text-white px-4 py-3 rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <FaExclamationTriangle className="text-white" />
                                            Signaler un problème
                                        </button>
                                    </div>
                                )}
                        </>
                    )}
                </div>

                <div className="w-full lg:w-2/3 shadow-xl rounded-2xl overflow-hidden mt-4 lg:mt-0 h-[500px] lg:h-auto">
                    {!hasValidCoordinates ? (
                        <div className="flex items-center justify-center h-full bg-gray-100">
                            <p className="text-gray-500">
                                En attente des coordonnées de livraison...
                            </p>
                        </div>
                    ) : (
                        <GoogleMap
                            mapContainerStyle={containerStyle}
                            center={mapCenter}
                            zoom={13}
                            options={{
                                mapTypeControl: false,
                                streetViewControl: false,
                                fullscreenControl: true,
                                zoomControl: true,
                                styles: [
                                    {
                                        featureType: "poi",
                                        elementType: "labels",
                                        stylers: [{ visibility: "off" }],
                                    },
                                ],
                            }}
                            onLoad={handleMapLoad}
                        >
                            {/* Marqueur pour le livreur */}
                            {livreurPosition && (
                                <Marker
                                    position={{
                                        lat: livreurPosition.lat,
                                        lng: livreurPosition.lng,
                                    }}
                                    icon={{
                                        url: "/images/livreur.png",
                                        scaledSize: new window.google.maps.Size(
                                            30,
                                            30
                                        ),
                                    }}
                                    title="Livreur en déplacement"
                                />
                            )}

                            {/* Marqueur pour la destination (client) */}
                            {coords && (
                                <Marker
                                    position={{
                                        lat: coords.lat,
                                        lng: coords.lng,
                                    }}
                                    icon={{
                                        url: "/images/client.png",
                                        scaledSize: new window.google.maps.Size(
                                            40,
                                            40
                                        ),
                                    }}
                                    title="Destination (Client)"
                                />
                            )}

                            {/* Marqueur pour le commerçant */}
                            {coordsCommercant && (
                                <Marker
                                    position={{
                                        lat: coordsCommercant.lat,
                                        lng: coordsCommercant.lng,
                                    }}
                                    icon={{
                                        url: "/images/commercant.png",
                                        scaledSize: new window.google.maps.Size(
                                            30,
                                            30
                                        ),
                                    }}
                                    title="Commerçant"
                                />
                            )}

                            {/* Use DirectionsRenderer for active routes */}
                            {directions && deliveryStatus !== "livree" && (
                                <DirectionsRenderer
                                    directions={directions}
                                    options={{
                                        suppressMarkers: true,
                                        suppressBicyclingLayer: true,
                                        polylineOptions: {
                                            strokeColor: getRouteColor(),
                                            strokeWeight: 5,
                                            strokeOpacity: 0.8,
                                        },
                                    }}
                                />
                            )}

                            {/* Display completed itineraries when order is delivered */}
                            {commande.data.statut === "livree" && (
                                <>
                                    {/* Path from livreur to merchant (orange) */}
                                    {commande.data
                                        .itineraire_parcouru_commercant &&
                                        commande.data
                                            .itineraire_parcouru_commercant
                                            .length > 1 && (
                                            <Polyline
                                                path={createPathFromItinerary(
                                                    commande.data
                                                        .itineraire_parcouru_commercant
                                                )}
                                                options={{
                                                    strokeColor: "#FF8C00", // Orange
                                                    strokeOpacity: 0.8,
                                                    strokeWeight: 5,
                                                }}
                                            />
                                        )}

                                    {/* Path from merchant to client (blue) */}
                                    {commande.data.itineraire_parcouru_client &&
                                        commande.data.itineraire_parcouru_client
                                            .length > 1 && (
                                            <Polyline
                                                path={createPathFromItinerary(
                                                    commande.data
                                                        .itineraire_parcouru_client
                                                )}
                                                options={{
                                                    strokeColor: "#3b82f6", // Blue
                                                    strokeOpacity: 0.8,
                                                    strokeWeight: 5,
                                                }}
                                            />
                                        )}
                                </>
                            )}
                        </GoogleMap>
                    )}
                </div>
            </div>
            {/* Modal pour les problèmes du livreur */}
            {showLivreurProblemModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
                        <button
                            onClick={() => {
                                setShowLivreurProblemModal(false);
                                setSelectedProblem("");
                                setProblemDescription("");
                            }}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                        >
                            <FaTimes className="text-xl" />
                        </button>

                        <h3 className="text-xl font-bold text-red-700 mb-4 flex items-center">
                            <FaExclamationTriangle className="mr-2" />
                            Signaler un problème
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Type de problème
                                </label>
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                    {livreurProblems.map((problem, index) => (
                                        <div
                                            key={index}
                                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                                selectedProblem === problem
                                                    ? "border-red-500 bg-red-50"
                                                    : "border-gray-200 hover:border-red-300 hover:bg-red-50"
                                            }`}
                                            onClick={() =>
                                                setSelectedProblem(problem)
                                            }
                                        >
                                            <p className="text-sm">{problem}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor="problem-description"
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                    Description (optionnelle)
                                </label>
                                <textarea
                                    id="problem-description"
                                    rows={3}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                    placeholder="Décrivez le problème plus en détail..."
                                    value={problemDescription}
                                    onChange={(e) =>
                                        setProblemDescription(e.target.value)
                                    }
                                />
                            </div>

                            <button
                                onClick={() => handleProblemSubmit("livreur")}
                                disabled={
                                    !selectedProblem ||
                                    reportProblemMutation.isPending
                                }
                                className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-300 flex items-center justify-center gap-2"
                            >
                                {reportProblemMutation.isPending
                                    ? "Envoi en cours..."
                                    : "Envoyer le signalement"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal pour les problèmes du client */}
            {showClientProblemModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
                        <button
                            onClick={() => {
                                setShowClientProblemModal(false);
                                setSelectedProblem("");
                                setProblemDescription("");
                            }}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                        >
                            <FaTimes className="text-xl" />
                        </button>

                        <h3 className="text-xl font-bold text-red-700 mb-4 flex items-center">
                            <FaExclamationTriangle className="mr-2" />
                            Signaler un problème
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Type de problème
                                </label>
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                    {clientProblems.map((problem, index) => (
                                        <div
                                            key={index}
                                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                                selectedProblem === problem
                                                    ? "border-red-500 bg-red-50"
                                                    : "border-gray-200 hover:border-red-300 hover:bg-red-50"
                                            }`}
                                            onClick={() =>
                                                setSelectedProblem(problem)
                                            }
                                        >
                                            <p className="text-sm">{problem}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor="problem-description-client"
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                    Description (optionnelle)
                                </label>
                                <textarea
                                    id="problem-description-client"
                                    rows={3}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                    placeholder="Décrivez le problème plus en détail..."
                                    value={problemDescription}
                                    onChange={(e) =>
                                        setProblemDescription(e.target.value)
                                    }
                                />
                            </div>

                            <button
                                onClick={() => handleProblemSubmit("client")}
                                disabled={
                                    !selectedProblem ||
                                    reportProblemMutation.isPending
                                }
                                className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-300 flex items-center justify-center gap-2"
                            >
                                {reportProblemMutation.isPending
                                    ? "Envoi en cours..."
                                    : "Envoyer le signalement"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommandeSuivi;
