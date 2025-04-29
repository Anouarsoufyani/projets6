"use client"

import {
  useAuthUserQuery,
  useToggleActive,
  useDeliveryPosition,
  useGetLatestPendingCommande,
  useAssignLivreur,
  useGetUserById,
} from "../../Hooks"
import { GoogleMap, Marker, DirectionsRenderer } from "@react-google-maps/api"
import { StarRating, getAverageRating } from "../../Components/Reviews/ReviewDisplay"
import {
  FaStar,
  FaBell,
  FaRegClock,
  FaRegEnvelope,
  FaEye,
  FaThumbsUp,
  FaThumbsDown,
  FaSpinner,
  FaExclamationTriangle,
  FaArrowRight,
  FaLocationArrow,
  FaStopwatch,
  FaStore,
  FaBox,
} from "react-icons/fa"
import { useGetReviewsForUser } from "../../Hooks"
import { useCheckNotificationTimeouts } from "../../Hooks/mutations/useCheckNotificationTimeouts"
import { useNavigate } from "react-router"
const containerStyle = {
  width: "100%",
  height: "100%",
}
import toast from "react-hot-toast"
import { Link } from "react-router"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, useEffect, useCallback, useRef } from "react"

// Fetch notifications function
const getNotifications = async () => {
  try {
    const res = await fetch(`/api/notifications`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-cache",
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || "Erreur lors du chargement")
    }

    return data
  } catch (error) {
    console.error("Error fetching notifications:", error)
    throw error
  }
}

// Format date helper function
const formatDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return "À l'instant"
  if (diffMins < 60) return `Il y a ${diffMins} minute${diffMins > 1 ? "s" : ""}`
  if (diffHours < 24) return `Il y a ${diffHours} heure${diffHours > 1 ? "s" : ""}`
  if (diffDays < 7) return `Il y a ${diffDays} jour${diffDays > 1 ? "s" : ""}`

  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

// Function to check if a notification is active (can be acted upon)
const isNotificationActive = (notification) => {
  if (!notification) return false

  // Check if notification has expired
  const expiresAt = notification.expiresAt ? new Date(notification.expiresAt) : null
  const hasExpired = expiresAt && new Date() > expiresAt

  return (
    notification.isRequest &&
    notification.isActive &&
    !notification.isAccepted &&
    !notification.isRefused &&
    notification.commande_id &&
    !notification.commande_id.livreur_id &&
    !hasExpired
  )
}

// Calculate time remaining for a notification
const getTimeRemaining = (expiresAt) => {
  if (!expiresAt) return null

  const now = new Date()
  const expiry = new Date(expiresAt)
  const diffMs = expiry - now

  if (diffMs <= 0) return "Expirée"

  const diffMins = Math.floor(diffMs / 60000)
  const diffSecs = Math.floor((diffMs % 60000) / 1000)

  if (diffMins > 0) {
    return `${diffMins}m ${diffSecs}s`
  } else {
    return `${diffSecs}s`
  }
}

const DashboardPageLivreur = () => {
  const [selectedShop, setSelectedShop] = useState(null)
  const [directions, setDirections] = useState(null)
  const { data: authUser } = useAuthUserQuery()
  const { toggleActive, isToggleActive } = useToggleActive()
  const { data: commandeEnCours, isLoading } = useGetLatestPendingCommande()
  const queryClient = useQueryClient()
  const checkingTimeoutsRef = useRef(false)
  const checkTimeoutsMutation = useCheckNotificationTimeouts()

  // Track notifications being processed
  const [processingNotifications, setProcessingNotifications] = useState([])

  // State for time remaining counters
  const [timeRemainingState, setTimeRemainingState] = useState({})

  // Reference to store the original notification data with expiry times
  const notificationsRef = useRef([])

  // Fetch notifications with improved error handling and caching
  const {
    data: notificationsData,
    isLoading: isLoadingNotifications,
    error: notificationsError,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
    staleTime: 5000,
    onError: (error) => {
      console.error("Error fetching notifications:", error)
    },
  })

  // Use the existing useAssignLivreur hook that contains handleLivreurResponse
  const { handleLivreurResponse, isResponding } = useAssignLivreur()

  const getUserById = useGetUserById()

  const { position, loading, error } = useDeliveryPosition(authUser?.isWorking, authUser?._id, commandeEnCours?._id)

  // Récupérer les avis pour le livreur avec une limite de 5
  const { data: reviews, isLoading: isLoadingReviews } = useGetReviewsForUser(authUser?._id)
  const averageRating = getAverageRating(reviews)

  const [selectedVehicle, setSelectedVehicle] = useState("")
  const [showVehicleSelector, setShowVehicleSelector] = useState(false)

  // Process notifications to get only active ones
  const notifications = notificationsData?.notifications || []

  // Update notifications reference when data changes
  useEffect(() => {
    if (notifications && notifications.length > 0) {
      notificationsRef.current = notifications
    }
  }, [notifications])

  // Filter active delivery requests (not expired, not accepted, not refused)
  const activeDeliveryRequests = notifications
    .filter((notification) => isNotificationActive(notification))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)

  // Count of active delivery requests
  const activeRequestCount = activeDeliveryRequests.length

  // Function to check for expired notifications
  const checkExpiredNotifications = useCallback(async () => {
    if (authUser && !checkingTimeoutsRef.current) {
      checkingTimeoutsRef.current = true
      try {
        await checkTimeoutsMutation.mutateAsync()
      } finally {
        checkingTimeoutsRef.current = false
      }
    }
  }, [authUser, checkTimeoutsMutation])

  // Set up interval to check for expired notifications
  useEffect(() => {
    // Check immediately on component mount
    checkExpiredNotifications()

    // Set up interval to check every 15 seconds
    const intervalId = setInterval(checkExpiredNotifications, 5000)

    // Clean up interval on component unmount
    return () => clearInterval(intervalId)
  }, [checkExpiredNotifications])

  // Check for active notifications that are about to expire
  useEffect(() => {
    if (!notifications) return

    const activeNotifications = notifications.filter(
      (n) => n.isActive && n.isRequest && !n.isAccepted && !n.isRefused && n.expiresAt,
    )

    // Clear any existing timeouts
    const timeoutIds = []

    // For each active notification, set up a timeout to check expiration
    activeNotifications.forEach((notification) => {
      const expiresAt = new Date(notification.expiresAt).getTime()
      const now = Date.now()

      if (expiresAt > now) {
        const timeUntilExpiry = expiresAt - now

        // Set timeout to check expiration when the notification is about to expire
        const timeoutId = setTimeout(() => {
          checkExpiredNotifications()
        }, timeUntilExpiry + 1000) // Add 1 second buffer

        timeoutIds.push(timeoutId)
      }
    })

    // Clean up timeouts
    return () => {
      timeoutIds.forEach((id) => clearTimeout(id))
    }
  }, [notifications, checkExpiredNotifications])

  // Get the 5 most recent reviews
  const recentReviews = reviews
    ? [...reviews].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)
    : []

  // Handle notification response (accept/refuse)
  const handleNotificationResponse = useCallback(
    (notification, action) => {
      if (!notification || !notification._id) {
        toast.error("Données de notification invalides")
        return
      }

      // Add notification to processing list
      setProcessingNotifications((prev) => [...prev, notification._id])

      // Use the handleLivreurResponse function from useAssignLivreur hook
      handleLivreurResponse({
        notificationId: notification._id,
        response: action === "accepter" ? "accept" : "refuse",
      })
        .then(() => {
          // Success handling is done in the hook
          queryClient.invalidateQueries(["notifications"])
        })
        .catch((error) => {
          // Error handling
          toast.error(`Erreur: ${error.message || "Une erreur est survenue"}`)
          console.error("Error processing notification:", error)
        })
        .finally(() => {
          // Remove notification from processing list
          setProcessingNotifications((prev) => prev.filter((id) => id !== notification._id))
        })
    },
    [handleLivreurResponse, queryClient],
  )

  // Force refresh notifications when component mounts and periodically
  useEffect(() => {
    // Initial refresh
    queryClient.invalidateQueries({ queryKey: ["notifications"] })

    // Set up periodic refresh
    const intervalId = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    }, 30000) // Every 30 seconds

    return () => clearInterval(intervalId)
  }, [queryClient])

  // Update time remaining counters every second
  useEffect(() => {
    const updateTimeRemaining = () => {
      const updatedTimeRemaining = {}

      notificationsRef.current.forEach((notification) => {
        if (notification.expiresAt) {
          updatedTimeRemaining[notification._id] = getTimeRemaining(notification.expiresAt)
        }
      })

      setTimeRemainingState(updatedTimeRemaining)
    }

    // Initial update
    updateTimeRemaining()

    // Set up interval to update every second
    const intervalId = setInterval(updateTimeRemaining, 1000)

    return () => clearInterval(intervalId)
  }, [notifications])

  // Set up timers for notifications that have expiration times
  useEffect(() => {
    if (!notifications || notifications.length === 0) return

    // Create timers for notifications with expiration times
    const timers = notifications
      .filter((notification) => notification.expiresAt && isNotificationActive(notification))
      .map((notification) => {
        const now = new Date()
        const expiry = new Date(notification.expiresAt)
        const timeUntilExpiry = expiry - now

        if (timeUntilExpiry <= 0) return null

        return setTimeout(() => {
          // Refresh notifications when one expires
          queryClient.invalidateQueries({
            queryKey: ["notifications"],
          })
        }, timeUntilExpiry + 1000) // Add 1 second buffer
      })
      .filter(Boolean)

    // Cleanup function
    return () => {
      timers.forEach((timer) => clearTimeout(timer))
    }
  }, [notifications, queryClient])

  const handleToggleActive = async () => {
    if (!authUser?._id) return

    if (!authUser.isWorking) {
      // If starting to work, show vehicle selector
      setShowVehicleSelector(true)
    } else {
      // If stopping work, directly toggle and reset current vehicle
      try {
        // First update all vehicles to set current = false
        const updateVehicleRes = await fetch(`/api/user/update`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            _id: authUser._id,
            isWorking: false,
            disponibilite: false,
          }),
        })

        if (!updateVehicleRes.ok) {
          const errorData = await updateVehicleRes.json()
          throw new Error(errorData.error || "Erreur lors de la mise à jour du statut")
        }

        // Then toggle active status
        await toggleActive(authUser._id)
        setShowVehicleSelector(false)
        window.location.reload()
      } catch (error) {
        toast.error(error.message || "Une erreur est survenue")
      }
    }
  }

  const handleVehicleSelect = async () => {
    if (!selectedVehicle) {
      toast.error("Veuillez sélectionner un véhicule")
      return
    }

    try {
      const updateVehicleRes = await fetch(`/api/user/vehicules/current`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: authUser._id,
          vehiculeId: selectedVehicle,
        }),
      })

      if (!updateVehicleRes.ok) {
        const errorData = await updateVehicleRes.json()
        throw new Error(errorData.error || "Erreur lors de la mise à jour du statut")
      }

      // Then toggle active status
      await toggleActive(authUser._id)
      setShowVehicleSelector(false)
      window.location.reload()
    } catch (error) {
      toast.error(error.message || "Une erreur est survenue")
    }
  }

  const showShopDirections = async (commandeId) => {
    try {
      // Get the commande details to extract commercant ID
      const commandeRes = await fetch(`/api/commandes/itineraire/${commandeId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })

      if (!commandeRes.ok) {
        throw new Error("Erreur lors de la récupération de la commande")
      }

      const commande = await commandeRes.json()

      // Get the commercant details using the user ID
      const commercantRes = await fetch(`/api/user/${commande.data.commercant_id._id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })

      if (!commercantRes.ok) {
        throw new Error("Erreur lors de la récupération du commerçant")
      }

      const commercantData = await commercantRes.json()
      const commercant = commercantData.data

      if (!commercant || !commercant.adresse_boutique) {
        toast.error("Adresse de la boutique non disponible")
        return
      }

      setSelectedShop(commercant)

      // If we have the current position and shop coords, calculate directions
      if (position && commercant.adresse_boutique.lat && commercant.adresse_boutique.lng) {
        const shopPosition = {
          lat: commercant.adresse_boutique.lat,
          lng: commercant.adresse_boutique.lng,
        }

        // Get directions using the Google Maps Directions Service
        const directionsService = new window.google.maps.DirectionsService()

        directionsService.route(
          {
            origin: position,
            destination: shopPosition,
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK) {
              setDirections(result)
              toast.success("Itinéraire vers la boutique affiché")
            } else {
              toast.error("Impossible de calculer l'itinéraire")
            }
          },
        )
      } else if (!commercant.adresse_boutique.lat || !commercant.adresse_boutique.lng) {
        // If coordinates aren't directly available, try to geocode the address
        const addressString = `${commercant.adresse_boutique.rue}, ${commercant.adresse_boutique.code_postal} ${commercant.adresse_boutique.ville}`

        try {
          const geocodeRes = await fetch(`/api/geocode?address=${encodeURIComponent(addressString)}`, {
            method: "GET",
          })

          if (!geocodeRes.ok) {
            throw new Error("Erreur de géocodage de l'adresse")
          }

          const coords = await geocodeRes.json()

          if (coords && coords.lat && coords.lng) {
            const shopPosition = {
              lat: coords.lat,
              lng: coords.lng,
            }

            // Get directions
            const directionsService = new window.google.maps.DirectionsService()

            directionsService.route(
              {
                origin: position,
                destination: shopPosition,
                travelMode: window.google.maps.TravelMode.DRIVING,
              },
              (result, status) => {
                if (status === window.google.maps.DirectionsStatus.OK) {
                  setDirections(result)
                  toast.success("Itinéraire vers la boutique affiché")
                } else {
                  toast.error("Impossible de calculer l'itinéraire")
                }
              },
            )
          }
        } catch (error) {
          toast.error("Erreur lors de la géolocalisation de l'adresse")
        }
      } else {
        toast.error("Position actuelle non disponible")
      }
    } catch (error) {
      toast.error(error.message || "Une erreur est survenue")
      console.error(error)
    }
  }

  // Function to clear directions and return to normal map view
  const clearDirections = () => {
    setDirections(null)
    setSelectedShop(null)
  }

  const navigate = useNavigate()

  if (commandeEnCours != null && !isLoading) {
    navigate(`/livraison/${commandeEnCours._id}`)
  }

  // Loading state for the entire dashboard
  if (isLoadingNotifications && isLoadingReviews) {
    return (
      <div className="w-full h-full p-4 sm:p-6 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-emerald-700">Tableau de bord</h1>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-teal-100 p-4 sm:p-6">
      {authUser?.statut !== "vérifié" ? (
        <div className="flex flex-col gap-4 bg-white p-4 sm:p-6 rounded-lg shadow-lg mb-6 text-center">
          <h1 className="text-xl sm:text-2xl font-bold text-red-600 mb-4 sm:mb-6">Compte non vérifié</h1>
          <p className="text-gray-700">
            Votre compte n'est pas encore vérifié. Veuillez soumettre vos pièces justificatives pour finaliser votre
            inscription, ou patienter pendant la vérification par un administrateur.
            <br />
            <br />
            <a href="justificative" className="text-emerald-700 font-bold underline">
              Suivez votre statut ici
            </a>
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-emerald-700">Bienvenue {authUser.nom}</h1>

            {/* Affichage de la note moyenne */}
            <div className="bg-white px-4 py-2 rounded-lg shadow-md flex items-center gap-3 mt-2 md:mt-0">
              <FaStar className="text-yellow-500 h-5 w-5 sm:h-6 sm:w-6" />
              <div>
                <div className="flex items-center">
                  <span className="text-lg sm:text-xl font-bold text-gray-800 mr-2">{authUser.note_moyenne}</span>
                  <StarRating rating={Math.round(averageRating)} />
                </div>
                <p className="text-xs text-gray-500">
                  {reviews?.length || 0} avis client
                  {reviews?.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>

          <div className={`flex flex-col gap-4 bg-white p-4 sm:p-6 rounded-lg shadow-lg mb-6`}>
            <div className="flex justify-center items-center">
              <button
                onClick={handleToggleActive}
                disabled={isToggleActive || commandeEnCours}
                className={`${
                  isToggleActive || commandeEnCours
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-emerald-500 hover:bg-emerald-700"
                } text-white font-bold py-2 px-6 rounded-full shadow-md transition duration-300`}
              >
                {isToggleActive
                  ? "Activation..."
                  : commandeEnCours
                    ? "Livraison en cours"
                    : authUser.isWorking
                      ? "Arrêter de livrer"
                      : "Commencer à livrer"}
              </button>
            </div>
            {showVehicleSelector && (
              <div className="mt-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <h3 className="text-lg font-semibold text-emerald-700 mb-3">Sélectionnez un véhicule</h3>
                {authUser.vehicules && authUser.vehicules.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      {authUser.vehicules.map((vehicule) => (
                        <div
                          key={vehicule._id}
                          onClick={() => setSelectedVehicle(vehicule._id)}
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${
                            selectedVehicle === vehicule._id
                              ? "bg-emerald-100 border-emerald-500"
                              : "bg-white border-gray-200 hover:border-emerald-300"
                          }`}
                        >
                          <div className="flex items-center">
                            <div
                              className={`w-3 h-3 rounded-full mr-2 ${
                                vehicule.statut === "vérifié"
                                  ? "bg-green-500"
                                  : vehicule.statut === "refusé"
                                    ? "bg-red-500"
                                    : vehicule.statut === "en vérification"
                                      ? "bg-yellow-500"
                                      : "bg-gray-500" 
                              }`}
                            ></div>
                            <span className="font-medium capitalize">{vehicule.type}</span>
                          </div>
                          {vehicule.plaque && <p className="text-sm text-gray-600 mt-1">Plaque: {vehicule.plaque}</p>}
                          {vehicule.couleur && <p className="text-sm text-gray-600">Couleur: {vehicule.couleur}</p>}
                          <p className="text-xs text-gray-500 mt-1">Statut: {vehicule.statut}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setShowVehicleSelector(false)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleVehicleSelect}
                        disabled={
                          !selectedVehicle ||
                          authUser.vehicules.find((v) => v._id === selectedVehicle)?.statut !== "vérifié"
                        }
                        className={`px-4 py-2 rounded-md transition ${
                          !selectedVehicle ||
                          authUser.vehicules.find((v) => v._id === selectedVehicle)?.statut !== "vérifié"
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-emerald-500 text-white hover:bg-emerald-600"
                        }`}
                      >
                        Commencer à livrer
                      </button>
                    </div>
                    {selectedVehicle &&
                      authUser.vehicules.find((v) => v._id === selectedVehicle)?.statut !== "vérifié" && (
                        <p className="text-sm text-amber-600 mt-2">
                          Ce véhicule n'est pas encore vérifié. Veuillez choisir un véhicule vérifié ou contacter un
                          administrateur.
                        </p>
                      )}
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-600 mb-3">Vous n'avez pas encore ajouté de véhicule.</p>
                    <a href="/profile" className="text-emerald-600 hover:text-emerald-700 font-medium underline">
                      Ajouter un véhicule dans votre profil
                    </a>
                  </div>
                )}
              </div>
            )}
            {commandeEnCours && (
              <p className="text-center text-amber-600 mt-2">
                Vous ne pouvez pas arrêter de livrer pendant une commande en cours.
              </p>
            )}

            {authUser.isWorking && (
              <div className="w-full h-[300px] sm:h-[400px] md:h-[500px] mt-4 relative">
                {loading ? (
                  <p className="text-gray-600">Chargement de la carte...</p>
                ) : error ? (
                  <p className="text-red-500">{error}</p>
                ) : position ? (
                  <>
                    <GoogleMap
                      mapContainerStyle={containerStyle}
                      center={position}
                      zoom={13}
                      options={{
                        mapTypeControl: false,
                        streetViewControl: false,
                        fullscreenControl: true,
                        zoomControl: true,
                      }}
                    >
                      {/* Current position marker */}
                      <Marker
                        position={position}
                        icon={{
                          url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
                        }}
                      />

                      {/* Shop marker if we have a selected shop but no directions yet */}
                      {selectedShop && !directions && selectedShop.adresse_boutique && (
                        <Marker
                          position={{
                            lat: selectedShop.adresse_boutique.lat,
                            lng: selectedShop.adresse_boutique.lng,
                          }}
                          icon={{
                            url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                          }}
                        />
                      )}

                      {/* Display directions if available */}
                      {directions && (
                        <DirectionsRenderer
                          directions={directions}
                          options={{
                            suppressMarkers: false,
                            polylineOptions: {
                              strokeColor: "#4CAF50",
                              strokeWeight: 6,
                            },
                          }}
                        />
                      )}
                    </GoogleMap>

                    {/* Shop info and clear button when directions are shown */}
                    {selectedShop && (
                      <div className="absolute bottom-4 left-4 right-4 bg-white p-3 rounded-lg shadow-lg max-w-md mx-auto">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium text-emerald-700">
                            {selectedShop.nom_etablissement || "Boutique"}
                          </h3>
                          <button
                            onClick={clearDirections}
                            className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded transition-colors"
                          >
                            Fermer
                          </button>
                        </div>
                        {selectedShop.adresse_boutique && (
                          <p className="text-sm text-gray-600 mt-1">
                            {selectedShop.adresse_boutique.rue}, {selectedShop.adresse_boutique.code_postal}{" "}
                            {selectedShop.adresse_boutique.ville}
                          </p>
                        )}
                        {directions && directions.routes[0]?.legs[0] && (
                          <div className="mt-2 text-sm border-t pt-2 border-gray-100">
                            <p className="text-emerald-600 font-medium">
                              Distance: {directions.routes[0].legs[0].distance.text}
                            </p>
                            <p className="text-emerald-600 font-medium">
                              Durée estimée: {directions.routes[0].legs[0].duration.text}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-gray-600">Impossible de récupérer votre position.</p>
                )}
              </div>
            )}
          </div>

          {/* Affichage des notifications de demande de livraison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
            {/* Demandes de livraison - Enhanced UI */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Header with notification count badge */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-4 flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center">
                  <FaBell className="mr-2" />
                  Demandes de livraison
                </h2>
                {activeRequestCount > 0 && (
                  <span className="bg-white text-emerald-600 font-bold text-sm px-3 py-1 rounded-full shadow-sm animate-pulse">
                    {activeRequestCount} nouvelle
                    {activeRequestCount > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {/* Notification content */}
              <div className="p-4">
                {isLoadingNotifications ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600"></div>
                  </div>
                ) : notificationsError ? (
                  <div className="flex flex-col items-center justify-center py-6 text-red-500">
                    <FaExclamationTriangle className="text-3xl mb-2" />
                    <p>Erreur lors du chargement des notifications</p>
                    <button
                      onClick={() =>
                        queryClient.invalidateQueries({
                          queryKey: ["notifications"],
                        })
                      }
                      className="mt-2 text-sm bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-md transition-colors"
                    >
                      Réessayer
                    </button>
                  </div>
                ) : activeDeliveryRequests.length > 0 ? (
                  <ul className="space-y-3">
                    {activeDeliveryRequests.map((notification) => {
                      const isProcessing = processingNotifications.includes(notification._id)
                      // Use the real-time updated time remaining from state
                      const timeRemaining =
                        timeRemainingState[notification._id] ||
                        (notification.expiresAt ? getTimeRemaining(notification.expiresAt) : null)

                      return (
                        <li
                          key={notification._id}
                          className="relative bg-white border border-emerald-100 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                        >
                          {/* Colored status bar */}
                          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>

                          <div className="p-4 pl-5">
                            <div className="flex flex-col sm:flex-row items-start justify-between gap-3 w-full">
                              {/* Notification content with improved layout */}
                              <div className="flex-1">
                                <div className="flex items-center mb-2">
                                  <div className="p-2 rounded-full bg-emerald-100 text-emerald-600 mr-3">
                                    <FaStore className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <div className="flex items-center">
                                      <span className="font-medium text-gray-800">
                                        {notification.sender?.nom_etablissement ??
                                          notification.sender?.nom ??
                                          "Système"}
                                      </span>
                                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                                        En attente
                                      </span>
                                    </div>
                                    <div className="flex items-center text-xs text-gray-500 mt-1">
                                      <FaRegClock className="mr-1 flex-shrink-0" />
                                      <span>{formatDate(notification.createdAt)}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Order details with icons */}
                                <div className="ml-11 text-sm text-gray-600">
                                  {notification.commande_id?.details && (
                                    <div className="flex items-start mb-1">
                                      <FaLocationArrow className="mr-2 mt-1 text-emerald-500 flex-shrink-0" />
                                      <span>
                                        <span className="font-medium">Adresse:</span>{" "}
                                        {notification.commande_id.details.address || "Non spécifiée"}
                                      </span>
                                    </div>
                                  )}

                                  {notification.commande_id?.details?.items && (
                                    <div className="flex items-start mb-1">
                                      <FaBox className="mr-2 mt-1 text-emerald-500 flex-shrink-0" />
                                      <span>
                                        <span className="font-medium">Articles:</span>{" "}
                                        {notification.commande_id.details.items.length} article(s)
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Time remaining and action buttons */}
                              <div className="flex flex-col items-end gap-2 min-w-[120px]">
                                {/* Time remaining with animated countdown */}
                                {timeRemaining && (
                                  <div className="flex items-center bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                                    <FaStopwatch className="text-amber-500 mr-1.5" />
                                    <span
                                      className={`text-sm font-medium ${
                                        timeRemaining === "Expirée"
                                          ? "text-red-600"
                                          : timeRemaining.startsWith("0")
                                            ? "text-red-500 animate-pulse"
                                            : "text-amber-700"
                                      }`}
                                    >
                                      {timeRemaining}
                                    </span>
                                  </div>
                                )}

                                {/* Action buttons with improved styling */}
                                <div className="flex gap-2 mt-1">
                                  <button
                                    className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium py-1.5 px-3 rounded-md transition-colors flex items-center justify-center"
                                    onClick={() => showShopDirections(notification.commande_id._id)}
                                    disabled={isProcessing || isResponding}
                                  >
                                    <FaEye className="mr-1 flex-shrink-0" />
                                    Voir
                                  </button>

                                  <button
                                    className={`bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium py-1.5 px-3 rounded-md transition-colors flex items-center justify-center ${
                                      isProcessing || isResponding ? "opacity-70 cursor-not-allowed" : ""
                                    }`}
                                    onClick={() => handleNotificationResponse(notification, "accepter")}
                                    disabled={isProcessing || isResponding}
                                  >
                                    {isProcessing || isResponding ? (
                                      <FaSpinner className="animate-spin mr-1 flex-shrink-0" />
                                    ) : (
                                      <FaThumbsUp className="mr-1 flex-shrink-0" />
                                    )}
                                    Accepter
                                  </button>

                                  <button
                                    className={`bg-red-500 hover:bg-red-600 text-white text-xs font-medium py-1.5 px-3 rounded-md transition-colors flex items-center justify-center ${
                                      isProcessing || isResponding ? "opacity-70 cursor-not-allowed" : ""
                                    }`}
                                    onClick={() => handleNotificationResponse(notification, "refuser")}
                                    disabled={isProcessing || isResponding}
                                  >
                                    {isProcessing || isResponding ? (
                                      <FaSpinner className="animate-spin mr-1 flex-shrink-0" />
                                    ) : (
                                      <FaThumbsDown className="mr-1 flex-shrink-0" />
                                    )}
                                    Refuser
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    <FaRegEnvelope className="text-4xl mb-3 text-gray-300" />
                    <p>Aucune demande de livraison en attente</p>
                    <p className="text-sm text-gray-400 mt-1">Les nouvelles demandes apparaîtront ici</p>
                  </div>
                )}
              </div>

              {/* Footer with link to all notifications */}
              <div className="bg-gray-50 p-3 border-t border-gray-100">
                <Link
                  to="/notifications"
                  className="text-emerald-600 hover:text-emerald-800 text-sm font-medium flex items-center justify-center"
                >
                  Voir toutes les notifications
                  <FaArrowRight className="ml-1 text-xs" />
                </Link>
              </div>
            </div>

            {/* Affichage des derniers avis reçus */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg">
              <div className="flex items-center justify-between mb-4 border-b border-emerald-100 pb-2">
                <h2 className="text-lg sm:text-xl font-semibold text-emerald-700 flex items-center">
                  <FaStar className="mr-2 text-yellow-500" />
                  Derniers avis reçus
                </h2>
                {reviews && reviews.length > 0 && (
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {reviews.length} avis
                  </span>
                )}
              </div>

              {isLoadingReviews ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-500"></div>
                </div>
              ) : recentReviews && recentReviews.length > 0 ? (
                <div className="space-y-3">
                  {recentReviews.map((review) => (
                    <div
                      key={review._id}
                      className="bg-gray-50 p-3 rounded-lg border-l-4 border-yellow-400 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <StarRating rating={review.rating} />
                            <span className="ml-2 text-xs text-gray-500">{formatDate(review.createdAt)}</span>
                          </div>
                          <p className="mt-2 text-gray-700 text-sm">{review.comment}</p>
                        </div>
                        <div className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                          Commande #{review.commandeId.slice(-6)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                  <FaStar className="text-4xl mb-3 text-gray-300" />
                  <p>Aucun avis reçu pour le moment</p>
                </div>
              )}

              {reviews && reviews.length > 5 && (
                <div className="text-center mt-4">
                  <button className="text-emerald-600 hover:text-emerald-800 font-medium text-sm flex items-center justify-center">
                    Voir tous les avis ({reviews.length})
                    <FaArrowRight className="ml-1 text-xs" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default DashboardPageLivreur
