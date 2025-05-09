"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { GoogleMap, Marker, InfoWindow, DirectionsRenderer } from "@react-google-maps/api"
import { useNavigate, useParams } from "react-router"
import { toast } from "react-hot-toast"
import LoadingSpinner from "../../Components/UI/Loading";

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

import {
  useAvailableLivreurs,
  useAuthUserQuery,
  useGetCoords,
  useAssignLivreur, 
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

  const [searchQuery, setSearchQuery] = useState("")

  const [assignationMode, setAssignationMode] = useState(null) 


  const [autoCriteria, setAutoCriteria] = useState({
    vehicleTypes: [],
    criteria: [], 
  })

  const { commandeId } = useParams()


  const [mapCenter, setMapCenter] = useState({
    lat: 46.603354, 
    lng: 1.888334,
  })


  const [sortCriteria, setSortCriteria] = useState([]) 
  const [sortBy, setSortBy] = useState(null)
  const [vehiculeFilter, setVehiculeFilter] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  const [distance, setDistance] = useState(null)
  const [duration, setDuration] = useState(null)


  const assignLivreur = useAssignLivreur()

  const directionsRendererRef = useRef(null)
  const mapRef = useRef(null)


  useEffect(() => {
    if (position.data) {
      setMapCenter(position.data)
    }
  }, [position.data])


  const { calculateRoute, onMapLoad, clearDirections } = useGoogleMapDirections({
    strokeColor: "#10b981", 
    strokeWeight: 5,
    strokeOpacity: 0.8,
    suppressMarkers: true,
  })


  const calculateRealDistances = useCallback(async () => {
    if (!position.data || !livreurs || livreurs.length === 0 || !window.google) {
      return
    }

    setIsCalculatingDistances(true)
    const directionsService = new window.google.maps.DirectionsService()
    const origin = { lat: position.data.lat, lng: position.data.lng }

    const batchSize = 10
    const batches = []
    for (let i = 0; i < livreurs.length; i += batchSize) {
      batches.push(livreurs.slice(i, i + batchSize))
    }

    const newDistances = {}

    for (const batch of batches) {
      const promises = batch.map((livreur) => {
        return new Promise((resolve) => {
          const currentVehicle = livreur.vehicules.find((v) => v.current)
          const vehicleType = currentVehicle?.type?.toLowerCase() || "autres"
          const travelMode = getTravelModeForVehicle(vehicleType)

          directionsService.route(
            {
              origin: origin,
              destination: {
                lat: livreur.position.lat,
                lng: livreur.position.lng,
              },
              travelMode: travelMode,
              avoidHighways: vehicleType === "vélo",
              avoidTolls: vehicleType === "vélo",
            },
            (result, status) => {
              if (status === window.google.maps.DirectionsStatus.OK && result.routes[0]) {
                const route = result.routes[0]
                const leg = route.legs[0]


                const adjustmentFactor = getVehicleSpeedFactor(vehicleType)
                let durationValue = leg.duration.value 
                let durationText = leg.duration.text

                if (vehicleType !== "voiture") {

                  durationValue = Math.round(durationValue * adjustmentFactor)
                  const minutes = Math.floor(durationValue / 60)
                  durationText = `~${minutes} min`
                }

                newDistances[livreur._id] = {
                  distance: leg.distance.text,
                  duration: durationText,
                  distanceValue: leg.distance.value, 
                  durationValue: durationValue, 
                  vehicleType: vehicleType,
                  route: result, 
                }
              } else {

                const directDistance = getDirectDistance(
                  position.data.lat,
                  position.data.lng,
                  livreur.position.lat,
                  livreur.position.lng,
                )

                const speedKmh = getVehicleSpeed(vehicleType)
                const estimatedDurationMinutes = Math.round((directDistance / speedKmh) * 60)

                newDistances[livreur._id] = {
                  distance: `~${directDistance.toFixed(1)} km`,
                  duration: `~${estimatedDurationMinutes} min`,
                  distanceValue: directDistance * 1000,
                  durationValue: estimatedDurationMinutes * 60,
                  vehicleType: vehicleType,
                  isEstimate: true,
                }
              }
              resolve()
            },
          )
        })
      })


      await Promise.all(promises)


      if (batches.length > 1) {
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }

    setLivreurDistances(newDistances)
    console.log("Distances calculées:", newDistances)
    setIsCalculatingDistances(false)
  }, [position.data, livreurs])


  const getTravelModeForVehicle = (vehicleType) => {
    switch (vehicleType) {
      case "vélo":
        return window.google.maps.TravelMode.BICYCLING
      case "voiture":
      case "moto":
        return window.google.maps.TravelMode.DRIVING
      case "autres":
        return window.google.maps.TravelMode.WALKING
      default:
        return window.google.maps.TravelMode.DRIVING
    }
  }

  const getVehicleSpeed = (vehicleType) => {
    switch (vehicleType) {
      case "voiture":
        return 50 
      case "moto":
        return 45 
      case "vélo":
        return 15 
      case "autres":
        return 5 
      default:
        return 30 
    }
  }

  const getVehicleSpeedFactor = (vehicleType) => {

    switch (vehicleType) {
      case "voiture":
        return 1.0
      case "moto":
        return 1.1 
      case "vélo":
        return 3.3 
      case "autres":
        return 10.0 
      default:
        return 1.7 
    }
  }


  useEffect(() => {
    if (position.data && livreurs && livreurs.length > 0 && window.google) {
      calculateRealDistances()
    }
  }, [position.data, livreurs, calculateRealDistances])

  useEffect(() => {
    return () => {
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null)
      }
    }
  }, [])


  const confirmAssignLivreur = () => {
    if (!selectedLivreur) {
      toast.error("Veuillez sélectionner un livreur")
      return
    }

    if (!commandeId) {
      toast.error("ID de commande manquant")
      return
    }

    const loadingToast = toast.loading("Envoi de la demande au livreur...")


    assignLivreur.assignLivreur({
      commandeId,
      livreurId: selectedLivreur._id,
      mode: "manual",
    })


    toast.dismiss(loadingToast)


    toast.success(`Demande envoyée au livreur ${selectedLivreur.nom}`)


    navigate("/commandes")
  }


  const assignLivreurAutomatically = useCallback(async () => {
    if (!commandeId) {
      toast.error("ID de commande manquant")
      return
    }


    if (autoCriteria.criteria.length === 0) {
      toast.error("Veuillez sélectionner au moins un critère de priorité")
      return
    }


    const criteriaWithOrder = autoCriteria.criteria.map((criterion, index) => ({
      type: criterion,
      order: index + 1,
      enabled: true,

      value:
        criterion === "poids"
          ? 10
          : 
            criterion === "duree"
            ? 30
            : 
              criterion === "distanceMax"
              ? 10
              : 
                criterion === "note"
                ? 3
                : 0, 
    }))

    try {

      const loadingToast = toast.loading("Recherche des livreurs disponibles...")


      const result = await assignLivreur.assignLivreur({
        commandeId,
        mode: "auto",
        vehicleTypes: autoCriteria.vehicleTypes,
        criteria: criteriaWithOrder,
      })


      toast.dismiss(loadingToast)


      if (result?.data?.topLivreur) {
        toast.success(
          `Demande envoyée au livreur ${result.data.topLivreur.nom || result.data.topLivreur.id.slice(-6)} (score: ${
            result.data.topLivreur.score
          }). D'autres livreurs sont en attente si nécessaire.`,
          { duration: 5000 },
        )
      } else {
        toast.success("Demande d'assignation automatique envoyée")
      }

      navigate("/commandes")
    } catch (error) {
      toast.error(error.message || "Erreur lors de l'assignation automatique")
    }
  }, [commandeId, autoCriteria, assignLivreur, navigate])


  let filteredLivreurs = livreurs || []


  if (searchQuery.trim() !== "") {
    filteredLivreurs = filteredLivreurs.filter((livreur) =>
      livreur.nom.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }


  if (vehiculeFilter.length > 0) {
    filteredLivreurs = filteredLivreurs.filter((livreur) => vehiculeFilter.includes(livreur.vehicule?.type))
  }


  if (isLoading) {
    return (
      <LoadingSpinner/>
  )
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">Une erreur est survenue lors du chargement des livreurs</div>
  }

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
                          return {
                            ...prev,
                            vehicleTypes: prev.vehicleTypes.filter((t) => t !== "voiture"),
                          }
                        } else {
                          return {
                            ...prev,
                            vehicleTypes: [...prev.vehicleTypes, "voiture"],
                          }
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
                          return {
                            ...prev,
                            vehicleTypes: prev.vehicleTypes.filter((t) => t !== "moto"),
                          }
                        } else {
                          return {
                            ...prev,
                            vehicleTypes: [...prev.vehicleTypes, "moto"],
                          }
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
                          return {
                            ...prev,
                            vehicleTypes: prev.vehicleTypes.filter((t) => t !== "vélo"),
                          }
                        } else {
                          return {
                            ...prev,
                            vehicleTypes: [...prev.vehicleTypes, "vélo"],
                          }
                        }
                      })
                    }}
                  />
                  <span className={autoCriteria.vehicleTypes.includes("vélo") ? "text-white" : "text-green-600"}>
                    <FaBiking />
                  </span>
                  <span>Vélo</span>
                </label>

                <label
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                    autoCriteria.vehicleTypes.includes("autres")
                      ? "bg-purple-600 text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={autoCriteria.vehicleTypes.includes("autres")}
                    onChange={() => {
                      setAutoCriteria((prev) => {
                        if (prev.vehicleTypes.includes("autres")) {
                          return {
                            ...prev,
                            vehicleTypes: prev.vehicleTypes.filter((t) => t !== "autres"),
                          }
                        } else {
                          return {
                            ...prev,
                            vehicleTypes: [...prev.vehicleTypes, "autres"],
                          }
                        }
                      })
                    }}
                  />
                  <span className={autoCriteria.vehicleTypes.includes("autres") ? "text-white" : "text-purple-600"}>
                    <FaBox />
                  </span>
                  <span>Autres</span>
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

                      if (prev.criteria.includes("distance")) {
                        return {
                          ...prev,
                          criteria: prev.criteria.filter((c) => c !== "distance"),
                        }
                      } else {

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
    console.log(livreur);
    

    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null)
      directionsRendererRef.current = null
    }

    setSelectedLivreur(livreur)

    const livreurPosition = livreur.position
    setMapCenter({ lat: livreurPosition.lat, lng: livreurPosition.lng })
    setMapZoom(12)


    let vehicleType = "voiture" 


    if (livreur.vehicules && livreur.vehicules.length > 0) {
      const currentVehicle = livreur.vehicules.find((v) => v.current)
      if (currentVehicle) {
        vehicleType = currentVehicle.type.toLowerCase()
      } else if (livreur.vehicule?.type) {
        vehicleType = livreur.vehicule.type.toLowerCase()
      }
    } else if (livreur.vehicule?.type) {
      vehicleType = livreur.vehicule.type.toLowerCase()
    }

    console.log(vehicleType);
    

    const travelMode = getTravelModeForVehicle(vehicleType)


    if (livreurDistances[livreur._id]?.route) {

      directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
        map: mapRef.current,
        suppressMarkers: true,
        suppressBicyclingLayer: true,
        polylineOptions: {
          strokeColor:
            vehicleType === "vélo"
              ? "#10b981" 
              : vehicleType === "moto"
                ? "#3b82f6" 
                : vehicleType === "voiture"
                  ? "#f59e0b" 
                  : "#8b5cf6", 
          strokeWeight: 5,
          strokeOpacity: 0.8,
        },
      })

      directionsRendererRef.current.setDirections(livreurDistances[livreur._id].route)


      setDistance(livreurDistances[livreur._id].distance)
      setDuration(livreurDistances[livreur._id].duration)
    }

    else if (position.data && livreurPosition) {
      const directionsService = new window.google.maps.DirectionsService()

      directionsService.route(
        {
          origin: {
            lat: livreurPosition.lat,
            lng: livreurPosition.lng,
          },
          destination: {
            lat: position.data.lat,
            lng: position.data.lng,
          },
          travelMode: travelMode,
          avoidHighways: vehicleType === "vélo",
          avoidTolls: vehicleType === "vélo",
          optimizeWaypoints: true,
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {

            setDistance(result.routes[0].legs[0].distance.text)
            setDuration(result.routes[0].legs[0].duration.text)


            directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
              map: mapRef.current,
              suppressMarkers: true,
              suppressBicyclingLayer: true,
              polylineOptions: {
                strokeColor:
                  vehicleType === "vélo"
                    ? "#10b981" 
                    : vehicleType === "moto"
                      ? "#3b82f6" 
                      : vehicleType === "voiture"
                        ? "#f59e0b" 
                        : "#8b5cf6", 
                strokeWeight: 5,
                strokeOpacity: 0.8,
              },
            })


            directionsRendererRef.current.setDirections(result)
          }
        },
      )
    }

    toast.success(`Livreur ${livreur.nom} sélectionné`)
  }

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

  if (sortCriteria.length > 0 && Object.keys(livreurDistances).length > 0) {
    filteredLivreurs = [...filteredLivreurs].sort((a, b) => {

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
      return 0 
    })
  }


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

  const getDirectDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371 
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c 
  }

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

        {(() => {
          const currentVehicle = selectedLivreur.vehicules?.find((v) => v.current) || selectedLivreur.vehicule
          return (
            <div className="flex items-center gap-1 text-sm bg-white px-2 py-1 rounded-full">
              {getVehicleIcon(currentVehicle?.type)}
              <span>{currentVehicle?.type || "N/A"}</span>
            </div>
          )
        })()}
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
        disabled={false} 
      >
        {"Confirmer"}
      </button>
      <button
        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors shadow-sm"
        onClick={() => {
          if (directionsRendererRef.current) {
            directionsRendererRef.current.setMap(null)
            directionsRendererRef.current = null
          }
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
        <div className="md:w-7/12 w-full h-96 md:min-h-[600px]">
        <GoogleMap
  mapContainerStyle={mapContainerStyle}
  center={mapCenter}
  zoom={mapZoom}
  onLoad={(map) => {
    onMapLoad(map)
    mapRef.current = map
  }}
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
      const currentVehicle = livreur.vehicules?.find((v) => v.current) || livreur.vehicule

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
          {(() => {
            const currentVehicle = selectedMarker.vehicules?.find((v) => v.current) || selectedMarker.vehicule
            return (
              <>
                <p className="flex items-center gap-2 text-sm">
                  {getVehicleIcon(currentVehicle?.type)}
                  <span className="text-gray-700">
                    <span className="font-medium">Véhicule:</span> {currentVehicle?.type || "N/A"}
                    {currentVehicle?.modele && ` (${currentVehicle.modele})`}
                  </span>
                </p>
                {currentVehicle?.couleur && (
                  <p className="flex items-center gap-2 text-sm">
                    <span
                      className="inline-block w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: currentVehicle.couleur,
                      }}
                    ></span>
                    <span className="text-gray-700">
                      <span className="font-medium">Couleur:</span> {currentVehicle.couleur}
                    </span>
                  </p>
                )}
                {currentVehicle?.capacite && (
                  <p className="flex items-center gap-2 text-sm">
                    <span className="text-gray-700">
                      <span className="font-medium">Capacité:</span> {currentVehicle.capacite} kg
                    </span>
                  </p>
                )}
              </>
            )
          })()}
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
                (basé sur {selectedMarker.vehicules?.find(v => v.current)?.type || 
                           selectedMarker.vehicule?.type || "autres"})
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
                  <th className="text-left py-4 px-4 font-semibold text-gray-600">Véhicule actuel</th>
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
                      <div className="flex flex-col">
                        {livreur.vehicules && livreur.vehicules.length > 0 ? (
                          (() => {
                            const currentVehicle = livreur.vehicules.find((v) => v.current)
                            
                            if (currentVehicle) {
                              return (
                                <>
                                  <div className="flex items-center gap-1 mb-1">
                                    {getVehicleIcon(currentVehicle.type)}
                                    <span className="font-medium">{currentVehicle.type || "N/A"}</span>
                                  </div>
                                </>
                              )
                            } else {
                              return (
                                <>
                                  <div className="flex items-center gap-1 mb-1">
                                    {getVehicleIcon(livreur.vehicule?.type)}
                                    <span className="font-medium">{livreur.vehicule?.type || "N/A"}</span>
                                  </div>
                                  {livreur.vehicule && (
                                    <div className="text-xs text-gray-600 space-y-0.5">
                                      {livreur.vehicule.modele && <div>Modèle: {livreur.vehicule.modele}</div>}
                                      {livreur.vehicule.couleur && (
                                        <div className="flex items-center gap-1">
                                          Couleur:
                                          <span
                                            className="inline-block w-3 h-3 rounded-full"
                                            style={{
                                              backgroundColor: livreur.vehicule.couleur,
                                            }}
                                          ></span>
                                          {livreur.vehicule.couleur}
                                        </div>
                                      )}
                                      {livreur.vehicule.capacite && <div>Capacité: {livreur.vehicule.capacite} kg</div>}
                                    </div>
                                  )}
                                </>
                              )
                            }
                          })()
                        ) : (
                          <>
                            <div className="flex items-center gap-1 mb-1">
                              {getVehicleIcon(livreur.vehicule?.type)}
                              <span className="font-medium">{livreur.vehicule?.type || "N/A"}</span>
                            </div>
                          </>
                        )}
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
