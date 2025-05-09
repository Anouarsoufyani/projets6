import { useQuery } from "@tanstack/react-query";
import { useAuthUserQuery } from "./useAuthQueries";

export const getReviewsForUser = async (userId) => {
    if (!userId) return [];

    const res = await fetch(`/api/reviews/user/${userId}`);

    if (!res.ok) {
        throw new Error("Erreur lors de la récupération des avis");
    }

    const data = await res.json();
    return data.reviews || [];
};

export const getUserReviews = async () => {
    const res = await fetch(`/api/reviews/my-reviews`);

    if (!res.ok) {
        throw new Error("Erreur lors de la récupération des avis");
    }

    const data = await res.json();
    return data.reviews || [];
};

export const useGetReviewsForUser = (userId) => {
    return useQuery({
        queryKey: ["getReviews", userId],
        queryFn: () => getReviewsForUser(userId),
        enabled: !!userId,
        retry: false,
    });
};

export const useGetUserReviews = () => {
    const { data: user } = useAuthUserQuery();

    return useQuery({
        queryKey: ["getUserReviews"],
        queryFn: getUserReviews,
        enabled: !!user,
        retry: false,
    });
};
