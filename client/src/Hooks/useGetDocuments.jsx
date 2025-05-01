import { useQuery, useMutation } from "@tanstack/react-query"

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

const updateDocument = async ({ livreurId, documentId, statut }) => {
  const res = await fetch(`/api/user/livreur/${livreurId}/pieces/${documentId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ statut }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Erreur")

  return data
}

export const useGetDocuments = (id) => {
  return useQuery({
    queryKey: ["getDocuments", id],
    queryFn: () => getDocuments(id),
    retry: false,
  })
}

export const useUpdateDocument = () => {
  return useMutation({
    mutationFn: ({ livreurId, documentId, statut }) => updateDocument({ livreurId, documentId, statut }),
  })
}
