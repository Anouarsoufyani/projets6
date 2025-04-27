"use client"

import { useState, useEffect, useCallback } from "react"
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api"
import { useNavigate, useParams } from "react-router"
import { toast } from "react-hot-toast"
// Ajouter un nouvel import pour l'icône de recherche
import {
  FaFilter,
  FaMapMarkerAlt,
  FaStar,
  FaCar,
  FaMotorcycle,
  FaBiking,
  FaBox,
  FaTruck,
  FaSearch,
  FaRobot,
  FaUserEdit,
} from "react-icons/fa"

// Import des hooks modularisés
import {
  useAvailableLivreurs,
  useAuthUserQuery,
  useGetCoords,
  useAssignLivreur, // Remplacer useRequestLivreur par useAssignLivreur
  useGoogleMapDirections,
} from "../../Hooks"

const mapContainerStyle = {
  width: "100%",
  height: "100%",
  borderRadius: "0.5rem",
}

const SelectLivreurPage = () => {
  const { data: livreurs, isLoading, error } = useAvailableLivreurs()
  const [selectedLivreur, setSelectedLivreur] = useState(null)
  const [selectedMarker, setSelectedMarker] = useState(null)
  const [mapZoom, setMapZoom] = useState(13)
  const { data: authUser } = useAuthUserQuery()
  const adresseCommercantFormatee =
    authUser?.adresse_boutique?.rue +
    ", " +
    authUser?.adresse_boutique?.ville +
    ", " +
    authUser?.adresse_boutique?.code_postal
  const position = useGetCoords(adresseCommercantFormatee)
  const navigate = useNavigate()
  const [livreurDistances, setLivreurDistances] = useState({})
  const [isCalculatingDistances, setIsCalculatingDistances] = useState(false)
  // Ajouter un nouvel état pour la recherche par nom
  const [searchQuery, setSearchQuery] = useState("")
  // Ajouter un état pour le mode d'assignation
  const [assignationMode, setAssignationMode] = useState(null) // null, "manual", "auto"

  // Ajouter un état pour les critères d'assignation automatique
  // Modifier la structure des critères d'assignation automatique pour inclure l'ordre de priorité
  const [autoCriteria, setAutoCriteria] = useState({
    vehicleTypes: [],
    criteria: [], // Tableau qui contiendra les critères dans l'ordre de priorité
  })
  // Utiliser useParams pour récupérer l'ID de la commande
  const { commandeId } = useParams()

  // Initialiser avec une position par défaut pour la France
  const [mapCenter, setMapCenter] = useState({
    lat: 46.603354, // Centre de la France
    lng: 1.888334,
  })

  // Modifier la structure de l'état sortBy pour gérer plusieurs critères
  const [sortCriteria, setSortCriteria] = useState([]) // ["distance", "note", "duration"]
  const [sortBy, setSortBy] = useState(null) // "distance" ou "note"
  const [vehiculeFilter, setVehiculeFilter] = useState([]) // ["voiture", "moto"]
  const [showFilters, setShowFilters] = useState(false)

  // Utiliser le hook de mutation modularisé
  // const assignLivreurMutation = useRequestLivreur()
  const assignLivreur = useAssignLivreur()

  // Mettre à jour le centre de la carte quand les coordonnées sont chargées
  useEffect(() => {
    if (position.data) {
      setMapCenter(position.data)
    }
  }, [position.data])

  // Utiliser notre hook personnalisé pour les directions
  const { distance, duration, calculateRoute, onMapLoad, clearDirections } = useGoogleMapDirections({
    strokeColor: "#10b981", // emerald-500
    strokeWeight: 5,
    strokeOpacity: 0.8,
    suppressMarkers: true,
  })

  // Modifier la fonction calculateRealDistances pour prendre en compte le type de véhicule
  const calculateRealDistances = useCallback(async () => {
    if (!position.data || !livreurs || livreurs.length === 0 || !window.google) {
      return
    }

    setIsCalculatingDistances(true)
    const distanceMatrixService = new window.google.maps.DistanceMatrixService()
    const origin = { lat: position.data.lat, lng: position.data.lng }
    const destinations = livreurs.map((livreur) => ({
      lat: livreur.position.lat,
      lng: livreur.position.lng,
    }))

    try {
      const response = await distanceMatrixService.getDistanceMatrix({
        origins: [origin],
        destinations: destinations.map((dest) => new window.google.maps.LatLng(dest.lat, dest.lng)),
        travelMode: window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.METRIC,
      })

      const newDistances = {}
      if (response.rows[0] && response.rows[0].elements) {
        livreurs.forEach((livreur, index) => {
          const element = response.rows[0].elements[index]
          if (element && element.status === "OK") {
            // Ajuster la durée en fonction du type de véhicule
            const vehicleType = livreur.vehicule?.type?.toLowerCase() || "autres"
            let durationValue = element.duration.value // en secondes
            let durationText = element.duration.text

            // Facteurs d'ajustement de la durée selon le véhicule
            const adjustmentFactor = getVehicleSpeedFactor(vehicleType)

            if (vehicleType !== "voiture") {
              // Ajuster la durée pour les véhicules autres que voiture
              durationValue = Math.round(durationValue * adjustmentFactor)
              const minutes = Math.floor(durationValue / 60)
              durationText = `~${minutes} min`
            }

            newDistances[livreur._id] = {
              distance: element.distance.text,
              duration: durationText,
              distanceValue: element.distance.value, // en mètres
              durationValue: durationValue, // en secondes ajustées
              vehicleType: vehicleType,
            }
          } else {
            // Fallback pour les cas où l'API ne peut pas calculer la distance
            const directDistance = getDirectDistance(
              position.data.lat,
              position.data.lng,
              livreur.position.lat,
              livreur.position.lng,
            )

            const vehicleType = livreur.vehicule?.type?.toLowerCase() || "autres"
            // Estimation de la durée basée sur la distance et le type de véhicule
            const speedKmh = getVehicleSpeed(vehicleType)
            const estimatedDurationMinutes = Math.round((directDistance / speedKmh) * 60)

            newDistances[livreur._id] = {
              distance: `~${directDistance.toFixed(1)} km`,
              duration: `~${estimatedDurationMinutes} min`,
              distanceValue: directDistance * 1000, // conversion en mètres
              durationValue: estimatedDurationMinutes * 60, // conversion en secondes
              vehicleType: vehicleType,
            }
          }
        })
      }
      setLivreurDistances(newDistances)
      console.log("Distances calculées:", newDistances)
    } catch (error) {
      console.error("Erreur lors du calcul des distances:", error)
      // Fallback avec calcul direct en cas d'erreur
      const newDistances = {}
      livreurs.forEach((livreur) => {
        const directDistance = getDirectDistance(
          position.data.lat,
          position.data.lng,
          livreur.position.lat,
          livreur.position.lng,
        )

        const vehicleType = livreur.vehicule?.type?.toLowerCase() || "autres"
        // Estimation de la durée basée sur la distance et le type de véhicule
        const speedKmh = getVehicleSpeed(vehicleType)
        const estimatedDurationMinutes = Math.round((directDistance / speedKmh) * 60)

        newDistances[livreur._id] = {
          distance: `~${directDistance.toFixed(1)} km`,
          duration: `~${estimatedDurationMinutes} min`,
          distanceValue: directDistance * 1000,
          durationValue: estimatedDurationMinutes * 60,
          vehicleType: vehicleType,
        }
      })
      setLivreurDistances(newDistances)
    } finally {
      setIsCalculatingDistances(false)
    }
  }, [position.data, livreurs])

  // Ajouter ces fonctions pour calculer la vitesse selon le type de véhicule
  const getVehicleSpeed = (vehicleType) => {
    switch (vehicleType) {
      case "voiture":
        return 50 // 50 km/h
      case "moto":
        return 45 // 45 km/h
      case "vélo":
        return 15 // 15 km/h
      case "autres":
        return 5 // 5 km/h (à pied)
      default:
        return 30 // Valeur par défaut
    }
  }

  const getVehicleSpeedFactor = (vehicleType) => {
    // Facteur par rapport à la voiture (1.0)
    switch (vehicleType) {
      case "voiture":
        return 1.0
      case "moto":
        return 1.1 // Légèrement plus rapide en ville (embouteillages)
      case "vélo":
        return 3.3 // 50/15 = 3.33 fois plus lent
      case "autres":
        return 10.0 // 50/5 = 10 fois plus lent
      default:
        return 1.7 // Valeur par défaut
    }
  }

  // Calculer les distances réelles lorsque les livreurs et la position sont disponibles
  useEffect(() => {
    if (position.data && livreurs && livreurs.length > 0 && window.google) {
      calculateRealDistances()
    }
  }, [position.data, livreurs, calculateRealDistances])

  // Modifier les fonctions d'assignation pour utiliser le hook unifié

  // Remplacer la fonction confirmAssignLivreur
  const confirmAssignLivreur = () => {
    if (!selectedLivreur) {
      toast.error("Veuillez sélectionner un livreur")
      return
    }

    if (!commandeId) {
      toast.error("ID de commande manquant")
      return
    }

    // Seul endroit où assignLivreur est appelé en mode manuel
    assignLivreur({
      commandeId,
      livreurId: selectedLivreur._id,
      mode: "manual", // Mode manuel
    })

    // Informer l'utilisateur
    toast.success(`Livreur ${selectedLivreur.nom} assigné à la commande`)

    // Rediriger vers la page des commandes
    navigate("/commandes")
  }

  // Ajouter cette fonction pour l'assignation automatique
  // Modifier la fonction d'assignation automatique pour envoyer les nouveaux critères
  // Remplacer la fonction assignLivreurAutomatically
  const assignLivreurAutomatically = useCallback(async () => {
    if (!commandeId) {
      toast.error("ID de commande manquant")
      return
    }

    // Vérifier qu'au moins un critère est sélectionné
    if (autoCriteria.criteria.length === 0) {
      toast.error("Veuillez sélectionner au moins un critère de priorité")
      return
    }

    // Préparer les données à envoyer
    const criteriaWithOrder = autoCriteria.criteria.map((criterion, index) => ({
      type: criterion,
      order: index + 1,
      enabled: true,
    }))

    try {
      // Utiliser le hook unifié avec le mode 'auto'
      assignLivreur({
        commandeId,
        mode: "auto",
        vehicleTypes: autoCriteria.vehicleTypes,
        criteria: criteriaWithOrder,
      })
    } catch (error) {
      toast.error(error.message || "Erreur lors de l'assignation automatique")
    }
  }, [commandeId, autoCriteria, assignLivreur])

  // Modifier la logique de filtrage pour inclure la recherche par nom
  let filteredLivreurs = livreurs || []

  // Filtrer par recherche de nom
  if (searchQuery.trim() !== "") {
    filteredLivreurs = filteredLivreurs.filter((livreur) =>
      livreur.nom.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }

  // Filtrer par type de véhicule (code existant)
  if (vehiculeFilter.length > 0) {
    filteredLivreurs = filteredLivreurs.filter((livreur) => vehiculeFilter.includes(livreur.vehicule?.type))
  }

  // Remplacer le return principal pour inclure la sélection du mode d'assignation
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="loading loading-spinner loading-lg text-emerald-600"></span>
      </div>
    )
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">Une erreur est survenue lors du chargement des livreurs</div>
  }

  // Gérer le cas où il n'y a pas de livreurs disponibles
  if (livreurs && livreurs.length === 0) {
    return (
      <div className="w-full h-full p-6 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-emerald-700 mb-6">Livraison - Sélection des livreurs disponibles</h1>
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <p className="text-lg text-gray-700">Aucun livreur disponible actuellement.</p>
          <button
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
            onClick={() => window.location.reload()}
          >
            Rafraîchir
          </button>
        </div>
      </div>
    )
  }

  // Afficher l'écran de sélection du mode d'assignation si aucun mode n'est sélectionné
  if (assignationMode === null) {
    return (
      <div className="w-full h-full p-6 flex flex-col">
        <h1 className="text-2xl font-bold text-emerald-700 mb-6">
          {commandeId
            ? `Assigner un livreur à la commande #${commandeId.slice(-6)}`
            : "Livraison - Sélection des livreurs disponibles"}
        </h1>

        <div className="flex flex-col md:flex-row gap-6 justify-center items-center mt-10">
          <div
            className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer w-full max-w-md flex flex-col items-center gap-4 border-2 border-transparent hover:border-emerald-500"
            onClick={() => setAssignationMode("manual")}
          >
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
              <FaUserEdit className="text-4xl text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-emerald-700">Assignation Manuelle</h2>
            <p className="text-center text-gray-600">
              Choisissez vous-même le livreur parmi les disponibles. Vous pourrez filtrer par distance, note, et type de
              véhicule.
            </p>
            <button className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors">
              Sélectionner
            </button>
          </div>

          <div
            className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer w-full max-w-md flex flex-col items-center gap-4 border-2 border-transparent hover:border-blue-500"
            onClick={() => setAssignationMode("auto")}
          >
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
              <FaRobot className="text-4xl text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-blue-700">Assignation Automatique</h2>
            <p className="text-center text-gray-600">
              Laissez le système choisir le meilleur livreur selon vos critères de préférence.
            </p>
            <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              Sélectionner
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Afficher l'écran d'assignation automatique
  if (assignationMode === "auto") {
    return (
      <div className="w-full h-full p-6 flex flex-col">
        <h1 className="text-2xl font-bold text-emerald-700 mb-6">
          {commandeId
            ? `Assignation automatique pour la commande #${commandeId.slice(-6)}`
            : "Assignation automatique de livreur"}
        </h1>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-blue-700 mb-4">Critères d'assignation</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Type de véhicule préféré:</h3>
              <div className="flex flex-wrap gap-2">
                <label
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                    autoCriteria.vehicleTypes.includes("voiture")
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={autoCriteria.vehicleTypes.includes("voiture")}
                    onChange={() => {
                      setAutoCriteria((prev) => {
                        if (prev.vehicleTypes.includes("voiture")) {
                          return { ...prev, vehicleTypes: prev.vehicleTypes.filter((t) => t !== "voiture") }
                        } else {
                          return { ...prev, vehicleTypes: [...prev.vehicleTypes, "voiture"] }
                        }
                      })
                    }}
                  />
                  <span className={autoCriteria.vehicleTypes.includes("voiture") ? "text-white" : "text-blue-600"}>
                    <FaCar />
                  </span>
                  <span>Voiture</span>
                </label>

                <label
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                    autoCriteria.vehicleTypes.includes("moto")
                      ? "bg-red-600 text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={autoCriteria.vehicleTypes.includes("moto")}
                    onChange={() => {
                      setAutoCriteria((prev) => {
                        if (prev.vehicleTypes.includes("moto")) {
                          return { ...prev, vehicleTypes: prev.vehicleTypes.filter((t) => t !== "moto") }
                        } else {
                          return { ...prev, vehicleTypes: [...prev.vehicleTypes, "moto"] }
                        }
                      })
                    }}
                  />
                  <span className={autoCriteria.vehicleTypes.includes("moto") ? "text-white" : "text-red-600"}>
                    <FaMotorcycle />
                  </span>
                  <span>Moto</span>
                </label>

                <label
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                    autoCriteria.vehicleTypes.includes("vélo")
                      ? "bg-green-600 text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={autoCriteria.vehicleTypes.includes("vélo")}
                    onChange={() => {
                      setAutoCriteria((prev) => {
                        if (prev.vehicleTypes.includes("vélo")) {
                          return { ...prev, vehicleTypes: prev.vehicleTypes.filter((t) => t !== "vélo") }
                        } else {
                          return { ...prev, vehicleTypes: [...prev.vehicleTypes, "vélo"] }
                        }
                      })
                    }}
                  />
                  <span className={autoCriteria.vehicleTypes.includes("vélo") ? "text-white" : "text-green-600"}>
                    <FaBiking />
                  </span>
                  <span>Vélo</span>
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Si aucun type n'est sélectionné, tous les types seront considérés.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Priorités (cliquez dans l'ordre d'importance):</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                <button
                  onClick={() => {
                    setAutoCriteria((prev) => {
                      // Si déjà présent, le retirer
                      if (prev.criteria.includes("distance")) {
                        return {
                          ...prev,
                          criteria: prev.criteria.filter((c) => c !== "distance"),
                        }
                      } else {
                        // Sinon l'ajouter à la fin
                        return {
                          ...prev,
                          criteria: [...prev.criteria, "distance"],
                        }
                      }
                    })
                  }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors relative ${
                    autoCriteria.criteria.includes("distance")
                      ? "bg-emerald-600 text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  <FaMapMarkerAlt
                    className={autoCriteria.criteria.includes("distance") ? "text-white" : "text-emerald-600"}
                  />
                  <span>Distance</span>
                  {autoCriteria.criteria.includes("distance") && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {autoCriteria.criteria.indexOf("distance") + 1}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setAutoCriteria((prev) => {
                      if (prev.criteria.includes("duration")) {
                        return {
                          ...prev,
                          criteria: prev.criteria.filter((c) => c !== "duration"),
                        }
                      } else {
                        return {
                          ...prev,
                          criteria: [...prev.criteria, "duration"],
                        }
                      }
                    })
                  }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors relative ${
                    autoCriteria.criteria.includes("duration")
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  <span className={autoCriteria.criteria.includes("duration") ? "text-white" : "text-blue-600"}>⏱️</span>
                  <span>Durée</span>
                  {autoCriteria.criteria.includes("duration") && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {autoCriteria.criteria.indexOf("duration") + 1}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setAutoCriteria((prev) => {
                      if (prev.criteria.includes("rating")) {
                        return {
                          ...prev,
                          criteria: prev.criteria.filter((c) => c !== "rating"),
                        }
                      } else {
                        return {
                          ...prev,
                          criteria: [...prev.criteria, "rating"],
                        }
                      }
                    })
                  }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors relative ${
                    autoCriteria.criteria.includes("rating")
                      ? "bg-yellow-600 text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  <FaStar className={autoCriteria.criteria.includes("rating") ? "text-white" : "text-yellow-500"} />
                  <span>Note</span>
                  {autoCriteria.criteria.includes("rating") && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {autoCriteria.criteria.indexOf("rating") + 1}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setAutoCriteria((prev) => {
                      if (prev.criteria.includes("weight")) {
                        return {
                          ...prev,
                          criteria: prev.criteria.filter((c) => c !== "weight"),
                        }
                      } else {
                        return {
                          ...prev,
                          criteria: [...prev.criteria, "weight"],
                        }
                      }
                    })
                  }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors relative ${
                    autoCriteria.criteria.includes("weight")
                      ? "bg-purple-600 text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  <FaBox className={autoCriteria.criteria.includes("weight") ? "text-white" : "text-purple-600"} />
                  <span>Poids</span>
                  {autoCriteria.criteria.includes("weight") && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {autoCriteria.criteria.indexOf("weight") + 1}
                    </span>
                  )}
                </button>
              </div>

              {autoCriteria.criteria.length > 0 && (
                <div className="mt-2 p-2 bg-gray-50 rounded-md border border-gray-200">
                  <p className="text-sm text-gray-700 font-medium">Ordre de priorité:</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {autoCriteria.criteria.map((criterion, index) => (
                      <div
                        key={criterion}
                        className="flex items-center gap-1 px-2 py-1 bg-white border border-gray-300 rounded-md"
                      >
                        <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <span className="text-sm">
                          {criterion === "distance" && "Distance"}
                          {criterion === "duration" && "Durée"}
                          {criterion === "rating" && "Note"}
                          {criterion === "weight" && "Poids"}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setAutoCriteria((prev) => ({
                              ...prev,
                              criteria: prev.criteria.filter((c) => c !== criterion),
                            }))
                          }}
                          className="ml-1 text-gray-500 hover:text-red-500"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Le système assignera un livreur en priorisant les critères dans cet ordre.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex gap-4 justify-end">
            <button
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              onClick={() => setAssignationMode(null)}
            >
              Retour
            </button>
            <button
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
              onClick={assignLivreurAutomatically}
            >
              <FaRobot className="text-white" />
              Assigner automatiquement
            </button>
          </div>
        </div>
      </div>
    )
  }
  const columns = ["ID", "Nom", "Véhicule", "Distance", "Durée", "Note", "Actions"]

  const handleSelectLivreur = (livreur) => {
    // Nettoyer les directions précédentes avant tout
    clearDirections()

    setSelectedLivreur(livreur)
    // Centrer la carte sur le livreur sélectionné
    const livreurPosition = livreur.position
    setMapCenter({ lat: livreurPosition.lat, lng: livreurPosition.lng })
    setMapZoom(12) // Zoom plus proche

    // Calculer l'itinéraire si les positions sont disponibles
    if (position.data && livreurPosition) {
      calculateRoute(
        { lat: livreurPosition.lat, lng: livreurPosition.lng },
        { lat: position.data.lat, lng: position.data.lng },
      )
    }

    // Afficher confirmation ou détails supplémentaires
    toast.success(`Livreur ${livreur.nom} sélectionné`)
    // Pas d'appel à assignLivreur ici - seulement lors de la confirmation
  }

  // Gérer le cas où il n'y a pas de livreurs disponibles
  if (livreurs && livreurs.length === 0) {
    return (
      <div className="w-full h-full  p-6 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-emerald-700 mb-6">Livraison - Sélection des livreurs disponibles</h1>
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <p className="text-lg text-gray-700">Aucun livreur disponible actuellement.</p>
          <button
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
            onClick={() => window.location.reload()}
          >
            Rafraîchir
          </button>
        </div>
      </div>
    )
  }

  // Remplacer la logique de tri pour gérer plusieurs critères
  // Modifier la partie du code qui gère le tri des livreurs

  // Appliquer les critères de tri dans l'ordre
  if (sortCriteria.length > 0 && Object.keys(livreurDistances).length > 0) {
    filteredLivreurs = [...filteredLivreurs].sort((a, b) => {
      // Parcourir tous les critères de tri
      for (const criterion of sortCriteria) {
        if (criterion === "distance") {
          const distA = livreurDistances[a._id]?.distanceValue || Number.POSITIVE_INFINITY
          const distB = livreurDistances[b._id]?.distanceValue || Number.POSITIVE_INFINITY
          if (distA !== distB) return distA - distB
        } else if (criterion === "duration") {
          const durA = livreurDistances[a._id]?.durationValue || Number.POSITIVE_INFINITY
          const durB = livreurDistances[b._id]?.durationValue || Number.POSITIVE_INFINITY
          if (durA !== durB) return durA - durB
        } else if (criterion === "note") {
          if (b.note_moyenne !== a.note_moyenne) return b.note_moyenne - a.note_moyenne
        }
      }
      return 0 // Si tous les critères sont égaux
    })
  }

  // Fonction pour obtenir l'icône du véhicule
  const getVehicleIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "voiture":
        return <FaCar className="text-blue-600" />
      case "moto":
        return <FaMotorcycle className="text-red-600" />
      case "vélo":
        return <FaBiking className="text-green-600" />
      case "autres":
        return <FaBox className="text-purple-600" />
      default:
        return <FaBox className="text-gray-600" />
    }
  }

  // Ajouter cette fonction pour calculer la distance directe (à vol d'oiseau) comme fallback
  const getDirectDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371 // Rayon de la Terre en km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c // Distance en km
  }

  // Modifier la fonction pour gérer les critères de tri
  const toggleSortCriterion = (criterion) => {
    setSortCriteria((prev) => {
      if (prev.includes(criterion)) {
        return prev.filter((c) => c !== criterion)
      } else {
        return [...prev, criterion]
      }
    })
  }

  return (
    <div className="w-full h-full p-6 flex flex-col">
      <h1 className="text-2xl font-bold text-emerald-700 mb-6">
        {commandeId
          ? `Assigner un livreur à la commande #${commandeId.slice(-6)}`
          : "Livraison - Sélection des livreurs disponibles"}
      </h1>
      {/* Ajouter un bouton pour revenir à la sélection du mode d'assignation */}
      {assignationMode === "manual" && (
        <div className="mb-4">
          <button
            onClick={() => setAssignationMode(null)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors flex items-center gap-2"
          >
            <span>←</span> Changer de mode d'assignation
          </button>
        </div>
      )}
      {selectedLivreur && (
        <div className="mb-4 p-4 bg-emerald-100 border border-emerald-300 rounded-md flex justify-between items-center">
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <span className="font-semibold text-emerald-800">Livreur sélectionné: </span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{selectedLivreur.nom}</span>
              <div className="flex items-center gap-1 text-sm bg-white px-2 py-1 rounded-full">
                {getVehicleIcon(selectedLivreur.vehicule?.type)}
                <span>{selectedLivreur.vehicule?.type || "N/A"}</span>
              </div>
              <div className="flex items-center gap-1 text-sm bg-white px-2 py-1 rounded-full">
                <FaMapMarkerAlt className="text-red-500" />
                <span>{livreurDistances[selectedLivreur._id]?.distance || "Calcul..."}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors shadow-sm"
              onClick={commandeId ? confirmAssignLivreur : () => alert("Confirmation de commande avec ce livreur")}
              disabled={false} // Vous pouvez ajouter un état pour suivre si la requête est en cours
            >
              {"Confirmer"}
            </button>
            <button
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors shadow-sm"
              onClick={() => {
                clearDirections()
                setSelectedLivreur(null)
              }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {selectedLivreur && distance && duration && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-blue-700">Distance: </span>
              <span className="bg-white px-2 py-1 rounded-full text-blue-700 font-medium">{distance}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-blue-700">Durée estimée: </span>
              <span className="bg-white px-2 py-1 rounded-full text-blue-700 font-medium">{duration}</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 gap-5 rounded-lg md:flex-row-reverse flex-col min-h-[600px]">
        {/* Carte placée avant le tableau pour l'ordre sur mobile */}
        <div className="md:w-7/12 w-full h-96 md:min-h-[600px]">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={mapZoom}
            options={{
              styles: [
                {
                  featureType: "poi",
                  elementType: "labels",
                  stylers: [{ visibility: "off" }],
                },
              ],
              fullscreenControl: false,
              streetViewControl: false,
              mapTypeControl: true,
              zoomControl: true,
            }}
            onLoad={onMapLoad}
          >
            {position.data && (
              <>
                <Marker
                  position={{
                    lat: position.data.lat,
                    lng: position.data.lng,
                  }}
                  icon={{
                    url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
                    scaledSize: new window.google.maps.Size(60, 60),
                  }}
                  label={{
                    text: "Votre Boutique",
                    color: "black",
                    fontWeight: "bold",
                    fontSize: "14px",
                    className: "marker-label",
                    background: "#2a9d8f",
                    padding: "5px",
                  }}
                />
              </>
            )}
            {livreurs &&
              livreurs.map((livreur) => {
                const position = livreur.position

                return (
                  <Marker
                    key={livreur._id}
                    position={{
                      lat: position.lat,
                      lng: position.lng,
                    }}
                    onClick={() => setSelectedMarker(livreur)}
                    icon={{
                      url:
                        selectedLivreur && selectedLivreur._id === livreur._id
                          ? "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
                          : "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
                      scaledSize: new window.google.maps.Size(40, 40),
                    }}
                    animation={
                      selectedLivreur && selectedLivreur._id === livreur._id
                        ? window.google.maps.Animation.BOUNCE
                        : null
                    }
                  />
                )
              })}

            {selectedMarker && (
              <InfoWindow
                position={{
                  lat: selectedMarker.position.lat,
                  lng: selectedMarker.position.lng,
                }}
                onCloseClick={() => setSelectedMarker(null)}
              >
                <div className="p-3 max-w-xs">
                  <h3 className="font-semibold text-lg text-emerald-700 mb-2">{selectedMarker.nom}</h3>
                  <div className="space-y-2">
                    <p className="flex items-center gap-2 text-sm">
                      {getVehicleIcon(selectedMarker.vehicule?.type)}
                      <span className="text-gray-700">
                        <span className="font-medium">Véhicule:</span> {selectedMarker.vehicule?.type || "N/A"}
                      </span>
                    </p>
                    <p className="flex items-center gap-2 text-sm">
                      <FaStar className="text-yellow-500" />
                      <span className="text-gray-700">
                        <span className="font-medium">Note:</span> {selectedMarker.note_moyenne.toFixed(1)}
                        /5
                      </span>
                    </p>
                    {livreurDistances[selectedMarker._id] && (
                      <>
                        <p className="flex items-center gap-2 text-sm">
                          <FaMapMarkerAlt className="text-red-500" />
                          <span className="text-gray-700">
                            <span className="font-medium">Distance:</span>{" "}
                            {livreurDistances[selectedMarker._id].distance}
                          </span>
                        </p>
                        <p className="flex items-center gap-2 text-sm">
                          <span className="text-blue-500">⏱️</span>
                          <span className="text-gray-700">
                            <span className="font-medium">Durée:</span>{" "}
                            {livreurDistances[selectedMarker._id].duration || "Estimation en cours..."}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500 italic">
                          (basé sur {selectedMarker.vehicule?.type || "autres"})
                        </p>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => handleSelectLivreur(selectedMarker)}
                    className="mt-3 w-full text-sm bg-emerald-600 text-white px-3 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <FaTruck className="text-white" />
                    Sélectionner ce livreur
                  </button>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </div>

        <div className="md:w-5/12 w-full bg-white p-4 rounded-lg shadow-md overflow-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-emerald-800">Livreurs disponibles</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-md hover:bg-emerald-100 transition-colors"
            >
              <FaFilter className="text-emerald-600" />
              <span>Filtres</span>
            </button>
          </div>

          {/* Ajouter un champ de recherche dans la section des filtres */}
          {showFilters && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="mb-3">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Rechercher par nom:</h3>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Nom du livreur..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div className="mb-3">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Trier par (combinable):</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => toggleSortCriterion("distance")}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors ${
                      sortCriteria.includes("distance")
                        ? "bg-emerald-600 text-white"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    <FaMapMarkerAlt className={sortCriteria.includes("distance") ? "text-white" : "text-emerald-600"} />
                    <span>Distance</span>
                  </button>
                  <button
                    onClick={() => toggleSortCriterion("duration")}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors ${
                      sortCriteria.includes("duration")
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    <span className={sortCriteria.includes("duration") ? "text-white" : "text-blue-600"}>⏱️</span>
                    <span>Durée</span>
                  </button>
                  <button
                    onClick={() => toggleSortCriterion("note")}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors ${
                      sortCriteria.includes("note")
                        ? "bg-yellow-600 text-white"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    <FaStar className={sortCriteria.includes("note") ? "text-white" : "text-yellow-500"} />
                    <span>Note</span>
                  </button>
                </div>
                {sortCriteria.length > 0 && (
                  <div className="mt-2 text-xs text-gray-500">Ordre de priorité: {sortCriteria.join(" > ")}</div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Type de véhicule:</h3>
                <div className="flex flex-wrap gap-2">
                  <label
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                      vehiculeFilter.includes("voiture")
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={vehiculeFilter.includes("voiture")}
                      onChange={() => {
                        if (vehiculeFilter.includes("voiture")) {
                          setVehiculeFilter(vehiculeFilter.filter((t) => t !== "voiture"))
                        } else {
                          setVehiculeFilter([...vehiculeFilter, "voiture"])
                        }
                      }}
                    />
                    <span className={vehiculeFilter.includes("voiture") ? "text-white" : "text-blue-600"}>
                      <FaCar />
                    </span>
                    <span>Voiture</span>
                  </label>

                  <label
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                      vehiculeFilter.includes("moto")
                        ? "bg-red-600 text-white"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={vehiculeFilter.includes("moto")}
                      onChange={() => {
                        if (vehiculeFilter.includes("moto")) {
                          setVehiculeFilter(vehiculeFilter.filter((t) => t !== "moto"))
                        } else {
                          setVehiculeFilter([...vehiculeFilter, "moto"])
                        }
                      }}
                    />
                    <span className={vehiculeFilter.includes("moto") ? "text-white" : "text-red-600"}>
                      <FaMotorcycle />
                    </span>
                    <span>Moto</span>
                  </label>

                  <label
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                      vehiculeFilter.includes("vélo")
                        ? "bg-green-600 text-white"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={vehiculeFilter.includes("vélo")}
                      onChange={() => {
                        if (vehiculeFilter.includes("vélo")) {
                          setVehiculeFilter(vehiculeFilter.filter((t) => t !== "vélo"))
                        } else {
                          setVehiculeFilter([...vehiculeFilter, "vélo"])
                        }
                      }}
                    />
                    <span className={vehiculeFilter.includes("vélo") ? "text-white" : "text-green-600"}>
                      <FaBiking />
                    </span>
                    <span>Vélo</span>
                  </label>

                  <label
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                      vehiculeFilter.includes("autres")
                        ? "bg-purple-600 text-white"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={vehiculeFilter.includes("autres")}
                      onChange={() => {
                        if (vehiculeFilter.includes("autres")) {
                          setVehiculeFilter(vehiculeFilter.filter((t) => t !== "autres"))
                        } else {
                          setVehiculeFilter([...vehiculeFilter, "autres"])
                        }
                      }}
                    />
                    <span className={vehiculeFilter.includes("autres") ? "text-white" : "text-purple-600"}>
                      <FaBox />
                    </span>
                    <span>Autres</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {isCalculatingDistances && (
            <div className="flex justify-center items-center py-2 mb-2 bg-blue-50 rounded-md">
              <span className="loading loading-spinner loading-sm mr-2"></span>
              <span className="text-sm text-blue-700">Calcul des distances en cours...</span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left py-4 px-4 font-semibold text-gray-600 rounded-tl-lg">ID</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-600">Nom</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-600">Véhicule</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-600">Distance</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-600">Durée</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-600">Note</th>
                  <th className="text-right py-4 px-4 font-semibold text-gray-600 rounded-tr-lg">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLivreurs.map((livreur, index) => (
                  <tr
                    key={livreur._id}
                    className={`hover:bg-emerald-50 transition-colors duration-150 cursor-pointer ${
                      selectedLivreur && selectedLivreur._id === livreur._id ? "bg-emerald-50" : ""
                    } ${index === filteredLivreurs.length - 1 ? "rounded-b-lg" : ""}`}
                    onClick={() => setSelectedMarker(livreur)}
                  >
                    <td className="py-4 px-4 font-medium text-emerald-600">{livreur._id.slice(-6)}</td>
                    <td className="py-4 px-4">{livreur.nom}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1">
                        {getVehicleIcon(livreur.vehicule?.type)}
                        <span>{livreur.vehicule?.type || "N/A"}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">{livreurDistances[livreur._id]?.distance || "Calcul..."}</td>
                    <td className="py-4 px-4">{livreurDistances[livreur._id]?.duration || "Calcul..."}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1">
                        <FaStar className="text-yellow-500" />
                        <span>{livreur.note_moyenne.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        className={`px-3 py-1 rounded-md ${
                          selectedLivreur && selectedLivreur._id === livreur._id
                            ? "bg-emerald-600 text-white"
                            : "text-emerald-600 border border-emerald-600 hover:bg-emerald-50"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSelectLivreur(livreur)
                        }}
                      >
                        {selectedLivreur && selectedLivreur._id === livreur._id ? "Sélectionné" : "Sélectionner"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SelectLivreurPage
