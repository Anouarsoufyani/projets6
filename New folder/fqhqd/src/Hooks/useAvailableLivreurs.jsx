import { useQuery } from "@tanstack/react-query"
import toast from "react-hot-toast"

const api = import.meta.env.VITE_API_URL
export const useAvailableLivreurs = () => {
  return useQuery({
    queryKey: ["availableLivreurs"],
    queryFn: async () => {
      const res = await fetch(`${api}/user/livreurs/available`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la récupération des livreurs")
      }

      return data.data
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}
