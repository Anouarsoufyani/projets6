import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

/**
 * Hook pour ajouter un nouveau véhicule au profil du livreur
 */
export const useUploadVehicule = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (vehiculeData) => {
            // Validation des données selon le type de véhicule

            // Définir le statut comme non vérifié par défaut
            console.log("vehiculeData", vehiculeData);

            const res = await fetch("/api/user/livreur/vehicules", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(vehiculeData),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(
                    errorData.error || "Erreur lors de l'ajout du véhicule"
                );
            }

            return res.json();
        },
        onSuccess: () => {
            toast.success("Véhicule ajouté avec succès !");
            // Actualiser les données de l'utilisateur après ajout
            setTimeout(() => {
                queryClient.invalidateQueries(["authUser"]);
            }, 1000);
        },
        onError: (error) => {
            toast.error(error.message || "Erreur lors de l'ajout du véhicule");
        },
    });
};

/**
 * Hook pour mettre à jour un véhicule existant
 */
export const useUpdateVehicule = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ vehiculeId, vehiculeData }) => {
            // Validation des données selon le type de véhicule

            const res = await fetch(
                `/api/user/livreur/vehicules/${vehiculeId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(vehiculeData),
                }
            );

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(
                    errorData.error ||
                        "Erreur lors de la mise à jour du véhicule"
                );
            }

            return res.json();
        },
        onSuccess: () => {
            toast.success("Véhicule mis à jour avec succès !");
            // Actualiser les données de l'utilisateur après mise à jour
            setTimeout(() => {
                queryClient.invalidateQueries(["authUser"]);
            }, 1000);
        },
        onError: (error) => {
            toast.error(
                error.message || "Erreur lors de la mise à jour du véhicule"
            );
        },
    });
};

/**
 * Hook pour supprimer un véhicule
 */
export const useDeleteVehicule = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (vehiculeId) => {
            const res = await fetch(
                `/api/user/livreur/vehicules/${vehiculeId}`,
                {
                    method: "DELETE",
                }
            );

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(
                    errorData.error ||
                        "Erreur lors de la suppression du véhicule"
                );
            }

            return res.json();
        },
        onSuccess: () => {
            toast.success("Véhicule supprimé avec succès !");
            // Actualiser les données de l'utilisateur après suppression
            setTimeout(() => {
                queryClient.invalidateQueries(["authUser"]);
            }, 1000);
        },
        onError: (error) => {
            toast.error(
                error.message || "Erreur lors de la suppression du véhicule"
            );
        },
    });
};
