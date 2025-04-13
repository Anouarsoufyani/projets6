"use client";
import {
    useGetCoords,
    useAuthUserQuery,
    useLivreurTracking,
} from "../../Hooks";
import { useEffect, useState, useRef, useCallback } from "react";
import { GoogleMap, Marker } from "@react-google-maps/api";
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
} from "react-icons/fa";
// Ajouter l'import pour le composant ReviewForm
import ReviewForm from "../../Components/Reviews/ReviewForm";

const containerStyle = {
    width: "100%",
    height: "100%",
    borderRadius: "0.75rem",
};

// Custom loading spinner component
const LoadingSpinner = () => (
    <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
        <div className="relative animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-600">
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-400 opacity-30"></div>
        </div>
        <p className="mt-4 text-emerald-700 font-medium">Loading...</p>
    </div>
);

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
    const intervalRef = useRef(null);
    const lastRouteCalculationRef = useRef(0);
    const [deliveryStatus, setDeliveryStatus] = useState("en_attente");

    // Utiliser un intervalle personnalisé au lieu du refresh automatique du hook
    const [refreshKey, setRefreshKey] = useState(0);

    // Utiliser le hook useLivreurTracking pour la position initiale (avec un intervalle de 15 secondes)
    const {
        livreurPosition,
        livreurStatus,
        isLoading: isLoadingLivreur,
    } = useLivreurTracking(id, 15000);

    // État local pour stocker la dernière position connue du livreur
    // const [currentLivreurPosition, setCurrentLivreurPosition] = useState(null)

    const queryClient = useQueryClient();

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

    // Fonction pour calculer l'itinéraire
    const calculateRoute = useCallback(async () => {
        if (!livreurPosition || !window.google || !mapRef.current) {
            return;
        }

        // Déterminer la destination en fonction du statut
        let destination;
        if (deliveryStatus === "prete_a_etre_recuperee" && coordsCommercant) {
            // Si le livreur doit récupérer la commande, la destination est le commerçant
            destination = {
                lat: coordsCommercant.lat,
                lng: coordsCommercant.lng,
            };
        } else if (coords) {
            // Sinon, la destination est le client
            destination = { lat: coords.lat, lng: coords.lng };
        } else {
            return; // Pas de destination valide
        }

        // Vérifier si les coordonnées sont valides
        if (
            isNaN(livreurPosition.lat) ||
            isNaN(destination.lat) ||
            isNaN(livreurPosition.lng) ||
            isNaN(destination.lng)
        ) {
            console.warn("Coordonnées invalides détectées");
            return;
        }

        try {
            // Créer un objet DirectionsService
            const directionsService =
                new window.google.maps.DirectionsService();

            // Exécuter le calcul d'itinéraire
            const results = await directionsService.route({
                origin: {
                    lat: livreurPosition.lat,
                    lng: livreurPosition.lng,
                },
                destination: destination,
                travelMode: window.google.maps.TravelMode.DRIVING,
            });

            // Extraire les informations
            setDistance(results.routes[0].legs[0].distance.text);
            setDuration(results.routes[0].legs[0].duration.text);

            // Créer DirectionsRenderer s'il n'existe pas
            if (!directionsRendererRef.current) {
                directionsRendererRef.current =
                    new window.google.maps.DirectionsRenderer({
                        map: mapRef.current,
                        suppressMarkers: true,
                        polylineOptions: {
                            strokeColor: "#10b981", // emerald-500
                            strokeWeight: 5,
                            strokeOpacity: 0.8,
                        },
                    });
            }

            // Afficher l'itinéraire sur la carte
            directionsRendererRef.current.setDirections(results);
        } catch (error) {
            console.error("Erreur lors du calcul de l'itinéraire:", error);
        }
    }, [livreurPosition, coords, coordsCommercant, deliveryStatus]);

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

    if (
        isLoading ||
        isLoadingLivreur ||
        isLoadingCoords ||
        isLoadingCoordsCommercant
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

    // Calculer le pourcentage de progression basé sur le temps écoulé
    const calculateProgressPercentage = () => {
        if (!duration) return 0;

        // Extraire les minutes à partir de la durée (ex: "15 mins")
        const durationMatch = duration.match(/(\d+)\s*mins?/);
        if (!durationMatch || !durationMatch[1]) return 0;

        const totalMinutes = Number.parseInt(durationMatch[1]);
        if (totalMinutes <= 0) return 100; // Si la durée est 0, on est arrivé

        // Estimer le temps déjà écoulé
        const minutesRemaining = (estimatedArrival - new Date()) / (1000 * 60);
        const minutesElapsed = totalMinutes - minutesRemaining;

        // Calculer le pourcentage (limité entre 0 et 100)
        const percentage = Math.max(
            0,
            Math.min(100, (minutesElapsed / totalMinutes) * 100)
        );
        return Math.round(percentage);
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
                    {commande?.data?.livreur_id?.vehicule && (
                        <div className="bg-white p-6 rounded-2xl shadow-md">
                            <h3 className="font-semibold text-emerald-800 mb-4 flex items-center">
                                <FaCar className="mr-2 text-emerald-600" />
                                Détails du Vehicule
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Type</span>
                                    <span className="font-medium">
                                        {commande.data.livreur_id.vehicule
                                            .type || "N/A"}
                                    </span>
                                </div>
                                {commande.data.livreur_id.vehicule.plaque && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">
                                            Plaque
                                        </span>
                                        <span className="font-medium">
                                            {
                                                commande.data.livreur_id
                                                    .vehicule.plaque
                                            }
                                        </span>
                                    </div>
                                )}
                                {commande.data.livreur_id.vehicule.couleur && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">
                                            Couleur
                                        </span>
                                        <span className="font-medium">
                                            {
                                                commande.data.livreur_id
                                                    .vehicule.couleur
                                            }
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

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
                                                <ReviewForm
                                                    targetId={
                                                        commande.data.livreur_id
                                                            ._id
                                                    }
                                                    targetType="livreur"
                                                    commandeId={
                                                        commande.data._id
                                                    }
                                                />
                                            </div>
                                        )}

                                        {/* Avis pour le commerçant */}
                                        <div className="bg-white p-6 rounded-2xl shadow-md">
                                            <h3 className="text-lg font-semibold text-emerald-700 mb-4 flex items-center">
                                                <FaStore className="mr-2 text-emerald-600" />
                                                Évaluer le commerçant
                                            </h3>
                                            <ReviewForm
                                                targetId={
                                                    commande.data.commercant_id
                                                        ._id
                                                }
                                                targetType="commercant"
                                                commandeId={commande.data._id}
                                            />
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
                                        url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                                        scaledSize: new window.google.maps.Size(
                                            40,
                                            40
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
                                        url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
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
                                        url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
                                        scaledSize: new window.google.maps.Size(
                                            40,
                                            40
                                        ),
                                    }}
                                    title="Commerçant"
                                />
                            )}
                        </GoogleMap>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CommandeSuivi;
