"use client";
import { useGetCoords } from "../../Hooks/useGetCoords";
import { useEffect, useState } from "react";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuthUserQuery } from "../../Hooks/useAuthQueries";
import toast from "react-hot-toast";
import useLivreurTracking from "../../Hooks/useLivreurTracking";
import useGoogleMapDirections from "../../Hooks/useGoogleMapDirections";

const containerStyle = {
    width: "100%",
    height: "100%",
    borderRadius: "8px",
};

// Custom loading spinner component
const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
    </div>
);

const CommandeSuivi = () => {
    const { data: authUser } = useAuthUserQuery();
    console.log("authUser", authUser.role);

    const { id } = useParams();

    // Utiliser le hook useLivreurTracking pour suivre la position du livreur
    const { livreurPosition, livreurStatus, isLoading: isLoadingLivreur } = useLivreurTracking(id);

    // Utiliser notre hook personnalisé pour les directions
    const { 
        distance, 
        duration, 
        calculateRoute, 
        onMapLoad 
    } = useGoogleMapDirections({
        strokeColor: "#10b981", // emerald-500
        strokeWeight: 5,
        strokeOpacity: 0.8,
        suppressMarkers: true
    });

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

                if (data.error === "Forbidden : Access denied") {
                    // Redirection dans le frontend
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
    });

    const livreur = commande?.data?.livreur_id || {};
    
    // Utiliser la position du livreur depuis le tracking
    const livreurCoords = livreurPosition ? 
        [livreurPosition.lat, livreurPosition.lng] : 
        [48.8466, 2.3622]; // position par défaut si non disponible

    // Avoir la geolocalisation exacte grâce à l'adresse
    const adresseClient = commande?.data?.adresse_livraison?.rue +
        ", " +
        commande?.data?.adresse_livraison?.ville +
        ", " +
        commande?.data?.adresse_livraison?.code_postal;
    
    const coords = useGetCoords(adresseClient);
    const adresseLivraison = [coords?.data?.lat, coords?.data?.lng];
    
    const fetchLivreurPosition = async () => {
        // Simuler une position aléatoire proche de Paris
        const newPosition = {
            lat: livreurPosition.lat + (Math.random() * 0.02 - 0.01),
            lng: livreurPosition.lng + (Math.random() * 0.02 - 0.01)
        };
        // Mettre à jour l'état avec la nouvelle position
        setLivreurPosition(newPosition);
    };

    // Déclare l'état pour la position du livreur
    const [livreurCoordsState, setLivreurPosition] = useState({
        lat: livreurCoords[0],
        lng: livreurCoords[1],
    });

    // Mise à jour automatique de la position du livreur toutes les 5 secondes
    useEffect(() => {
        const interval = setInterval(() => {
            fetchLivreurPosition();
        }, 3000); // Rafraîchir toutes les 5 secondes

        return () => clearInterval(interval);
    }, [livreurPosition]); // Assurez-vous de mettre à jour correctement lors du changement

    // Update route when positions change
    useEffect(() => {
        if (livreurCoordsState.lat && adresseLivraison[0]) {
            calculateRoute(
                { lat: livreurCoordsState.lat, lng: livreurCoordsState.lng },
                { lat: adresseLivraison[0], lng: adresseLivraison[1] }
            );
        }
    }, [livreurCoordsState, adresseLivraison]);

    if (isLoading || isLoadingLivreur) {
        return <LoadingSpinner />;
    }

    // Calculer l'heure d'arrivée estimée en fonction de la durée réelle
    const estimatedArrival = new Date();
    if (duration) {
        // Parse duration like "15 mins" to minutes
        const durationMatch = duration.match(/(\d+)\s*mins?/);
        if (durationMatch && durationMatch[1]) {
            estimatedArrival.setMinutes(
                estimatedArrival.getMinutes() + Number.parseInt(durationMatch[1])
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
        // Si le livreur a déjà parcouru une partie du chemin
        const minutesRemaining = (estimatedArrival - new Date()) / (1000 * 60);
        const minutesElapsed = totalMinutes - minutesRemaining;
        
        // Calculer le pourcentage (limité entre 0 et 100)
        const percentage = Math.max(0, Math.min(100, (minutesElapsed / totalMinutes) * 100));
        return Math.round(percentage);
    };

    return (
        <div className="w-full min-h-full bg-gray-50 p-4 md:p-6 flex flex-col">
            <h1 className="text-2xl font-bold text-emerald-700 mb-6">
                Livraison - Suivi en temps réel
            </h1>

            <div className="flex flex-col lg:flex-row flex-1 gap-6">
                <div className="w-full lg:w-1/3 bg-white p-4 md:p-6 rounded-lg shadow-md">
                    
                    <h2 className="text-lg font-semibold text-emerald-800 mb-4">
                        Détails de la Livraison
                    </h2>
                    <div className="overflow-auto h-full space-y-6">
                        {/* Livreur info */}
                        <div className="p-4 bg-emerald-50 rounded-lg">
                            <h3 className="font-medium text-emerald-800 mb-2">
                                Votre livreur
                            </h3>
                            <div className="flex items-center gap-3">
                                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                    <img
                                        src={
                                            livreur.profilePic ||
                                            "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                                        }
                                        alt="Livreur"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div>
                                    <p className="text-emerald-700 text-lg font-semibold">
                                        {livreur.nom || "Livreur non assigné"}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        ID : {livreur._id?.slice(-6) || "N/A"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Vehicle info */}
                        {livreur.vehicule && (
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <h3 className="font-medium text-gray-800 mb-2">
                                    Détails du Vehicule
                                </h3>
                                <ul className="space-y-2 text-gray-700">
                                    <li className="flex justify-between">
                                        <span className="text-gray-600">
                                            Type:
                                        </span>
                                        <span className="font-medium">
                                            {livreur.vehicule.type || "N/A"}
                                        </span>
                                    </li>
                                    {livreur.vehicule.plaque && (
                                        <li className="flex justify-between">
                                            <span className="text-gray-600">
                                                Plaque:
                                            </span>
                                            <span className="font-medium">
                                                {livreur.vehicule.plaque}
                                            </span>
                                        </li>
                                    )}
                                    {livreur.vehicule.couleur && (
                                        <li className="flex justify-between">
                                            <span className="text-gray-600">
                                                Couleur:
                                            </span>
                                            <span className="font-medium">
                                                {livreur.vehicule.couleur}
                                            </span>
                                        </li>
                                    )}
                                </ul>
                            </div>
                        )}

                        {/* Commande info */}
                        {commande && (
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <h3 className="font-medium text-gray-800 mb-2">
                                    Détails de la Commande
                                </h3>
                                <ul className="space-y-2 text-gray-700">
                                    <li className="flex justify-between">
                                        <span className="text-gray-600">
                                            ID Commande:
                                        </span>
                                        <span className="font-medium">
                                            {commande.data._id || "N/A"}
                                        </span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span className="text-gray-600">
                                            Nom Client:
                                        </span>
                                        <span className="font-medium">
                                            {commande.data.client_id.nom ||
                                                "N/A"}
                                        </span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span className="text-gray-600">
                                            Nom Boutique:
                                        </span>
                                        <span className="font-medium">
                                            {commande.data.commercant_id
                                                .nom_boutique || "N/A"}
                                        </span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span className="text-gray-600">
                                            Adresse Boutique:
                                        </span>
                                        <span className="font-medium">
                                            {commande.data.commercant_id
                                                .adresse_boutique.rue +
                                                ", " +
                                                commande.data.commercant_id
                                                    .adresse_boutique.ville +
                                                ", " +
                                                commande.data.commercant_id
                                                    .adresse_boutique
                                                    .code_postal || "N/A"}
                                        </span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span className="text-gray-600">
                                            Total:
                                        </span>
                                        <span className="font-medium">
                                            {commande.data.total
                                                ? `${commande.data.total} €`
                                                : "N/A"}
                                        </span>
                                    </li>
                                    {commande.data.adresse_livraison && (
                                        <li className="flex justify-between">
                                            <span className="text-gray-600">
                                                Adresse Client:
                                            </span>
                                            <span className="font-medium">
                                                {
                                                    commande.data
                                                        .adresse_livraison.rue
                                                }
                                                ,{" "}
                                                {
                                                    commande.data
                                                        .adresse_livraison.ville
                                                }
                                                ,{" "}
                                                {
                                                    commande.data
                                                        .adresse_livraison
                                                        .code_postal
                                                }
                                            </span>
                                        </li>
                                    )}
                                </ul>
                            </div>
                        )}
                         {/* Delivery status with actual distance and duration */}
                         <div className="p-4 bg-blue-50 rounded-lg">
                            <h3 className="font-medium text-blue-800 mb-2">
                                Statut
                            </h3>
                            <div className="space-y-2">
                                <p className="text-blue-700 font-medium">
                                    {livreurStatus?.status === "en_livraison" 
                                        ? "En cours de livraison" 
                                        : livreurStatus?.status === "commande_prise" 
                                            ? "Commande récupérée" 
                                            : livreurStatus?.status === "en_route_vers_commercant" 
                                                ? "En route vers le commerçant" 
                                                : livreurStatus?.status === "arrive" 
                                                    ? "Arrivé à destination" 
                                                    : "En route"}
                                </p>
                                <p className="text-sm text-gray-600">
                                    Arrivée estimée:{" "}
                                    <span className="font-medium">
                                        {formattedArrival}
                                    </span>
                                </p>
                                {distance && (
                                    <p className="text-sm text-gray-600">
                                        Distance:{" "}
                                        <span className="font-medium">
                                            {distance}
                                        </span>
                                    </p>
                                )}
                                {duration && (
                                    <p className="text-sm text-gray-600">
                                        Durée estimée:{" "}
                                        <span className="font-medium">
                                            {duration}
                                        </span>
                                    </p>
                                )}
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                                    <div 
                                        className="bg-blue-600 h-2.5 rounded-full" 
                                        style={{ 
                                            width: `${calculateProgressPercentage()}%` 
                                        }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full lg:w-2/3 shadow-xl rounded-lg overflow-hidden mt-4 lg:mt-0">
                    <GoogleMap
                        mapContainerStyle={containerStyle}
                        center={{
                            lat: adresseLivraison[0],
                            lng: adresseLivraison[1],
                        }}
                        zoom={13}
                        options={{
                            mapTypeControl: false,
                            streetViewControl: false,
                            fullscreenControl: true,
                            zoomControl: true,
                        }}
                        onLoad={onMapLoad}
                    >
                        {/* Marqueur pour le livreur */}
                        <Marker
                            position={{
                                lat: livreurCoordsState.lat,
                                lng: livreurCoordsState.lng,
                            }}
                            icon={{
                                url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                            }}
                            title="Livreur en déplacement"
                        />

                        {/* Marqueur pour la destination */}
                        <Marker
                            position={{
                                lat: adresseLivraison[0],
                                lng: adresseLivraison[1],
                            }}
                            icon={{
                                url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
                            }}
                            title="Destination"
                        />
                    </GoogleMap>
                </div>
            </div>
        </div>
    );
};

export default CommandeSuivi;
