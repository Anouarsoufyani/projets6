"use client"


import { useState, useRef } from "react"

const useGoogleMapDirections = (options = {}) => {
  const [distance, setDistance] = useState(null)
  const [duration, setDuration] = useState(null)
  const [directionsResponse, setDirectionsResponse] = useState(null)
  const mapRef = useRef(null)
  const directionsRendererRef = useRef(null)

  const onMapLoad = (map) => {
    mapRef.current = map


    if (!directionsRendererRef.current) {
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
        map,
        suppressMarkers: options.suppressMarkers || true,
        polylineOptions: {
          strokeColor: options.strokeColor || "#10b981",
          strokeWeight: options.strokeWeight || 5,
          strokeOpacity: options.strokeOpacity || 0.8,
        },
      })
    }
  }

  const calculateRoute = async (origin, destination) => {
    if (!origin || !destination) {
      console.log("Positions invalides pour le calcul d'itinéraire")
      return
    }

    try {

      const directionsService = new window.google.maps.DirectionsService()

      const results = await directionsService.route({
        origin: origin,
        destination: destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      })

      setDirectionsResponse(results)
      setDistance(results.routes[0].legs[0].distance.text)
      setDuration(results.routes[0].legs[0].duration.text)

      if (directionsRendererRef.current) {
        directionsRendererRef.current.setDirections(results)
      }
    } catch (error) {
      console.error("Erreur lors du calcul de l'itinéraire:", error)
    }
  }

  const clearDirections = () => {
    setDistance(null)
    setDuration(null)
    setDirectionsResponse(null)

    if (directionsRendererRef.current) {
      directionsRendererRef.current.setDirections({ routes: [] })
    }
  }

  return {
    distance,
    duration,
    calculateRoute,
    onMapLoad,
    clearDirections,
  }
}

export default useGoogleMapDirections
