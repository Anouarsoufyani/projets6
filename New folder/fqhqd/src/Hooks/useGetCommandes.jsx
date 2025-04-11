import { useQuery } from "@tanstack/react-query"

const api = import.meta.env.VITE_API_URL

export const getUserCommandes = async () => {
  const res = await fetch(`${api}/commandes`)
  const data = await res.json()

  if (data.error) {
    return null
  }
  if (!res.ok) {
    throw new Error(data.error || "Something went wrong")
  }
  // console.log("user commandes", data);

  return data
}

export const useGetUserCommandes = (refetchInterval = 0) => {
  return useQuery({
    queryKey: ["getUserCommandes"],
    queryFn: () => getUserCommandes(),
    retry: false,
    refetchInterval: refetchInterval, // Ajouter le paramètre refetchInterval
    refetchIntervalInBackground: true, // Rafraîchir même si l'onglet n'est pas actif
  })
}
