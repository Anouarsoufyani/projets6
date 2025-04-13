"use client"
import { useGetCoords, useAuthUserQuery, useLivreurTracking } from "../../Hooks"
import { useEffect, useState, useRef, useCallback } from "react"
import { GoogleMap, Marker } from "@react-google-maps/api"
import { useParams } from "react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
// Ajouter l'import pour le composant ReviewForm
import ReviewForm from "../../Components/Reviews/ReviewForm"

const containerStyle = {
  width: "100%",
  height: "100%",
  borderRadius: "8px",
}

// Custom loading spinner component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
  </div>
)

const CommandeSuivi = () => {
  const { data: authUser } = useAuthUserQuery()
  const { id } = useParams()
  const [mapInitialized, setMapInitialized] = useState(false)
  const [mapCenter, setMapCenter] = useState(null)
  const [commercantCode, setCommercantCode] = useState("")
  const [clientCode, setClientCode] = useState("")
  const [distance, setDistance] = useState(null)
  const [duration, setDuration] = useState(null)
  const mapRef = useRef(null)
  const directionsRendererRef = useRef(null)
  const intervalRef = useRef(null)
  const lastRouteCalculationRef = useRef(0)
  const [deliveryStatus, setDeliveryStatus] = useState("en_attente")

  // Utiliser un intervalle personnalisé au lieu du refresh automatique du hook
  const [refreshKey, setRefreshKey] = useState(0)

  // Utiliser le hook useLivreurTracking pour la position initiale (avec un intervalle de 15 secondes)
  const { livreurPosition, livreurStatus, isLoading: isLoadingLivreur } = useLivreurTracking(id, 15000)

  console.log("livreurPosition", livreurPosition)

  // État local pour stocker la dernière position connue du livreur
  // const [currentLivreurPosition, setCurrentLivreurPosition] = useState(null)

  const queryClient = useQueryClient()

  // Récupérer les données de la commande
  const { data: commande, isLoading } = useQuery({
    queryKey: ["getCommande", id],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/commandes/${id}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })

        const data = await res.json()

        if (data.error || !res.ok) {
          throw new Error(data.error || "Erreur lors du chargement")
        }

        return data
      } catch (error) {
        toast.error(error.message)
        if (error.message === "Forbidden : Access denied") {
          window.location.href = "/commandes"
        }
        throw error
      }
    },
    retry: false,
    refetchInterval: 5000, // Rafraîchir toutes les 5 secondes
  })

  // Mutation pour valider le code commerçant
  const validateCommercantMutation = useMutation({
    mutationFn: async (code) => {
      const res = await fetch(`/api/commandes/code/validationCommercant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, code }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur de validation")
      return data
    },
    onSuccess: () => {
      toast.success("Commande récupérée avec succès!")
      setCommercantCode("")
      // Invalider les requêtes pour forcer un rafraîchissement
      queryClient.invalidateQueries({ queryKey: ["getCommande", id] })
      queryClient.invalidateQueries({ queryKey: ["getUserCommandes"] })
    },
    onError: (error) => {
      toast.error(error.message || "Code invalide")
    },
  })

  // Mutation pour valider le code client
  const validateClientMutation = useMutation({
    mutationFn: async (code) => {
      const res = await fetch(`/api/commandes/code/validationClient`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, code }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur de validation")
      return data
    },
    onSuccess: () => {
      toast.success("Livraison confirmée avec succès!")
      setClientCode("")
      // Invalider les requêtes pour forcer un rafraîchissement
      queryClient.invalidateQueries({ queryKey: ["getCommande", id] })
      queryClient.invalidateQueries({ queryKey: ["getUserCommandes"] })
    },
    onError: (error) => {
      toast.error(error.message || "Code invalide")
    },
  })

  // Avoir la geolocalisation exacte grâce à l'adresse
  const adresseClient = commande?.data?.adresse_livraison
    ? `${commande.data.adresse_livraison.rue}, ${commande.data.adresse_livraison.ville}, ${commande.data.adresse_livraison.code_postal}`
    : ""
  const adresseCommercant = commande?.data?.commercant_id?.adresse_boutique
    ? `${commande.data.commercant_id.adresse_boutique.rue}, ${commande.data.commercant_id.adresse_boutique.ville}, ${commande.data.commercant_id.adresse_boutique.code_postal}`
    : ""

  const { data: coordsCommercant, isLoading: isLoadingCoordsCommercant } = useGetCoords(adresseCommercant)

  const { data: coords, isLoading: isLoadingCoords } = useGetCoords(adresseClient)

  // Fonction pour récupérer la position du livreur manuellement
  // const fetchLivreurPosition = useCallback(async () => {
  //   // Limiter la fréquence des appels
  //   const now = Date.now()
  //   if (now - lastRouteCalculationRef.current < 10000) {
  //     return
  //   }
  //   lastRouteCalculationRef.current = now

  //   try {
  //     const response = await fetch(`/api/commandes/${id}/livreur-info`)

  //     if (!response.ok) {
  //       if (response.status !== 404) {
  //         // Ignorer les 404 (livreur non assigné)
  //         console.error("Erreur lors de la récupération de la position")
  //       }
  //       return
  //     }

  //     const data = await response.json()
  //     console.log(data)

  //     if (data.position) {
  //       setCurrentLivreurPosition({
  //         lat: data.position.lat,
  //         lng: data.position.lng,
  //         livreurId: data.livreurId,
  //         timestamp: new Date(),
  //       })
  //       console.log(currentLivreurPosition)
  //     }
  //   } catch (err) {
  //     console.error("Erreur:", err)
  //   }
  // }, [id])

  // Initialiser la carte et le centre une seule fois
  useEffect(() => {
    if (!mapInitialized && coords && coords.lat && coords.lng) {
      setMapCenter({ lat: coords.lat, lng: coords.lng })
      setMapInitialized(true)
    }
  }, [coords, mapInitialized])

  // Mettre à jour la position du livreur depuis le hook
  // useEffect(() => {
  //   if (livreurPosition) {
  //     setCurrentLivreurPosition(livreurPosition)
  //   }
  // }, [livreurPosition])

  // Configurer l'intervalle pour récupérer la position du livreur toutes les 10 secondes
  // useEffect(() => {
  //   // Première récupération immédiate
  //   fetchLivreurPosition()

  //   // Configurer l'intervalle
  //   intervalRef.current = setInterval(() => {
  //     console.log("Rafraîchissement de la position du livreur...", currentLivreurPosition)

  //     fetchLivreurPosition()
  //   }, 10000)

  //   // Nettoyer l'intervalle lors du démontage
  //   return () => {
  //     if (intervalRef.current) {
  //       clearInterval(intervalRef.current)
  //     }
  //   }
  // }, [fetchLivreurPosition, refreshKey])

  // Fonction pour calculer l'itinéraire
  const calculateRoute = useCallback(async () => {
    if (!livreurPosition || !window.google || !mapRef.current) {
      return
    }

    // Déterminer la destination en fonction du statut
    let destination
    if (deliveryStatus === "prete_a_etre_recuperee" && coordsCommercant) {
      // Si le livreur doit récupérer la commande, la destination est le commerçant
      destination = {
        lat: coordsCommercant.lat,
        lng: coordsCommercant.lng,
      }
    } else if (coords) {
      // Sinon, la destination est le client
      destination = { lat: coords.lat, lng: coords.lng }
    } else {
      return // Pas de destination valide
    }

    // Vérifier si les coordonnées sont valides
    if (isNaN(livreurPosition.lat) || isNaN(livreurPosition.lng) || isNaN(destination.lat) || isNaN(destination.lng)) {
      console.warn("Coordonnées invalides détectées")
      return
    }

    try {
      // Créer un objet DirectionsService
      const directionsService = new window.google.maps.DirectionsService()

      // Exécuter le calcul d'itinéraire
      const results = await directionsService.route({
        origin: {
          lat: livreurPosition.lat,
          lng: livreurPosition.lng,
        },
        destination: destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      })

      // Extraire les informations
      setDistance(results.routes[0].legs[0].distance.text)
      setDuration(results.routes[0].legs[0].duration.text)

      // Créer DirectionsRenderer s'il n'existe pas
      if (!directionsRendererRef.current) {
        directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
          map: mapRef.current,
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: "#10b981", // emerald-500
            strokeWeight: 5,
            strokeOpacity: 0.8,
          },
        })
      }

      // Afficher l'itinéraire sur la carte
      directionsRendererRef.current.setDirections(results)
    } catch (error) {
      console.error("Erreur lors du calcul de l'itinéraire:", error)
    }
  }, [livreurPosition, coords, coordsCommercant, deliveryStatus])

  // Mettre à jour l'itinéraire lorsque la position du livreur change
  useEffect(() => {
    if (livreurPosition && mapRef.current) {
      calculateRoute()
    }
  }, [livreurPosition, calculateRoute])

  // Gérer le chargement de la carte
  const handleMapLoad = useCallback(
    (map) => {
      mapRef.current = map

      // Si nous avons déjà les positions, calculer l'itinéraire
      if (livreurPosition && coords) {
        calculateRoute()
      }
    },
    [calculateRoute, livreurPosition, coords],
  )

  // Gérer la soumission du code commerçant
  const handleCommercantCodeSubmit = (e) => {
    e.preventDefault()
    if (commercantCode.trim()) {
      validateCommercantMutation.mutate(commercantCode)
    } else {
      toast.error("Veuillez entrer un code")
    }
  }

  // Gérer la soumission du code client
  const handleClientCodeSubmit = (e) => {
    e.preventDefault()
    if (clientCode.trim()) {
      validateClientMutation.mutate(clientCode)
    } else {
      toast.error("Veuillez entrer un code")
    }
  }

  useEffect(() => {
    if (livreurStatus && livreurStatus.status) {
      setDeliveryStatus(livreurStatus.status)
    }
  }, [livreurStatus])

  // Mettre à jour le statut de livraison quand la commande change
  useEffect(() => {
    if (commande?.data?.statut) {
      setDeliveryStatus(commande.data.statut)
    }
  }, [commande])

  if (isLoading || isLoadingLivreur || isLoadingCoords || isLoadingCoordsCommercant) {
    return <LoadingSpinner />
  }

  // Calculer l'heure d'arrivée estimée en fonction de la durée réelle
  const estimatedArrival = new Date()
  if (duration) {
    // Parse duration like "15 mins" to minutes
    const durationMatch = duration.match(/(\d+)\s*mins?/)
    if (durationMatch && durationMatch[1]) {
      estimatedArrival.setMinutes(estimatedArrival.getMinutes() + Number.parseInt(durationMatch[1]))
    } else {
      // Fallback to 15 minutes if parsing fails
      estimatedArrival.setMinutes(estimatedArrival.getMinutes() + 15)
    }
  } else {
    // Default 15 minutes if no duration available
    estimatedArrival.setMinutes(estimatedArrival.getMinutes() + 15)
  }

  const formattedArrival = estimatedArrival.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })

  // Calculer le pourcentage de progression basé sur le temps écoulé
  const calculateProgressPercentage = () => {
    if (!duration) return 0

    // Extraire les minutes à partir de la durée (ex: "15 mins")
    const durationMatch = duration.match(/(\d+)\s*mins?/)
    if (!durationMatch || !durationMatch[1]) return 0

    const totalMinutes = Number.parseInt(durationMatch[1])
    if (totalMinutes <= 0) return 100 // Si la durée est 0, on est arrivé

    // Estimer le temps déjà écoulé
    const minutesRemaining = (estimatedArrival - new Date()) / (1000 * 60)
    const minutesElapsed = totalMinutes - minutesRemaining

    // Calculer le pourcentage (limité entre 0 et 100)
    const percentage = Math.max(0, Math.min(100, (minutesElapsed / totalMinutes) * 100))
    return Math.round(percentage)
  }

  // Vérifier si nous avons les coordonnées nécessaires
  const hasValidCoordinates = livreurPosition && coords && coords.lat && coords.lng

  // Vérifier si l'utilisateur est le livreur assigné à cette commande
  const isAssignedClient = authUser && commande?.data?.client_id && authUser._id === commande.data.client_id._id

  const isAssignedCommercant =
    authUser && commande?.data?.commercant_id && authUser._id === commande.data.commercant_id._id

  const isAssignedLivreur = authUser && commande?.data?.livreur_id && authUser._id === commande.data.livreur_id._id

  // Déterminer l'étape actuelle de la livraison
  const canConfirmPickup = isAssignedLivreur && deliveryStatus === "prete_a_etre_recuperee"
  const canConfirmDelivery = isAssignedLivreur && deliveryStatus === "recuperee_par_livreur"

  return (
    <div className="w-full min-h-full bg-gradient-to-br from-emerald-50 to-teal-100 p-4 md:p-6 flex flex-col">
      <h1 className="text-2xl font-bold text-emerald-700 mb-6">Livraison - Suivi en temps réel</h1>

      <div className="flex flex-col lg:flex-row flex-1 gap-6">
        <div className="w-full lg:w-1/3 bg-white p-4 md:p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-emerald-800 mb-4">Détails de la Livraison</h2>
          <div className="overflow-auto h-full space-y-6">
            {/* Livreur info */}
            <div className="p-4 bg-emerald-50 rounded-lg">
              <h3 className="font-medium text-emerald-800 mb-2">Votre livreur</h3>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                  <img
                    src={
                      commande?.data?.livreur_id?.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                    }
                    alt="Livreur"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-emerald-700 text-lg font-semibold">
                    {commande?.data?.livreur_id?.nom || "Livreur non assigné"}
                  </p>
                  <p className="text-sm text-gray-600">ID : {commande?.data?.livreur_id?._id?.slice(-6) || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Vehicle info */}
            {commande?.data?.livreur_id?.vehicule && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-2">Détails du Vehicule</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium">{commande.data.livreur_id.vehicule.type || "N/A"}</span>
                  </li>
                  {commande.data.livreur_id.vehicule.plaque && (
                    <li className="flex justify-between">
                      <span className="text-gray-600">Plaque:</span>
                      <span className="font-medium">{commande.data.livreur_id.vehicule.plaque}</span>
                    </li>
                  )}
                  {commande.data.livreur_id.vehicule.couleur && (
                    <li className="flex justify-between">
                      <span className="text-gray-600">Couleur:</span>
                      <span className="font-medium">{commande.data.livreur_id.vehicule.couleur}</span>
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Commande info */}
            {commande && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-2">Détails de la Commande</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex justify-between">
                    <span className="text-gray-600">ID Commande:</span>
                    <span className="font-medium">{commande.data._id?.slice(-6) || "N/A"}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-600">Nom Client:</span>
                    <span className="font-medium">{commande.data.client_id?.nom || "N/A"}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-600">Nom Boutique:</span>
                    <span className="font-medium">{commande.data.commercant_id?.nom_boutique || "N/A"}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-600">Adresse Boutique:</span>
                    <span className="font-medium">
                      {commande.data.commercant_id?.adresse_boutique
                        ? `${commande.data.commercant_id.adresse_boutique.rue}, 
                        ${commande.data.commercant_id.adresse_boutique.ville}, 
                        ${commande.data.commercant_id.adresse_boutique.code_postal}`
                        : "N/A"}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-medium">{commande.data.total ? `${commande.data.total} €` : "N/A"}</span>
                  </li>
                  {commande.data.adresse_livraison && (
                    <li className="flex justify-between">
                      <span className="text-gray-600">Adresse Client:</span>
                      <span className="font-medium">
                        {commande.data.adresse_livraison.rue}, {commande.data.adresse_livraison.ville},{" "}
                        {commande.data.adresse_livraison.code_postal}
                      </span>
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Delivery status with actual distance and duration */}
            {/* Remplacer le bloc bleu de statut par un système d'avis quand la commande est livrée */}
            {/* Chercher ce bloc dans le code: */}
            {commande.data.statut === "livree" ? (
              <div>
                {isAssignedClient && (
                  <div className="space-y-6">
                    <div className="p-4 bg-green-50 rounded-lg text-center mb-4">
                      <h3 className="font-medium text-green-800 mb-2">La commande a été livrée avec succès.</h3>
                      <p className="text-green-700">
                        Merci d'avoir utilisé notre service. Nous espérons vous revoir bientôt !
                      </p>
                    </div>

                    {/* Section d'avis pour le client */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Avis pour le livreur */}
                      {commande.data.livreur_id && (
                        <div className="bg-white p-4 rounded-lg shadow-md">
                          <h3 className="text-lg font-semibold text-emerald-700 mb-4">Évaluer le livreur</h3>
                          <ReviewForm
                            targetId={commande.data.livreur_id._id}
                            targetType="livreur"
                            commandeId={commande.data._id}
                          />
                        </div>
                      )}

                      {/* Avis pour le commerçant */}
                      <div className="bg-white p-4 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold text-emerald-700 mb-4">Évaluer le commerçant</h3>
                        <ReviewForm
                          targetId={commande.data.commercant_id._id}
                          targetType="commercant"
                          commandeId={commande.data._id}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {!isAssignedClient && (
                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <h3 className="font-medium text-green-800 mb-2">La commande a été livrée avec succès.</h3>
                    <p className="text-green-700">
                      Merci d'avoir utilisé notre service. Nous espérons vous revoir bientôt !
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Bloc d'information sur le statut de livraison */}
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-800 mb-2">Statut</h3>
                  <div className="space-y-2">
                    <p className="text-blue-700 font-medium">
                      {deliveryStatus === "en_livraison"
                        ? "En cours de livraison"
                        : deliveryStatus === "commande_prise"
                          ? "Commande récupérée"
                          : deliveryStatus === "en_route_vers_commercant"
                            ? "En route vers le commerçant"
                            : deliveryStatus === "arrive"
                              ? "Arrivé à destination"
                              : "En route"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Arrivée estimée: <span className="font-medium">{formattedArrival}</span>
                    </p>
                    {distance && (
                      <p className="text-sm text-gray-600">
                        Distance: <span className="font-medium">{distance}</span>
                      </p>
                    )}
                    {duration && (
                      <p className="text-sm text-gray-600">
                        Durée estimée: <span className="font-medium">{duration}</span>
                      </p>
                    )}
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{
                          width: `${calculateProgressPercentage()}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                {isAssignedLivreur && (
                  <div className="space-y-4 mt-4">
                    {canConfirmPickup && (
                      <div className="p-4 bg-amber-50 rounded-lg">
                        <h3 className="font-medium text-amber-800 mb-2">Confirmer la prise de commande</h3>
                        <form onSubmit={handleCommercantCodeSubmit} className="flex gap-2">
                          <input
                            type="text"
                            value={commercantCode}
                            onChange={(e) => setCommercantCode(e.target.value)}
                            placeholder="Code commerçant"
                            className="flex-1 p-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                          <button
                            type="submit"
                            disabled={validateCommercantMutation.isPending}
                            className="bg-amber-500 text-white px-4 py-2 rounded-md hover:bg-amber-600 transition-colors disabled:bg-amber-300"
                          >
                            {validateCommercantMutation.isPending ? "..." : "Valider"}
                          </button>
                        </form>
                      </div>
                    )}

                    {canConfirmDelivery && (
                      <div className="p-4 bg-green-50 rounded-lg">
                        <h3 className="font-medium text-green-800 mb-2">Confirmer la livraison</h3>
                        <form onSubmit={handleClientCodeSubmit} className="flex gap-2">
                          <input
                            type="text"
                            value={clientCode}
                            onChange={(e) => setClientCode(e.target.value)}
                            placeholder="Code client"
                            className="flex-1 p-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                          <button
                            type="submit"
                            disabled={validateClientMutation.isPending}
                            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors disabled:bg-green-300"
                          >
                            {validateClientMutation.isPending ? "..." : "Valider"}
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                )}

                {isAssignedCommercant && deliveryStatus === "prete_a_etre_recuperee" && (
                  <div className="space-y-4 p-4 border border-yellow-300 rounded-md bg-yellow-50 mt-4">
                    <h3 className="font-semibold text-yellow-800">Code commerçant: {commande.data.code_Commercant}</h3>
                    <span className="text-yellow-600 text-sm">
                      ⚠️ Veuillez remettre ce code au livreur lorsque la commande est prise en main.
                    </span>
                  </div>
                )}

                {isAssignedCommercant && deliveryStatus === "recuperee_par_livreur" && (
                  <div className="bg-green-50 p-4 border border-green-300 rounded-md mt-4">
                    <h3 className="text-green-800 font-semibold">Code commerçant remis.</h3>
                    <p className="text-green-600 text-sm">✅ Le code a bien été donné au livreur.</p>
                  </div>
                )}

                {isAssignedClient && (
                  <div className="space-y-4 p-4 border border-yellow-300 rounded-md bg-yellow-50 mt-4">
                    <h3 className="font-semibold text-yellow-800">Code client: {commande.data.code_Client}</h3>
                    <span className="text-yellow-600 text-sm">
                      ⚠️ Veuillez remettre ce code au livreur lorsque la commande est livrée.
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="w-full lg:w-2/3 shadow-xl rounded-lg overflow-hidden mt-4 lg:mt-0">
          {!hasValidCoordinates ? (
            <div className="flex items-center justify-center h-full bg-gray-100">
              <p className="text-gray-500">En attente des coordonnées de livraison...</p>
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={mapCenter}
              zoom={13}
              options={{
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: true,
                zoomControl: true,
              }}
              onLoad={handleMapLoad}
            >
              {/* Marqueur pour le livreur */}
              {livreurPosition && (
                <Marker
                  position={{
                    lat: livreurPosition.lat,
                    lng: livreurPosition.lng,
                  }}
                  icon={{
                    url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                  }}
                  title="Livreur en déplacement"
                />
              )}

              {/* Marqueur pour la destination (client) */}
              {coords && (
                <Marker
                  position={{
                    lat: coords.lat,
                    lng: coords.lng,
                  }}
                  icon={{
                    url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
                  }}
                  title="Destination (Client)"
                />
              )}

              {/* Marqueur pour le commerçant */}
              {coordsCommercant && (
                <Marker
                  position={{
                    lat: coordsCommercant.lat,
                    lng: coordsCommercant.lng,
                  }}
                  icon={{
                    url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
                  }}
                  title="Commerçant"
                />
              )}
            </GoogleMap>
          )}
        </div>
      </div>
    </div>
  )
}

export default CommandeSuivi
