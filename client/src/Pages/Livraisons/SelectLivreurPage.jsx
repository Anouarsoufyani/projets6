import { useState, useRef, useEffect } from "react";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { useAvailableLivreurs } from "../../Hooks/useAvailableLivreurs";
// import { useQuery } from "@tanstack/react-query";
import { useAuthUserQuery } from "../../Hooks/useAuthQueries";
import { useGetCoords } from "../../Hooks/useGetCoords";
import { toast } from "react-hot-toast";
import useGoogleMapDirections from "../../Hooks/useGoogleMapDirections";

const mapContainerStyle = {
    width: "100%",
    height: "100%",
    borderRadius: "0.5rem",
};

const center = {
    lat: 46.603354, // Centre de la France
    lng: 1.888334,
};

const SelectLivreurPage = () => {
    const { data: livreurs, isLoading, error } = useAvailableLivreurs();
    const [selectedLivreur, setSelectedLivreur] = useState(null);
    const [selectedMarker, setSelectedMarker] = useState(null);
    const [mapCenter, setMapCenter] = useState(center);
    const [mapZoom, setMapZoom] = useState(6);
    const { data: authUser } = useAuthUserQuery();
    const adresseCommercantFormatee = authUser.adresse_boutique.rue + ", " + authUser.adresse_boutique.ville + ", " + authUser.adresse_boutique.code_postal;
    const position = useGetCoords(adresseCommercantFormatee);
    
    // Utiliser notre hook personnalisé pour les directions
    const { 
        distance, 
        duration, 
        calculateRoute, 
        onMapLoad, 
        clearDirections 
    } = useGoogleMapDirections({
        strokeColor: "#10b981", // emerald-500
        strokeWeight: 5,
        strokeOpacity: 0.8,
        suppressMarkers: true
    });

    // Fonction pour calculer l'itinéraire
    // const calculateRoute = async (livreurPos, commercePos) => {
    //     if (!livreurPos || !commercePos) {
    //         console.log("Positions invalides pour le calcul d'itinéraire");
    //         return;
    //     }

    //     try {
    //         // Créer un objet DirectionsService
    //         const directionsService = new window.google.maps.DirectionsService();

    //         // Exécuter le calcul d'itinéraire
    //         const results = await directionsService.route({
    //             origin: { lat: livreurPos.lat, lng: livreurPos.lng },
    //             destination: { lat: commercePos.lat, lng: commercePos.lng },
    //             travelMode: window.google.maps.TravelMode.DRIVING,
    //         });

    //         // Stocker la réponse et extraire les informations
    //         setDirectionsResponse(results);
    //         setDistance(results.routes[0].legs[0].distance.text);
    //         setDuration(results.routes[0].legs[0].duration.text);
    //     } catch (error) {
    //         console.error("Erreur lors du calcul de l'itinéraire:", error);
    //         toast.error(`Erreur : ${error.message}`);
    //     }
    // };

    // Configuration du DirectionsRenderer lors du chargement de la carte
    // const onMapLoad = (map) => {
    //     mapRef.current = map;

    //     // Créer DirectionsRenderer s'il n'existe pas
    //     if (!directionsRendererRef.current) {
    //         directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
    //             map,
    //             suppressMarkers: true, // Nous utilisons nos propres marqueurs
    //             polylineOptions: {
    //                 strokeColor: "#10b981", // emerald-500
    //                 strokeWeight: 5,
    //                 strokeOpacity: 0.8,
    //             },
    //         });
    //     }
    // };

    // Mettre à jour DirectionsRenderer lorsque l'itinéraire change
    // useEffect(() => {
    //     if (directionsRendererRef.current && directionsResponse) {
    //         directionsRendererRef.current.setDirections(directionsResponse);
    //     }
    // }, [directionsResponse]);

    // Utiliser useQuery avec un petit intervalle de rafraîchissement pour la mise à jour des positions
    // const { data: livreursPositions = {}, isLoading: isLoadingPositions } = useQuery({
    //     queryKey: ["livreursPositions"],
    //     queryFn: async () => {
    //         const res = await fetch("/api/user/livreurs/positions");
    //         if (!res.ok) {
    //             const error = await res.json();
    //             throw new Error(error.message || "Erreur lors de la récupération des positions");
    //         }
    //         return res.json();
    //     },
    //     refetchInterval: 10000, // Rafraîchir toutes les 10 secondes
    //     enabled: !!livreurs && livreurs.length > 0, // Activer seulement si les livreurs sont chargés
    //     onError: (error) => {
    //         console.error("Erreur de chargement des positions:", error);
    //     }
    // });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <span className="loading loading-spinner loading-lg text-emerald-600"></span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-red-500 text-center p-4">
                Une erreur est survenue lors du chargement des livreurs
            </div>
        );
    }

    const columns = [
        "ID",
        "Nom",

        "Position",

        "Type de véhicule",
        "Distance max",
        "Note moyenne",
        "Actions",
    ];

    const handleSelectLivreur = (livreur) => {
        // Nettoyer les directions précédentes avant tout
        clearDirections();
        
        setSelectedLivreur(livreur);
        // Centrer la carte sur le livreur sélectionné
        const livreurPosition = livreur.position;
        setMapCenter({ lat: livreurPosition.lat, lng: livreurPosition.lng });
        setMapZoom(12); // Zoom plus proche
        
        // Calculer l'itinéraire si les positions sont disponibles
        if (position.data && livreurPosition) {
            calculateRoute(
                { lat: livreurPosition.lat, lng: livreurPosition.lng },
                { lat: position.data.lat, lng: position.data.lng }
            );
        }
        
        // Afficher confirmation ou détails supplémentaires
        toast.success(`Livreur ${livreur.nom} sélectionné`);
    };

    // Gérer le cas où il n'y a pas de livreurs disponibles
    if (livreurs && livreurs.length === 0) {
        return (
            <div className="w-full h-full bg-gray-100 p-6 flex flex-col items-center justify-center">
                <h1 className="text-2xl font-bold text-emerald-700 mb-6">
                    Livraison - Sélection des livreurs disponibles
                </h1>
                <div className="bg-white p-8 rounded-lg shadow-md text-center">
                    <p className="text-lg text-gray-700">Aucun livreur disponible actuellement.</p>
                    <button 
                        className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                        onClick={() => window.location.reload()}
                    >
                        Rafraîchir
                    </button>
                </div>
            </div>
        );
    }

   

    
    console.log(position.data);



    return (
        <div className="w-full h-full bg-gray-100 p-6 flex flex-col">
            <h1 className="text-2xl font-bold text-emerald-700 mb-6">
                Livraison - Sélection des livreurs disponibles
            </h1>
            
            {selectedLivreur && (
                <div className="mb-4 p-3 bg-emerald-100 border border-emerald-300 rounded-md flex justify-between items-center">
                    <div>
                        <span className="font-semibold">Livreur sélectionné: </span>
                        <span>{selectedLivreur.nom}</span> 
                        <span className="ml-3 text-sm text-gray-600">
                            ({selectedLivreur.vehicule?.type || "N/A"}, {selectedLivreur.distance_max} km)
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            className="px-3 py-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                            onClick={() => alert("Confirmation de commande avec ce livreur")}
                        >
                            Confirmer
                        </button>
                        <button 
                            className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                            onClick={() => {
                                clearDirections();
                                setSelectedLivreur(null);
                            }}
                        >
                            Annuler
                        </button>
                    </div>
                </div>
            )}
            
            {selectedLivreur && distance && duration && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="font-semibold">Distance du point de collecte: </span>
                            <span className="text-blue-700">{distance}</span>
                            <span className="mx-2">•</span>
                            <span className="font-semibold">Durée estimée: </span>
                            <span className="text-blue-700">{duration}</span>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="flex flex-1 gap-5 rounded-lg md:flex-row-reverse flex-col">
                {/* Carte placée avant le tableau pour l'ordre sur mobile */}
                <div className="md:w-7/12 w-full h-96 md:h-full">
                    {/* {isLoadingPositions && (
                        <div className="absolute top-2 right-2 z-10 bg-white p-2 rounded-md shadow-md">
                            <span className="text-sm flex items-center">
                                <span className="loading loading-spinner loading-xs mr-2"></span>
                                Actualisation des positions...
                            </span>
                        </div>
                    )} */}
                    
                    <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={mapCenter}
                        zoom={mapZoom}
                        options={{
                            styles: [
                                {
                                    featureType: "poi",
                                    elementType: "labels",
                                    stylers: [{ visibility: "off" }],
                                },
                            ],
                            fullscreenControl: false,
                            streetViewControl: false,
                            mapTypeControl: true,
                            zoomControl: true,
                        }}
                        onLoad={onMapLoad}
                    >



                        {position.data && (
                            <>
                            <Marker
                                position={{
                                    lat: position.data.lat,
                                    lng: position.data.lng,
                                }}
                                icon={{
                                    url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
                                    scaledSize: new window.google.maps.Size(60, 60)
                                }}
                                label={{
                                    text: "Votre Boutique",
                                    color: "black",
                                    fontWeight: "bold",
                                    fontSize: "14px",
                                    className: "marker-label",
                                    background: "#2a9d8f",
                                    padding: "5px"
                                }}
                            />
                            <InfoWindow
                                position={{
                                    lat: position.data.lat + 0.0005,
                                    lng: position.data.lng 
                                }}
                            >
                                <div className="p-1">
                                    <p className="font-semibold">Votre commerce</p>
                                    <p className="text-xs">{adresseCommercantFormatee}</p>
                                </div>
                            </InfoWindow>
                        </>
                        )}
                        {livreurs && livreurs.map((livreur) => {
                            // Utiliser la position en temps réel si disponible
                            // const realTimePosition = livreursPositions[livreur._id];
                            const position =
                            //  realTimePosition || 
                             livreur.position;
                            
                            return (
                                <Marker
                                    key={livreur._id}
                                    position={{
                                        lat: position.lat,
                                        lng: position.lng,
                                    }}
                                    onClick={() => setSelectedMarker(livreur)}
                                    // Utiliser une couleur différente si sélectionné
                                    icon={{
                                        url: selectedLivreur && selectedLivreur._id === livreur._id
                                            ? "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
                                            // : realTimePosition 
                                            //     ? "https://maps.google.com/mapfiles/ms/icons/blue-dot.png" 
                                                : "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
                                        scaledSize: new window.google.maps.Size(40, 40)
                                    }}
                                    animation={selectedLivreur && selectedLivreur._id === livreur._id 
                                        ? window.google.maps.Animation.BOUNCE : null}
                                />
                            );
                        })}

                        {selectedMarker && (
                            <InfoWindow
                                position={{
                                    lat: 
                                    // livreursPositions[selectedMarker._id]?.lat ||
                                     selectedMarker.position.lat,
                                    lng: 
                                    // livreursPositions[selectedMarker._id]?.lng || 
                                    selectedMarker.position.lng,
                                }}
                                onCloseClick={() => setSelectedMarker(null)}
                            >
                                <div className="p-2">
                                    <h3 className="font-semibold">{selectedMarker.nom}</h3>
                                    <p>Véhicule: {selectedMarker.vehicule?.type || "N/A"}</p>
                                    <p>Note: {selectedMarker.note_moyenne.toFixed(1)}/5</p>
                                    {/* {livreursPositions[selectedMarker._id] && (
                                        <p className="text-xs text-green-600">
                                            Position en temps réel
                                        </p>
                                    )} */}
                                    <button
                                        onClick={() => handleSelectLivreur(selectedMarker)}
                                        className="mt-2 text-sm text-emerald-600 hover:text-emerald-800"
                                    >
                                        Sélectionner ce livreur
                                    </button>
                                </div>
                            </InfoWindow>
                        )}
                    </GoogleMap>
                    

                </div>

                <div className="md:w-5/12 w-full bg-white p-4 rounded-lg shadow-md overflow-auto">
                    <h2 className="text-lg font-semibold text-emerald-800 mb-4">
                        Livreurs disponibles
                    </h2>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    {columns.map((column) => (
                                        <th
                                            key={column}
                                            className="py-2 px-3 text-sm font-semibold text-gray-700"
                                        >
                                            {column}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {livreurs && livreurs.map((livreur) => {
                                    // Utiliser la position en temps réel si disponible
                                    // const realTimePosition = livreursPositions[livreur._id];
                                    const position = 
                                    // realTimePosition || 
                                    livreur.position;
                                    
                                    return (
                                        <tr
                                            key={livreur._id}
                                            className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                                                selectedLivreur && selectedLivreur._id === livreur._id 
                                                ? 'bg-emerald-50' : ''
                                            }`}
                                            onClick={() => setSelectedMarker(livreur)}
                                        >
                                            <td className="py-2 px-3">
                                                {livreur._id.slice(-6)}
                                            </td>
                                            <td className="py-2 px-3">{livreur.nom}</td>
                                            <td className="py-2 px-3">
                                                {`${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}`}
                                                {/* {realTimePosition && (
                                                    <span className="ml-2 text-xs text-green-500">•</span>
                                                )} */}
                                            </td>
                                            <td className="py-2 px-3">
                                                {livreur.vehicule?.type || "N/A"}
                                            </td>
                                            <td className="py-2 px-3">
                                                {livreur.distance_max} km
                                            </td>
                                            <td className="py-2 px-3">
                                                {livreur.note_moyenne.toFixed(1)}/5
                                            </td>
                                            <td className="py-2 px-3">
                                                <button 
                                                    className={`px-3 py-1 rounded-md ${
                                                        selectedLivreur && selectedLivreur._id === livreur._id
                                                        ? 'bg-emerald-600 text-white' 
                                                        : 'text-emerald-600 border border-emerald-600 hover:bg-emerald-50'
                                                    }`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSelectLivreur(livreur);
                                                    }}
                                                >
                                                    {selectedLivreur && selectedLivreur._id === livreur._id 
                                                        ? 'Sélectionné' : 'Sélectionner'}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SelectLivreurPage;

