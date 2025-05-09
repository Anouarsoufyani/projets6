import { useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"

export const useCancelCommande = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const response = await fetch(`api/commandes/cancel/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: "annulee" }),
      })

      if (!response.ok) throw new Error("Échec de l'annulation")

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["getUserCommandes"])
      toast.success("Commande annulée avec succès")
    },
    onError: (error) => {
      console.error("Erreur annulation:", error)
      toast.error("Impossible d'annuler la commande")
    },
  })
}
