import { useMutation, useQueryClient } from "@tanstack/react-query";


export const useUpdateUserStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ userId, status }) => {
            const response = await fetch(`/api/admin/${userId}/status`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ status }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Erreur lors de la mise à jour du statut"
                );
            }

            return data;
        },
        onSuccess: (data, variables) => {

            queryClient.invalidateQueries({
                queryKey: ["getUserById", variables.userId],
            });
            queryClient.invalidateQueries({ queryKey: ["getUsersByRole"] });
        },
    });
};


export const useDeleteUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (userId) => {
            const response = await fetch(`/api/admin/${userId}`, {
                method: "DELETE",
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                        "Erreur lors de la suppression de l'utilisateur"
                );
            }

            return data;
        },
        onSuccess: (data, userId) => {

            queryClient.invalidateQueries({ queryKey: ["getUsersByRole"] });
        },
    });
};


export const useAdminUpdateUserProfile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (userData) => {
            const response = await fetch(`/api/admin/${userData._id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(userData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Erreur lors de la mise à jour du profil"
                );
            }

            return data;
        },
        onSuccess: (data, userData) => {
            queryClient.invalidateQueries({
                queryKey: ["getUserById", userData._id],
            });
            queryClient.invalidateQueries({ queryKey: ["getUsersByRole"] });
        },
    });
};
