import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export const useUploadDocument = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (formData) => {
            const res = await fetch("/api/documents/upload", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Échec de l'envoi des documents");
            return res.json();
        },
        onSuccess: () => {
            toast.success("Documents soumis avec succès !");
            // Actualiser les données de l'utilisateur après soumission
            setTimeout(() => {
                queryClient.invalidateQueries(["authUser"]);
            }, 1000);
        },
        onError: (error) => {
            toast.error(error.message || "Erreur lors de la soumission");
        },
    });
};

// Renommer la fonction useUpdateDocument en useUpdateUploadedDocument
export const useUpdateUploadedDocument = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ documentId, file }) => {
            const formData = new FormData();
            formData.append("document", file);

            const res = await fetch(`/api/documents/update/${documentId}`, {
                method: "PUT",
                body: formData,
            });

            if (!res.ok) throw new Error("Échec de la mise à jour du document");
            return res.json();
        },
        onSuccess: () => {
            toast.success("Document mis à jour avec succès !");
            setTimeout(() => {
                queryClient.invalidateQueries(["authUser"]);
            }, 1000);
        },
        onError: (error) => {
            toast.error(error.message || "Erreur lors de la mise à jour");
        },
    });
};

export const useDeleteDocument = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (documentId) => {
            const res = await fetch(`/api/documents/delete/${documentId}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Échec de la suppression du document");
            return res.json();
        },
        onSuccess: () => {
            toast.success("Document supprimé avec succès !");
            setTimeout(() => {
                queryClient.invalidateQueries(["authUser"]);
            }, 1000);
        },
        onError: (error) => {
            toast.error(error.message || "Erreur lors de la suppression");
        },
    });
};
