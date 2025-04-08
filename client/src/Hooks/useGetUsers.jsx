import { useQuery } from "@tanstack/react-query";

const fetchUsersByRole = async (role) => {
    const res = await fetch(`/api/user/gestion/${role}`);
    const data = await res.json();

    if (data.error) {
        throw new Error(data.error);
    }
    if (!res.ok) {
        throw new Error("Une erreur est survenue");
    }

    return data;
};

export const useGetUsersByRole = (role) => {
    return useQuery({
        queryKey: ["getUsersByRole", role],
        queryFn: () => fetchUsersByRole(role),
        enabled: !!role, // ← important : on évite l'exécution tant que role est vide
        retry: false,
    });
};
