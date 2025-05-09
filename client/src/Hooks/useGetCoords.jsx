import { useQuery } from "@tanstack/react-query"

const API_KEY = "AIzaSyD9buKfiAVASpx1zzEWbuSyHI05CaJyQ6c" 

const getCoords = async (adresse) => {
  if (!adresse) throw new Error("L'adresse ne peut pas être vide")

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(adresse)}&key=${API_KEY}`
  const response = await fetch(url)
  const data = await response.json()

  if (data.status !== "OK") {
    throw new Error(data.error_message || "Impossible de récupérer les coordonnées")
  }

  return data.results[0].geometry.location
}

export const useGetCoords = (adresse) => {
  return useQuery({
    queryKey: ["getCoords", adresse],
    queryFn: () => getCoords(adresse),
    enabled: !!adresse, 
    retry: false,
  })
}
