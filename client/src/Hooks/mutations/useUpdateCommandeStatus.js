import { useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"

export const useUpdateCommandeStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ commandeId, newStatus }) => {
      const res = await fetch(`/api/commandes/update-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ commandeId, statut: newStatus }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Erreur lors de la mise à jour du statut")
      }

      return res.json()
    },
    onSuccess: (data, variables) => {
      const statusText = variables.newStatus === "en_preparation" ? "acceptée" : "refusée"
      toast.success(`Commande ${statusText} avec succès!`)
      // Rafraîchir les données des commandes
      queryClient.invalidateQueries(["getUserCommandes"])
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de la mise à jour du statut")
    },
  })
}
