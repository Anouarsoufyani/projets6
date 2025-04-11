"use client";

import { useState, useEffect } from "react";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { useAvailableLivreurs } from "../../Hooks/useAvailableLivreurs";
import { useAuthUserQuery } from "../../Hooks/useAuthQueries";
import { useGetCoords } from "../../Hooks/useGetCoords";
import { toast } from "react-hot-toast";
import useGoogleMapDirections from "../../Hooks/useGoogleMapDirections";
import { useNavigate, useParams } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Ajouter la constante api

const mapContainerStyle = {
    width: "100%",
    height: "100%",
    borderRadius: "0.5rem",
};

const SelectLivreurPage = () => {
    const { data: livreurs, isLoading, error } = useAvailableLivreurs();
    const [selectedLivreur, setSelectedLivreur] = useState(null);
    const [selectedMarker, setSelectedMarker] = useState(null);
    const [mapZoom, setMapZoom] = useState(13);
    const { data: authUser } = useAuthUserQuery();
    const adresseCommercantFormatee =
        authUser.adresse_boutique.rue +
        ", " +
        authUser.adresse_boutique.ville +
        ", " +
        authUser.adresse_boutique.code_postal;
    const position = useGetCoords(adresseCommercantFormatee);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Utiliser useParams pour récupérer l'ID de la commande
    const { commandeId } = useParams();

    // Initialiser avec une position par défaut pour la France
    const [mapCenter, setMapCenter] = useState({
        lat: 46.603354, // Centre de la France
        lng: 1.888334,
    });

    // Mettre à jour le centre de la carte quand les coordonnées sont chargées
    useEffect(() => {
        if (position.data) {
            setMapCenter(position.data);
        }
    }, [position.data]);

    // Utiliser notre hook personnalisé pour les directions
    const { distance, duration, calculateRoute, onMapLoad, clearDirections } =
        useGoogleMapDirections({
            strokeColor: "#10b981", // emerald-500
            strokeWeight: 5,
            strokeOpacity: 0.8,
            suppressMarkers: true,
        });

    // Mutation pour assigner un livreur à une commande
    const assignLivreurMutation = useMutation({
        mutationFn: async ({ commandeId, livreurId }) => {
            const res = await fetch(`/api/commandes/assign-livreur`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ commandeId, livreurId }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(
                    errorData.error || "Erreur lors de l'assignation du livreur"
                );
            }

            return res.json();
        },
        onSuccess: () => {
            toast.success("Livreur assigné avec succès!");
            queryClient.invalidateQueries(["getUserCommandes"]);
            // Rediriger vers la page des commandes après l'assignation
            navigate("/commandes");
        },
        onError: (error) => {
            toast.error(
                error.message || "Erreur lors de l'assignation du livreur"
            );
        },
    });

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

    // Fonction pour confirmer l'assignation du livreur
    const confirmAssignLivreur = () => {
        if (!selectedLivreur) {
            toast.error("Veuillez sélectionner un livreur");
            return;
        }

        if (!commandeId) {
            toast.error("ID de commande manquant");
            return;
        }

        assignLivreurMutation.mutate({
            commandeId,
            livreurId: selectedLivreur._id,
        });
    };

    // Gérer le cas où il n'y a pas de livreurs disponibles
    if (livreurs && livreurs.length === 0) {
        return (
            <div className="w-full h-full bg-gray-100 p-6 flex flex-col items-center justify-center">
                <h1 className="text-2xl font-bold text-emerald-700 mb-6">
                    Livraison - Sélection des livreurs disponibles
                </h1>
                <div className="bg-white p-8 rounded-lg shadow-md text-center">
                    <p className="text-lg text-gray-700">
                        Aucun livreur disponible actuellement.
                    </p>
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

    return (
        <div className="w-full h-full bg-gray-100 p-6 flex flex-col">
            <h1 className="text-2xl font-bold text-emerald-700 mb-6">
                {commandeId
                    ? `Assigner un livreur à la commande #${commandeId.slice(
                          -6
                      )}`
                    : "Livraison - Sélection des livreurs disponibles"}
            </h1>

            {selectedLivreur && (
                <div className="mb-4 p-3 bg-emerald-100 border border-emerald-300 rounded-md flex justify-between items-center">
                    <div>
                        <span className="font-semibold">
                            Livreur sélectionné:{" "}
                        </span>
                        <span>{selectedLivreur.nom}</span>
                        <span className="ml-3 text-sm text-gray-600">
                            ({selectedLivreur.vehicule?.type || "N/A"},{" "}
                            {selectedLivreur.distance_max} km)
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            className="px-3 py-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                            onClick={
                                commandeId
                                    ? confirmAssignLivreur
                                    : () =>
                                          alert(
                                              "Confirmation de commande avec ce livreur"
                                          )
                            }
                            disabled={assignLivreurMutation.isPending}
                        >
                            {assignLivreurMutation.isPending
                                ? "En cours..."
                                : "Confirmer"}
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
                            <span className="font-semibold">
                                Distance du point de collecte:{" "}
                            </span>
                            <span className="text-blue-700">{distance}</span>
                            <span className="mx-2">•</span>
                            <span className="font-semibold">
                                Durée estimée:{" "}
                            </span>
                            <span className="text-blue-700">{duration}</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-1 gap-5 rounded-lg md:flex-row-reverse flex-col">
                {/* Carte placée avant le tableau pour l'ordre sur mobile */}
                <div className="md:w-7/12 w-full h-96 md:h-full">
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
                                        scaledSize: new window.google.maps.Size(
                                            60,
                                            60
                                        ),
                                    }}
                                    label={{
                                        text: "Votre Boutique",
                                        color: "black",
                                        fontWeight: "bold",
                                        fontSize: "14px",
                                        className: "marker-label",
                                        background: "#2a9d8f",
                                        padding: "5px",
                                    }}
                                />
                            </>
                        )}
                        {livreurs &&
                            livreurs.map((livreur) => {
                                const position = livreur.position;

                                return (
                                    <Marker
                                        key={livreur._id}
                                        position={{
                                            lat: position.lat,
                                            lng: position.lng,
                                        }}
                                        onClick={() =>
                                            setSelectedMarker(livreur)
                                        }
                                        icon={{
                                            url:
                                                selectedLivreur &&
                                                selectedLivreur._id ===
                                                    livreur._id
                                                    ? "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
                                                    : "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
                                            scaledSize:
                                                new window.google.maps.Size(
                                                    40,
                                                    40
                                                ),
                                        }}
                                        animation={
                                            selectedLivreur &&
                                            selectedLivreur._id === livreur._id
                                                ? window.google.maps.Animation
                                                      .BOUNCE
                                                : null
                                        }
                                    />
                                );
                            })}

                        {selectedMarker && (
                            <InfoWindow
                                position={{
                                    lat: selectedMarker.position.lat,
                                    lng: selectedMarker.position.lng,
                                }}
                                onCloseClick={() => setSelectedMarker(null)}
                            >
                                <div className="p-2">
                                    <h3 className="font-semibold">
                                        {selectedMarker.nom}
                                    </h3>
                                    <p>
                                        Véhicule:{" "}
                                        {selectedMarker.vehicule?.type || "N/A"}
                                    </p>
                                    <p>
                                        Note:{" "}
                                        {selectedMarker.note_moyenne.toFixed(1)}
                                        /5
                                    </p>
                                    <button
                                        onClick={() =>
                                            handleSelectLivreur(selectedMarker)
                                        }
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
                                {livreurs &&
                                    livreurs.map((livreur) => {
                                        const position = livreur.position;

                                        return (
                                            <tr
                                                key={livreur._id}
                                                className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                                                    selectedLivreur &&
                                                    selectedLivreur._id ===
                                                        livreur._id
                                                        ? "bg-emerald-50"
                                                        : ""
                                                }`}
                                                onClick={() =>
                                                    setSelectedMarker(livreur)
                                                }
                                            >
                                                <td className="py-2 px-3">
                                                    {livreur._id.slice(-6)}
                                                </td>
                                                <td className="py-2 px-3">
                                                    {livreur.nom}
                                                </td>
                                                <td className="py-2 px-3">{`${position.lat.toFixed(
                                                    4
                                                )}, ${position.lng.toFixed(
                                                    4
                                                )}`}</td>
                                                <td className="py-2 px-3">
                                                    {livreur.vehicule?.type ||
                                                        "N/A"}
                                                </td>
                                                <td className="py-2 px-3">
                                                    {livreur.distance_max} km
                                                </td>
                                                <td className="py-2 px-3">
                                                    {livreur.note_moyenne.toFixed(
                                                        1
                                                    )}
                                                    /5
                                                </td>
                                                <td className="py-2 px-3">
                                                    <button
                                                        className={`px-3 py-1 rounded-md ${
                                                            selectedLivreur &&
                                                            selectedLivreur._id ===
                                                                livreur._id
                                                                ? "bg-emerald-600 text-white"
                                                                : "text-emerald-600 border border-emerald-600 hover:bg-emerald-50"
                                                        }`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSelectLivreur(
                                                                livreur
                                                            );
                                                        }}
                                                    >
                                                        {selectedLivreur &&
                                                        selectedLivreur._id ===
                                                            livreur._id
                                                            ? "Sélectionné"
                                                            : "Sélectionner"}
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
