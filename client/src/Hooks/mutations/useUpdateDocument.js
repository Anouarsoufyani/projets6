import { useMutation } from "@tanstack/react-query";

const updateDocument = async ({ livreurId, documentId, statut }) => {
    const res = await fetch(
        `/api/user/livreur/${livreurId}/pieces/${documentId}`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ statut }),
        }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erreur");

    return data;
};

export const useUpdateDocument = () => {
    return useMutation({
        mutationFn: ({ livreurId, documentId, statut }) =>
            updateDocument({ livreurId, documentId, statut }),
    });
};
