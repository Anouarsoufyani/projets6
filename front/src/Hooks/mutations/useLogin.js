import { useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"

export const useLogin = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ email, password }) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong")
      }

      return data
    },
    onSuccess: () => {
      toast.success("Login successful")
      queryClient.invalidateQueries({ queryKey: ["authUser"] })
    },
    onError: (error) => {
      console.log(error)
      toast.error(error.message)
    },
  })
}
