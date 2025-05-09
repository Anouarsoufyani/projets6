import { useQuery } from "@tanstack/react-query"
import toast from "react-hot-toast"

export const useGetCommande = (id) => {
  return useQuery({
    queryKey: ["getCommande", id],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/commandes/${id}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })

        const data = await res.json()

        if (data.error || !res.ok) {
          throw new Error(data.error || "Erreur lors du chargement")
        }

        return data
      } catch (error) {
        toast.error(error.message)
        if (error.message === "Forbidden : Access denied") {
          window.location.href = "/commandes"
        }
        throw error
      }
    },
    retry: false,
    refetchInterval: 2000, 
  })
}
