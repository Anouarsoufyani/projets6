import { useQuery } from "@tanstack/react-query"

const getDocuments = async (id) => {
  const res = await fetch(`/api/user/livreur/${id}/pieces`)
  const data = await res.json()

  if (data.error) {
    throw new Error(data.error)
  }
  if (!res.ok) {
    throw new Error("Une erreur est survenue")
  }

  return data
}

export const useGetDocuments = (id) => {
  return useQuery({
    queryKey: ["getDocuments", id],
    queryFn: () => getDocuments(id),
    retry: false,
  })
}
