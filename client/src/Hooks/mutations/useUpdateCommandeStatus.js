import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export const useUpdateCommandeStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ commandeId, newStatus }) => {
            const res = await fetch(`/api/commandes/update-status`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ commandeId, statut: newStatus }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(
                    errorData.error || "Erreur lors de la mise à jour du statut"
                );
            }

            return res.json();
        },
        onSuccess: (data, variables) => {
            // Use the actual status value for the success message
            const statusText =
                variables.newStatus === "refusee"
                    ? "refusée"
                    : variables.newStatus === "en_preparation"
                    ? "mise en préparation"
                    : variables.newStatus === "livree"
                    ? "marquée comme livrée"
                    : "mise à jour";

            toast.success(`Commande ${statusText} avec succès!`);
            // Refresh order data
            queryClient.invalidateQueries(["getAllCommandes"]);
            queryClient.invalidateQueries(["getUserCommandes"]);
        },
        onError: (error) => {
            toast.error(
                error.message || "Erreur lors de la mise à jour du statut"
            );
        },
    });
};
