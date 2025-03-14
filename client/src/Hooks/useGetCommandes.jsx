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

export const useGetUserCommandes = () => {
    return useQuery({
        queryKey: ["getUserCommandes"],
        queryFn: () => getUserCommandes(),
        retry: false,
    });
};
