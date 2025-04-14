import { useMutation } from "@tanstack/react-query"
import toast from "react-hot-toast"

export const useSignup = () => {
  return useMutation({
    mutationFn: async ({ email, nom, password, numero, role }) => {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          nom,
          password,
          numero,
          role,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong")
      }

      return data
    },
    onSuccess: () => {
      toast.success("Account created successfully")
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}
