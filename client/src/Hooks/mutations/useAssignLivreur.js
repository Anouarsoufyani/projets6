"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useState } from "react";

export const useAssignLivreur = () => {
    const queryClient = useQueryClient();
    const [isLoading, setIsLoading] = useState(false);
    const [isResponding, setIsResponding] = useState(false);

    // Mutation for assigning a livreur to a commande
    const assignMutation = useMutation({
        mutationFn: async ({
            commandeId,
            livreurId,
            mode,
            vehicleTypes,
            criteria,
        }) => {
            setIsLoading(true);

            const endpoint = `/api/commandes/assign-livreur`;
            const payload = {
                commandeId,
                livreurId,
                mode: mode || "manual",
                vehicleTypes,
                criteria,
            };

            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(
                    data.error || "Erreur lors de l'assignation du livreur"
                );
            }

            return { data };
        },
        onSuccess: (result) => {
            toast.success("Demande envoyée au livreur avec succès!");

            // Invalidate relevant queries
            queryClient.invalidateQueries(["notifications"]);
            queryClient.invalidateQueries(["getCommande"]);
            queryClient.invalidateQueries(["getUserCommandes"]);

            setIsLoading(false);
        },
        onError: (error) => {
            toast.error(
                error.message || "Erreur lors de l'assignation du livreur"
            );
            setIsLoading(false);
        },
        onSettled: () => {
            setIsLoading(false);
        },
    });

    // Separate mutation for handling livreur responses
    const responseMutation = useMutation({
        mutationFn: async ({ notificationId, response }) => {
            setIsResponding(true);

            const endpoint = `/api/commandes/handle-response`;
            const payload = {
                notificationId,
                response,
            };

            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(
                    data.error || "Erreur lors de la réponse à la demande"
                );
            }

            return { data, response };
        },
        onSuccess: (result) => {
            // Show appropriate success message
            if (result.response === "accept") {
                toast.success("Livraison acceptée avec succès!");
            } else {
                toast.success(
                    "Livraison refusée. La prochaine personne dans la file sera notifiée."
                );
            }

            // Invalidate relevant queries
            queryClient.invalidateQueries(["notifications"]);
            queryClient.invalidateQueries(["getCommande"]);
            queryClient.invalidateQueries(["getUserCommandes"]);

            setIsResponding(false);
        },
        onError: (error) => {
            toast.error(
                error.message || "Erreur lors de la réponse à la demande"
            );
            setIsResponding(false);
        },
        onSettled: () => {
            setIsResponding(false);
        },
    });

    // Function to assign a livreur
    const assignLivreur = (params) => {
        return assignMutation.mutate(params);
    };

    // Function to handle livreur response (accept/reject)
    const handleLivreurResponse = (params) => {
        return responseMutation.mutate(params);
    };

    return {
        assignLivreur,
        handleLivreurResponse,
        isLoading,
        isResponding,
        ...assignMutation,
    };
};

export default useAssignLivreur;
