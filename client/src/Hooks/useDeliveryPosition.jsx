"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

const useDeliveryPosition = (isDeliveryActive, userId, commandeId = null) => {
    const [position, setPosition] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const intervalRef = useRef(null);

    const { mutate: updatePosition } = useMutation({
        mutationFn: async (newPosition) => {
            const response = await fetch(`/api/user/${userId}/position`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...newPosition,
                    commandeId: commandeId,
                }),
            });

            if (!response.ok) {
                throw new Error("Erreur lors de la mise à jour de la position");
            }

            return response.json();
        },
        onError: (error) => {
            toast.error(`Erreur: ${error.message}`);
        },
    });

    const getCurrentPosition = () => {
        if (!navigator.geolocation) {
            setError(
                "La géolocalisation n'est pas supportée par votre navigateur."
            );
            setLoading(false);
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
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    useEffect(() => {
        if (isDeliveryActive && userId) {
            // Récupérer la position immédiatement
            getCurrentPosition();

            // Puis toutes les 5 secondes
            intervalRef.current = setInterval(getCurrentPosition, 5000);
        } else {
            setPosition(null);
            setLoading(false);

            // Nettoyer l'intervalle si le livreur n'est plus actif
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isDeliveryActive, userId, commandeId]);

    return { position, loading, error };
};

export default useDeliveryPosition;
