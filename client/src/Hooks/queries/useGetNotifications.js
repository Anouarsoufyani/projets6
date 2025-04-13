import { useQuery } from "@tanstack/react-query"
import toast from "react-hot-toast"

export const useGetNotifications = () => {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/notifications`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || "Erreur lors du chargement")
        }

        return data
      } catch (error) {
        toast.error(error.message)
        throw error
      }
    },
    retry: false,
    refetchInterval: 5000,
  })
}
