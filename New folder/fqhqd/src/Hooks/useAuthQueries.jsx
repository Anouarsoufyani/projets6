// queries/authQueries.js
import { useQuery } from "@tanstack/react-query"

const api = import.meta.env.VITE_API_URL

export const fetchAuthUser = async () => {
  const res = await fetch(`${api}/auth/dashboard`)
  const data = await res.json()

  if (data.error) {
    return null
  }
  if (!res.ok) {
    throw new Error(data.error || "Something went wrong")
  }
  console.log("authUser", data)

  return data.data
}

export const useAuthUserQuery = () => {
  return useQuery({
    queryKey: ["authUser"],
    queryFn: fetchAuthUser,
    retry: false,
  })
}
