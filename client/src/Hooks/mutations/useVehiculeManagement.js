import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";


export const useUploadVehicule = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (vehiculeData) => {

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

            setTimeout(() => {
                queryClient.invalidateQueries(["authUser"]);
            }, 1000);
        },
        onError: (error) => {
            toast.error(error.message || "Erreur lors de l'ajout du véhicule");
        },
    });
};


export const useUpdateVehicule = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ vehiculeId, vehiculeData }) => {


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
