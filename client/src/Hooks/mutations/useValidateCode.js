import { useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"

export const useValidateCommercantCode = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, code }) => {
      const res = await fetch(`/api/commandes/code/validationCommercant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, code }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur de validation")
      return data
    },
    onSuccess: () => {
      toast.success("Commande récupérée avec succès!")
      // Invalider les requêtes pour forcer un rafraîchissement
      queryClient.invalidateQueries({ queryKey: ["getCommande"] })
      queryClient.invalidateQueries({ queryKey: ["getUserCommandes"] })
    },
    onError: (error) => {
      toast.error(error.message || "Code invalide")
    },
  })
}

export const useValidateClientCode = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, code }) => {
      const res = await fetch(`/api/commandes/code/validationClient`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, code }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur de validation")
      return data
    },
    onSuccess: () => {
      toast.success("Livraison confirmée avec succès!")
      // Invalider les requêtes pour forcer un rafraîchissement
      queryClient.invalidateQueries({ queryKey: ["getCommande"] })
      queryClient.invalidateQueries({ queryKey: ["getUserCommandes"] })
    },
    onError: (error) => {
      toast.error(error.message || "Code invalide")
    },
  })
}
