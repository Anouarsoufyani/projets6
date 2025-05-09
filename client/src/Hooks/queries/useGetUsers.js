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

const fetchUserById = async (id) => {
    const res = await fetch(`/api/user/${id}`);
    const data = await res.json();
    console.log("data", data);

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
        enabled: !!role, 
        retry: false,
    });
};

export const useGetUserById = (id) => {
    return useQuery({
        queryKey: ["getUserById", id],
        queryFn: () => fetchUserById(id),
        enabled: !!id,
        retry: false,
    });
};
