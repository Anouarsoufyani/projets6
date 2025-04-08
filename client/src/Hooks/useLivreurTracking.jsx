import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";

const useLivreurTracking = (commandeId, refreshInterval = 10000) => {
    const [livreurPosition, setLivreurPosition] = useState(null);
    const [livreurStatus, setLivreurStatus] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const intervalRef = useRef(null);

    const fetchLivreurInfo = async () => {
        try {
            const response = await fetch(
                `/api/commandes/${commandeId}/livreur-info`
            );

            if (!response.ok) {
                const errorData = await response.json();
                if (response.status === 404) {
                    // Gérer le cas où le livreur n'est pas assigné (erreur attendue)
                    setLivreurPosition(null);
                    setLivreurStatus({
                        status: "en attente d'assignation",
                        timestamp: new Date(),
                    });
                    setIsLoading(false);
                    return;
                }
                throw new Error(
                    errorData.error ||
                        "Erreur lors de la récupération des informations du livreur"
                );
            }

            const data = await response.json();

            if (data.position) {
                setLivreurPosition({
                    lat: data.position.lat,
                    lng: data.position.lng,
                    livreurId: data.livreurId,
                    timestamp: new Date(),
                });
            }

            if (data.status) {
                setLivreurStatus({
                    status: data.status,
                    timestamp: new Date(),
                });
            }

            setIsLoading(false);
        } catch (err) {
            setError(err.message);
            setIsLoading(false);
            toast.error(err.message);
        }
    };

    useEffect(() => {
        if (!commandeId) return;

        // Premier chargement immédiat
        fetchLivreurInfo();

        // Configurer la mise à jour périodique
        intervalRef.current = setInterval(fetchLivreurInfo, refreshInterval);

        // Nettoyer l'intervalle lors du démontage
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [commandeId, refreshInterval]);

    return { livreurPosition, livreurStatus, isLoading, error };
};

export default useLivreurTracking;
