import { useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"

const api = import.meta.env.VITE_API_URL

const useUpdateProfile = () => {
  const queryClient = useQueryClient()

  const { mutateAsync: updateProfile, isPending: isUpdatingProfile } = useMutation({
    mutationFn: async (formData) => {
      const res = await fetch(`${api}/user/update`, {
        method: "PUT", // Changé en PUT pour une mise à jour (plus idiomatique que POST)
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la mise à jour du profil")
      }
      console.log("Profil mis à jour :", data)
      return data.user // Retourne l'utilisateur mis à jour (ajusté selon ta réponse API)
    },
    onSuccess: () => {
      toast.success("Profil mis à jour avec succès")
      // Invalide les caches pour rafraîchir les données
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["userProfile"],
        }),
        queryClient.invalidateQueries({ queryKey: ["authUser"] }),
      ])
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  return { updateProfile, isUpdatingProfile }
}

export default useUpdateProfile
