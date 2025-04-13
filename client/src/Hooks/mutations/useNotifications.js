import { useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationId) => {
      const res = await fetch(`/api/notifications/read/${notificationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Erreur lors de la mise à jour")
      }

      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["notifications"])
      toast.success("Notification marquée comme lue")
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de la mise à jour")
    },
  })
}

export const useDeleteNotification = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationId) => {
      const res = await fetch(`/api/notifications/delete/${notificationId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Erreur lors de la suppression")
      }

      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["notifications"])
      toast.success("Notification supprimée")
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de la suppression")
    },
  })
}
