import { useMutation } from "@tanstack/react-query"
import toast from "react-hot-toast"

export const useCreateCommande = () => {
  return useMutation({
    mutationFn: async (commandeData) => {
      const res = await fetch(`/api/commandes/new`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(commandeData),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la création de la commande")
      }

      return data
    },
    onSuccess: () => {
      toast.success("Commande créée avec succès")
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}
