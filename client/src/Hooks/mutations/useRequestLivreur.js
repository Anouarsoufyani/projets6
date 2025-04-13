import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export const useRequestLivreur = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ commandeId, livreurId }) => {
            const res = await fetch(`/api/commandes/request-livreur`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ commandeId, livreurId }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(
                    errorData.error ||
                        "Erreur lors de l'envoi de la demande de livraison"
                );
            }

            return res.json();
        },
        onSuccess: () => {
            toast.success("Demande de livraison envoyée avec succès!");
            queryClient.invalidateQueries(["getUserCommandes"]);
        },
        onError: (error) => {
            toast.error(
                error.message ||
                    "Erreur lors de l'envoi de la demande de livraison"
            );
        },
    });
};
