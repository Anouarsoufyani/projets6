import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export const useAssignLivreur = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async ({ commandeId, livreurId, requestId, response }) => {
            const res = await fetch(`/api/commandes/assign-livreur`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    commandeId,
                    livreurId,
                    requestId,
                    response,
                }),
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
            queryClient.invalidateQueries([
                "getUserCommandes",
                "notifications",
            ]);
        },
        onError: (error) => {
            toast.error(
                error.message || "Erreur lors de l'assignation du livreur"
            );
        },
    });

    // Retourner une fonction directement exécutable
    return (commandeId, livreurId, requestId, response) => {
        mutation.mutate({ commandeId, livreurId, requestId, response });
    };
};
