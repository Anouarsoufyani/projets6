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
    const commande = commandes.reduce((prev, current) =>
        prev.date_de_creation > current.date_de_creation &&
        current.statut !== "livree"
            ? prev
            : current
    );
    if (commande.statut === "livree") {
        return null;
    }

    console.log("CONMNCENEOCNEOCENOCNEOCE ", commande);

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
