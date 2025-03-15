"use client";
import { useGetCoords } from "../../Hooks/useGetCoords";
import { useEffect, useState, useRef } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuthUserQuery } from "../../Hooks/useAuthQueries";
import toast from "react-hot-toast";

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

const useUserPosition = () => {
    const [position, setPosition] = useState([null, null]);

    useEffect(() => {
        if (!navigator.geolocation) {
            toast.error(
                "La géolocalisation n'est pas supportée par votre navigateur"
            );
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
            (err) => toast.error(`Erreur : ${err.message}`),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    return position;
};

const CommandeSuivi = () => {
    const { data: authUser } = useAuthUserQuery();
    console.log("authUser", authUser.role);

    const position = useUserPosition();
    const [directionsResponse, setDirectionsResponse] = useState(null);
    const [distance, setDistance] = useState("");
    const [duration, setDuration] = useState("");
    const mapRef = useRef(null);
    const directionsRendererRef = useRef(null);

    const { id } = useParams();

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
                throw error;
            }
        },
        retry: false,
    });

    const livreur = commande?.data?.livreur_id || {};
    const livreurPosition =
        position[0] && position[1] ? position : [48.8466, 2.3622];
    // const adresseLivraison = [
    //     commande?.data?.adresse_livraison?.lat || 48.8066,
    //     commande?.data?.adresse_livraison?.lng || 2.3022,
    // ];

    // Avoir la geolocalisation exacte grace a l'adresse
    const adresseClient = //on mets l'adresse du client bien formatee
        commande?.data?.adresse_livraison?.rue +
        ", " +
        commande?.data?.adresse_livraison?.ville +
        ", " +
        commande?.data?.adresse_livraison?.code_postal;
    console.log("adresseClient", adresseClient);
    const coords = useGetCoords(adresseClient); // on utilise l'api google maps geocoding pour avoir les coordonnees
    console.log("coords", coords);
    const adresseLivraison = [coords?.data?.lat, coords?.data?.lng]; // on formate les coordonnees
    console.log("adresseLivraison", adresseLivraison);

    // Calculate route using DirectionsService
    const calculateRoute = async () => {
        if (!livreurPosition[0] || !adresseLivraison[0]) {
            console.log("Route non calculée : positions invalides");
            return;
        }

        try {
            // Create DirectionsService object
            const directionsService =
                new window.google.maps.DirectionsService();

            // Execute route calculation
            const results = await directionsService.route({
                origin: { lat: livreurPosition[0], lng: livreurPosition[1] },
                destination: {
                    lat: adresseLivraison[0],
                    lng: adresseLivraison[1],
                },
                travelMode: window.google.maps.TravelMode.DRIVING,
            });

            // Store the response and extract info
            setDirectionsResponse(results);
            setDistance(results.routes[0].legs[0].distance.text);
            setDuration(results.routes[0].legs[0].duration.text);
        } catch (error) {
            console.error("Erreur lors du calcul de l'itinéraire:", error);
            toast.error(`Erreur : ${error.message}`);
        }
    };

    // Setup DirectionsRenderer when map loads
    const onMapLoad = (map) => {
        mapRef.current = map;

        // Create DirectionsRenderer
        if (!directionsRendererRef.current) {
            directionsRendererRef.current =
                new window.google.maps.DirectionsRenderer({
                    map,
                    suppressMarkers: true, // We'll use our custom markers
                    polylineOptions: {
                        strokeColor: "#10b981", // emerald-500
                        strokeWeight: 5,
                        strokeOpacity: 0.8,
                    },
                });
        }
    };

    // Update route when positions change
    useEffect(() => {
        if (mapRef.current && livreurPosition[0] && adresseLivraison[0]) {
            calculateRoute();
        }
    }, [livreurPosition]);

    // Update DirectionsRenderer when route changes
    useEffect(() => {
        if (directionsRendererRef.current && directionsResponse) {
            directionsRendererRef.current.setDirections(directionsResponse);
        }
    }, [directionsResponse]);

    if (isLoading) {
        return <LoadingSpinner />;
    }

    // Calculate estimated time of arrival based on the actual duration
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

    return (
        <div className="w-full min-h-screen bg-gray-50 p-4 md:p-6 flex flex-col">
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
                                    Véhicule
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

                        {/* Delivery status with actual distance and duration */}
                        <div className="p-4 bg-blue-50 rounded-lg">
                            <h3 className="font-medium text-blue-800 mb-2">
                                Statut
                            </h3>
                            <div className="space-y-2">
                                <p className="text-blue-700 font-medium">
                                    En route
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
                                    <div className="bg-blue-600 h-2.5 rounded-full w-2/3"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full lg:w-2/3 shadow-xl rounded-lg overflow-hidden mt-4 lg:mt-0">
                    <LoadScript googleMapsApiKey="AIzaSyD9buKfiAVASpx1zzEWbuSyHI05CaJyQ6c">
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
                            {livreurPosition[0] && livreurPosition[1] && (
                                <Marker
                                    position={{
                                        lat: livreurPosition[0],
                                        lng: livreurPosition[1],
                                    }}
                                    icon={{
                                        url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                                        // scaledSize: new window.google.maps.Size(
                                        //     40,
                                        //     40
                                        // ),
                                    }}
                                    title="Livreur en déplacement"
                                />
                            )}

                            {adresseLivraison[0] && adresseLivraison[1] && (
                                <Marker
                                    position={{
                                        lat: adresseLivraison[0],
                                        lng: adresseLivraison[1],
                                    }}
                                    icon={{
                                        url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
                                        // scaledSize: new window.google.maps.Size(
                                        //     40,
                                        //     40
                                        // ),
                                    }}
                                    title="Destination"
                                />
                            )}
                        </GoogleMap>
                    </LoadScript>
                </div>
            </div>
        </div>
    );
};

export default CommandeSuivi;
