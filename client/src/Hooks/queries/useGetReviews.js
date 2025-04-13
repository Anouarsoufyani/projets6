import { useQuery } from "@tanstack/react-query"

// Récupérer les avis pour un utilisateur spécifique (commerçant ou livreur)
export const getReviewsForUser = async (userId) => {
  const res = await fetch(`/api/reviews/user/${userId}`)
  const data = await res.json()

  if (data.error) {
    return null
  }
  if (!res.ok) {
    throw new Error(data.error || "Something went wrong")
  }

  return data.reviews
}

// Récupérer les avis soumis par l'utilisateur connecté
export const getUserReviews = async () => {
  const res = await fetch(`/api/reviews/my-reviews`)
  const data = await res.json()

  if (data.error) {
    return null
  }
  if (!res.ok) {
    throw new Error(data.error || "Something went wrong")
  }

  return data.reviews
}

// Hook pour récupérer les avis pour un utilisateur spécifique
export const useGetReviewsForUser = (userId) => {
  return useQuery({
    queryKey: ["getReviews", userId],
    queryFn: () => getReviewsForUser(userId),
    enabled: !!userId,
    retry: false,
  })
}

// Hook pour récupérer les avis soumis par l'utilisateur connecté
export const useGetUserReviews = () => {
  return useQuery({
    queryKey: ["getUserReviews"],
    queryFn: () => getUserReviews(),
    retry: false,
  })
}
