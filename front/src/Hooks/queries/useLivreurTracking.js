"use client"

import { useState, useEffect, useRef } from "react"
import toast from "react-hot-toast"

const useLivreurTracking = (commandeId, refreshInterval = 10000) => {
  const [livreurPosition, setLivreurPosition] = useState(null)
  const [livreurStatus, setLivreurStatus] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const intervalRef = useRef(null)
  const lastFetchTimeRef = useRef(0)

  const fetchLivreurInfo = async () => {
    // Vérifier si on a fait une requête récemment (au moins 5 secondes d'intervalle)
    const now = Date.now()
    if (now - lastFetchTimeRef.current < 5000) {
      return
    }

    lastFetchTimeRef.current = now

    try {
      const response = await fetch(`/api/commandes/${commandeId}/livreur-info`)

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 404) {
          // Gérer le cas où le livreur n'est pas assigné (erreur attendue)
          setLivreurPosition(null)
          setLivreurStatus({
            status: "en attente d'assignation",
            timestamp: new Date(),
          })
          setIsLoading(false)
          return
        }
        throw new Error(errorData.error || "Erreur lors de la récupération des informations du livreur")
      }

      const data = await response.json()

      if (data.position) {
        setLivreurPosition({
          lat: data.position.lat,
          lng: data.position.lng,
          livreurId: data.livreurId,
          timestamp: new Date(),
        })
      }

      if (data.status) {
        setLivreurStatus({
          status: data.status,
          timestamp: new Date(),
        })
      }

      setIsLoading(false)
    } catch (err) {
      // Éviter d'afficher des erreurs pour les problèmes de ressources
      if (!err.message.includes("ERR_INSUFFICIENT_RESOURCES")) {
        setError(err.message)
        setIsLoading(false)
        toast.error(err.message)
      }
    }
  }

  useEffect(() => {
    if (!commandeId) return

    // Premier chargement immédiat
    fetchLivreurInfo()

    // Configurer la mise à jour périodique avec un intervalle plus long
    const actualInterval = Math.max(10000, refreshInterval) // Au moins 10 secondes
    intervalRef.current = setInterval(fetchLivreurInfo, actualInterval)

    // Nettoyer l'intervalle lors du démontage
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [commandeId, refreshInterval])

  return { livreurPosition, livreurStatus, isLoading, error }
}

export default useLivreurTracking
