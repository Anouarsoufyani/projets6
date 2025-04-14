"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useGetLatestPendingCommande } from "../queries/useGetCommandes";

const useDeliveryPosition = (isDeliveryActive, userId) => {
    const [position, setPosition] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const intervalRef = useRef(null);
    const isUpdatingRef = useRef(false);
    const queryClient = useQueryClient();

    // Récupérer la commande en cours
    const { data: commandeEnCours } = useGetLatestPendingCommande();
    const commandeId = commandeEnCours?._id;

    const { mutate: updatePosition } = useMutation({
        mutationFn: async (newPosition) => {
            // Mise à jour de la position du livreur
            const response = await fetch(`/api/user/${userId}/position`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...newPosition,
                }),
            });

            if (!response.ok) {
                throw new Error("Erreur lors de la mise à jour de la position");
            }

            // Si une commande est en cours, mettre à jour son itinéraire
            if (commandeId) {
                const itineraireResponse = await fetch(
                    `/api/commandes/${commandeId}/itineraire`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            position: newPosition,
                            timestamp: new Date().toISOString(),
                        }),
                    }
                );

                if (!itineraireResponse.ok) {
                    console.warn(
                        "Erreur lors de la mise à jour de l'itinéraire de la commande"
                    );
                }
            }

            return response.json();
        },
        onSuccess: () => {
            // Invalider les requêtes qui dépendent de la position du livreur
            if (commandeId) {
                queryClient.invalidateQueries(["getCommandeById", commandeId]);
            }
            isUpdatingRef.current = false;
        },
        onError: (error) => {
            toast.error(`Erreur: ${error.message}`);
            isUpdatingRef.current = false;
        },
    });

    const getCurrentPosition = () => {
        // Éviter les mises à jour simultanées
        if (isUpdatingRef.current) return;

        isUpdatingRef.current = true;

        if (!navigator.geolocation) {
            setError(
                "La géolocalisation n'est pas supportée par votre navigateur."
            );
            setLoading(false);
            isUpdatingRef.current = false;
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const newPosition = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                };
                setPosition(newPosition);
                setLoading(false);

                // Mettre à jour la position dans la base de données
                updatePosition(newPosition);
            },
            (err) => {
                setError(`Erreur : ${err.message}`);
                setLoading(false);
                isUpdatingRef.current = false;
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    useEffect(() => {
        // Nettoyer l'intervalle existant si présent
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        if (isDeliveryActive && userId) {
            // Récupérer la position immédiatement
            getCurrentPosition();

            // Puis toutes les 5 secondes
            intervalRef.current = setInterval(getCurrentPosition, 5000);
        } else {
            setPosition(null);
            setLoading(false);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isDeliveryActive, userId]); // Retirer commandeId des dépendances

    return { position, loading, error };
};

export default useDeliveryPosition;
