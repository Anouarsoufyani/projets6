import { useQuery } from "@tanstack/react-query";

export const getUserCommandes = async () => {
    const res = await fetch(`/api/commandes`);
    const data = await res.json();

    if (data.error) {
        return null;
    }
    if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
    }

    return data;
};

export const getLatestPendingCommande = async () => {
    const res = await fetch(`/api/commandes`);
    const data = await res.json();

    if (data.error) {
        return null;
    }
    if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
    }
    const commandes = data.commandes;
    if (!commandes || commandes.length === 0) {
        return null;
    }

    console.log("commandes", commandes);
    

    const commandesValides = commandes.filter(c =>
        c.statut !== "livree" || c.statut === "probleme"
    );
    
    const commande = commandesValides.reduce((latest, current) =>
        new Date(latest.date_creation) > new Date(current.date_creation)
            ? latest
            : current
    );
    if (commande.statut === "livree" || commande.statut === "probleme") {
        return null;
    }

    return commande;
};

const getCommandeById = async (id) => {
    const res = await fetch(`/api/commandes/${id}`);
    const data = await res.json();

    if (data.error) {
        return null;
    }
    if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
    }

    return data.data;
};

export const useGetCommandeById = (id) => {
    return useQuery({
        queryKey: ["getCommandeById", id],
        queryFn: () => getCommandeById(id),
        retry: false,
        refetchInterval: 2000,
    });
};

export const useGetUserCommandes = () => {
    return useQuery({
        queryKey: ["getUserCommandes"],
        queryFn: () => getUserCommandes(),
        retry: false,
        refetchInterval: 2000,
    });
};

export const useGetLatestPendingCommande = () => {
    return useQuery({
        queryKey: ["getLatestPendingCommande"],
        queryFn: () => getLatestPendingCommande(),
        retry: false,
        refetchInterval: 2000,
    });
};

// Function to get all commandes (admin only)
export const getAllCommandes = async () => {
    try {
        const res = await fetch(`/api/commandes/all`);

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(
                errorData.message || "Failed to fetch all commandes"
            );
        }

        const data = await res.json();
        return data;
    } catch (error) {
        console.error("Error fetching all commandes:", error);
        throw error;
    }
};

export const useGetCommandes = () => {
    return useQuery({
        queryKey: ["getAllCommandes"],
        queryFn: getAllCommandes,
        retry: 1,
        refetchInterval: 5000,
        refetchOnWindowFocus: true,
    });
};
