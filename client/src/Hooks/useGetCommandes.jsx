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
    // console.log("user commandes", data);

    return data;
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
    console.log("DHEUFHEUFHE", data.data);

    return data.data;
};

export const useGetCommandeById = (id) => {
    return useQuery({
        queryKey: ["getCommandeById", id],
        queryFn: () => getCommandeById(id),
        retry: false,
        refetchInterval: 10000,
    });
};

export const useGetUserCommandes = () => {
    return useQuery({
        queryKey: ["getUserCommandes"],
        queryFn: () => getUserCommandes(),
        retry: false,
        refetchInterval: 10000,
    });
};
