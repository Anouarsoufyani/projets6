import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useGetUserCommandes } from "./index";

const useToggleActive = () => {
    const queryClient = useQueryClient();
    const { data: commandesData } = useGetUserCommandes();
    const commandeEnCours = commandesData?.commandes?.find(
        (cmd) => cmd.statut !== "livree"
    );

    const { mutateAsync: toggleActive, isPending: isToggleActive } =
        useMutation({
            mutationFn: async (id) => {
                if (commandeEnCours) {
                    throw new Error(
                        "Vous ne pouvez pas changer votre statut pendant une livraison en cours"
                    );
                }

                const res = await fetch(`/api/user/active`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ id }),
                });

                const data = await res.json();
                if (!res.ok) {
                    throw new Error(
                        data.error || "Erreur lors de l'activation du livreur"
                    );
                }
                console.log("Livreur activé :", data);
                return data;
            },
            onSuccess: () => {
                toast.success("Statut mis à jour avec succès");
                Promise.all([
                    queryClient.invalidateQueries({ queryKey: ["authUser"] }),
                ]);
            },
            onError: (err) => {
                toast.error(err.message);
            },
        });

    return {
        toggleActive,
        isToggleActive,
        hasActiveDelivery: !!commandeEnCours,
    };
};

export default useToggleActive;
