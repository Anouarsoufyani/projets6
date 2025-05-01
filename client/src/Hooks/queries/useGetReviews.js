import { useQuery } from "@tanstack/react-query";
import { useAuthUserQuery } from "./useAuthQueries";

// Récupérer les avis pour un utilisateur spécifique (commerçant ou livreur)
export const getReviewsForUser = async (userId) => {
    if (!userId) return [];

    const res = await fetch(`/api/reviews/user/${userId}`);

    if (!res.ok) {
        throw new Error("Erreur lors de la récupération des avis");
    }

    const data = await res.json();
    return data.reviews || [];
};

// Récupérer les avis soumis par l'utilisateur connecté
export const getUserReviews = async () => {
    const res = await fetch(`/api/reviews/my-reviews`);

    if (!res.ok) {
        throw new Error("Erreur lors de la récupération des avis");
    }

    const data = await res.json();
    return data.reviews || [];
};

// Hook pour récupérer les avis pour un utilisateur spécifique
export const useGetReviewsForUser = (userId) => {
    return useQuery({
        queryKey: ["getReviews", userId],
        queryFn: () => getReviewsForUser(userId),
        enabled: !!userId,
        retry: false,
    });
};

// Hook pour récupérer les avis laissés par l'utilisateur connecté
export const useGetUserReviews = () => {
    const { data: user } = useAuthUserQuery();

    return useQuery({
        queryKey: ["getUserReviews"],
        queryFn: getUserReviews,
        enabled: !!user,
        retry: false,
    });
};
