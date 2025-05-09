import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export const useSubmitReview = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            targetId,
            targetType,
            rating,
            comment,
            commandeId,
        }) => {
            const res = await fetch(`/api/reviews`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    targetId,
                    targetType, 
                    rating,
                    comment,
                    commandeId,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(
                    errorData.message ||
                        "Erreur lors de la soumission de l'avis"
                );
            }

            return res.json();
        },
        onSuccess: (data, variables) => {
            const targetText =
                variables.targetType === "commercant"
                    ? "commerçant"
                    : "livreur";
            toast.success(
                `Votre avis sur le ${targetText} a été soumis avec succès!`
            );
            queryClient.invalidateQueries(["getUserCommandes"]);
            queryClient.invalidateQueries([
                "getCommandeById",
                variables.commandeId,
            ]);
            queryClient.invalidateQueries(["getReviews", variables.targetId]);
            queryClient.invalidateQueries(["getUserReviews"]);
        },
        onError: (error) => {
            toast.error(
                error.message || "Erreur lors de la soumission de l'avis"
            );
        },
    });
};
