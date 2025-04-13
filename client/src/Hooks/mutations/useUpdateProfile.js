import { useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"

const useUpdateProfile = () => {
  const queryClient = useQueryClient()

  const { mutateAsync: updateProfile, isPending: isUpdatingProfile } = useMutation({
    mutationFn: async (formData) => {
      const res = await fetch("/api/user/update", {
        method: "PUT",
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
      return data.user
    },
    onSuccess: () => {
      toast.success("Profil mis à jour avec succès")
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
