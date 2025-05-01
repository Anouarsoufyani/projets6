"use client"

import { useState, useEffect } from "react"
import {
  useAuthUserQuery,
  useUploadDocument,
  useUpdateUploadedDocument,
  useDeleteDocument,
  getDocumentUrl,
  useUploadVehicule,
  useUpdateVehicule,
  useDeleteVehicule,
} from "../../Hooks"
import {
  FaBiking,
  FaCar,
  FaMotorcycle,
  FaBox,
  FaUpload,
  FaCheck,
  FaArrowRight,
  FaSpinner,
  FaTimesCircle,
  FaCheckCircle,
  FaHourglassHalf,
  FaEye,
  FaSync,
  FaFilePdf,
  FaFileImage,
  FaFile,
  FaTrash,
  FaPlus,
  FaPencilAlt,
  FaExclamationTriangle,
} from "react-icons/fa"
import toast from "react-hot-toast"

const JustificativePage = () => {
  // État pour gérer les étapes du processus d'ajout de véhicule
  const [step, setStep] = useState("vehicles")
  // État pour suivre si l'utilisateur est en train d'ajouter un nouveau véhicule
  const [isAddingNewVehicle, setIsAddingNewVehicle] = useState(false)

  // Ajouter une nouvelle variable d'état pour stocker les détails des véhicules
  const [vehicleDetails, setVehicleDetails] = useState({})
  const [selectedVehicles, setSelectedVehicles] = useState([])
  const [documents, setDocuments] = useState({})
  const [uploadProgress, setUploadProgress] = useState({})
  const [showAddVehicleForm, setShowAddVehicleForm] = useState(false)
  const [showEditVehicleForm, setShowEditVehicleForm] = useState(false)
  const [currentVehicle, setCurrentVehicle] = useState(null)
  const [newVehicle, setNewVehicle] = useState({
    type: "vélo",
    plaque: "",
    couleur: "",
    capacite: 50,
  })
  // Ajouter un état pour suivre les véhicules en cours de traitement
  const [processingVehicles, setProcessingVehicles] = useState(false)

  const { data: authUser, refetch: refetchAuthUser } = useAuthUserQuery()
  const UserDocuments = authUser?.documents || []
  const UserVehicles = authUser?.vehicules || []

  // Utilisation des hooks modularisés pour les documents
  const { mutate: uploadDocument, isPending: isUploading } = useUploadDocument()
  const { mutate: updateDocument, isPending: isUpdating } = useUpdateUploadedDocument()
  const { mutate: deleteDocument, isPending: isDeleting } = useDeleteDocument()

  // Utilisation des nouveaux hooks pour les véhicules
  const { mutate: uploadVehicule, isPending: isUploadingVehicle } = useUploadVehicule()
  const { mutate: updateVehicule, isPending: isUpdatingVehicle } = useUpdateVehicule()
  const { mutate: deleteVehicule, isPending: isDeletingVehicle } = useDeleteVehicule()

  const vehicleOptions = [
    {
      name: "Vélo",
      value: "vélo",
      icon: <FaBiking className="h-12 w-12" />,
      color: "bg-green-50 border-green-200 hover:bg-green-100",
    },
    {
      name: "Moto",
      value: "moto",
      icon: <FaMotorcycle className="h-12 w-12" />,
      color: "bg-blue-50 border-blue-200 hover:bg-blue-100",
    },
    {
      name: "Voiture",
      value: "voiture",
      icon: <FaCar className="h-12 w-12" />,
      color: "bg-amber-50 border-amber-200 hover:bg-amber-100",
    },
    {
      name: "Autres",
      value: "autres",
      icon: <FaBox className="h-12 w-12" />,
      color: "bg-purple-50 border-purple-200 hover:bg-purple-100",
    },
  ]

  // Initialiser les véhicules sélectionnés si l'utilisateur en a déjà
  useEffect(() => {
    if (authUser?.vehicules && authUser.vehicules.length > 0 && selectedVehicles.length === 0) {
      // Extraire uniquement les types de véhicules pour la sélection
      const vehicleTypes = authUser.vehicules.map((v) => {
        const option = vehicleOptions.find((opt) => opt.value === v.type)
        return option ? option.value : v.type // Modifier pour stocker la valeur et non le nom
      })
      setSelectedVehicles(vehicleTypes)
    }
  }, [authUser])

  const handleVehicleChange = (vehicleName) => {
    setSelectedVehicles((prev) =>
      prev.includes(vehicleName) ? prev.filter((v) => v !== vehicleName) : [...prev, vehicleName],
    )
  }

  const handleFileChange = (e, docType) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Le fichier est trop volumineux (max 5MB)")
      return
    }

    if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type)) {
      toast.error("Format de fichier non valide (JPEG, PNG, PDF)")
      return
    }

    setDocuments((prev) => ({ ...prev, [docType]: file }))
    setUploadProgress((prev) => ({ ...prev, [docType]: 100 }))
  }

  // Modifier la fonction handleSubmitVehicles pour aller à l'étape des détails des véhicules
  const handleSubmitVehicles = () => {
    if (selectedVehicles.length === 0) {
      toast.error("Veuillez sélectionner au moins un véhicule.")
      return
    }

    // Initialiser les détails des véhicules sélectionnés
    const initialDetails = {}
    selectedVehicles.forEach((vehicle) => {
      initialDetails[vehicle] = {
        type: vehicle,
        couleur: "",
        capacite: 50,
        ...(vehicle === "voiture" || vehicle === "moto" ? { plaque: "" } : {}),
      }
    })

    setVehicleDetails(initialDetails)
    setStep("vehicleDetails")
  }

  // Ajouter une fonction pour gérer les changements dans le formulaire de détails des véhicules
  const handleVehicleDetailChange = (vehicleType, field, value) => {
    setVehicleDetails((prev) => ({
      ...prev,
      [vehicleType]: {
        ...prev[vehicleType],
        [field]: field === "capacite" ? Number(value) : value,
      },
    }))
  }

  // Modifier la fonction pour utiliser le hook useUploadVehicule
  const handleSubmitVehicleDetails = async () => {
    // Validation des champs obligatoires
    let isValid = true

    Object.entries(vehicleDetails).forEach(([type, details]) => {
      if ((type === "voiture" || type === "moto") && !details.plaque) {
        toast.error(`Veuillez renseigner la plaque d'immatriculation pour votre ${type}`)
        isValid = false
      }
    })

    if (!isValid) return

    // Vérifier que l'utilisateur est connecté et que son ID est disponible
    if (!authUser || !authUser._id) {
      toast.error("Vous devez être connecté pour effectuer cette action")
      return
    }

    try {
      setProcessingVehicles(true)

      // Utiliser Promise.all pour attendre que tous les véhicules soient traités
      const vehiclePromises = Object.values(vehicleDetails).map((vehicle) => {
        return new Promise((resolve, reject) => {
          // Ajouter l'ID de l'utilisateur aux données du véhicule
          const vehicleData = {
            ...vehicle,
            userId: authUser._id,
          }

          // Utiliser le hook uploadVehicule au lieu de fetch
          uploadVehicule(vehicleData, {
            onSuccess: (data) => {
              resolve(data)
            },
            onError: (error) => {
              reject(error)
            },
          })
        })
      })

      await Promise.all(vehiclePromises)

      toast.success("Véhicules enregistrés avec succès!")
      setProcessingVehicles(false)

      // Toujours passer à l'étape des documents, même pour les utilisateurs déjà vérifiés
      setStep("documents")
    } catch (error) {
      setProcessingVehicles(false)
      toast.error(error.message || "Une erreur est survenue lors de l'enregistrement des véhicules")
    }
  }

  const getRequiredDocs = () => {
    const docs = ["carte d'identité", "photo de votre tête"]
    selectedVehicles.forEach((vehicle) => {
      if (vehicle === "moto" || vehicle === "voiture") {
        docs.push(`permis ${vehicle}`, `carte grise ${vehicle}`, `assurance ${vehicle}`)
      }
    })
    return docs
  }

  // Modifier la fonction handleSubmit pour inclure les détails des véhicules
  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData()
    const requiredDocs = getRequiredDocs()
    let allDocsPresent = true

    requiredDocs.forEach((doc) => {
      if (documents[doc]) {
        formData.append("documents", documents[doc])
        formData.append("labels", doc)
      } else {
        toast.error(`Veuillez ajouter le fichier pour ${doc}`)
        allDocsPresent = false
      }
    })

    if (allDocsPresent) {
      // Utiliser les détails des véhicules déjà envoyés à l'étape précédente
      uploadDocument(formData, {
        onSuccess: () => {
          // Toujours réinitialiser l'état après l'ajout réussi
          setIsAddingNewVehicle(false)
          setStep("vehicles")

          setTimeout(() => {
            refetchAuthUser()
          }, 1000)
        },
      })
    }
  }

  // Gestion du formulaire d'ajout de véhicule
  const handleNewVehicleChange = (e) => {
    const { name, value } = e.target
    setNewVehicle((prev) => ({
      ...prev,
      [name]: name === "capacite" ? Number.parseInt(value) : value,
    }))
  }

  const handleAddVehicle = (e) => {
    e.preventDefault()

    // Validation des champs
    if ((newVehicle.type === "voiture" || newVehicle.type === "moto") && !newVehicle.plaque) {
      toast.error("La plaque d'immatriculation est obligatoire pour les voitures et motos")
      return
    }

    uploadVehicule(newVehicle, {
      onSuccess: () => {
        setShowAddVehicleForm(false)
        setNewVehicle({
          type: "vélo",
          plaque: "",
          couleur: "",
          capacite: 50,
        })
        setTimeout(() => {
          refetchAuthUser()
        }, 1000)
      },
    })
  }

  // Gestion du formulaire de modification de véhicule
  const handleEditVehicle = (vehicle) => {
    setCurrentVehicle(vehicle)
    setNewVehicle({
      type: vehicle.type,
      plaque: vehicle.plaque || "",
      couleur: vehicle.couleur || "",
      capacite: vehicle.capacite || 50,
    })
    setShowEditVehicleForm(true)
  }

  // Modifier la fonction handleUpdateVehicle pour utiliser l'endpoint "/api/user/updateUserform"
  const handleUpdateVehicle = async (e) => {
    e.preventDefault()

    // Validation des champs
    if (
      (newVehicle.type === "voiture" || newVehicle.type === "moto") &&
      !newVehicle.plaque &&
      currentVehicle.statut !== "vérifié"
    ) {
      toast.error("La plaque d'immatriculation est obligatoire pour les voitures et motos")
      return
    }

    try {
      // Préparer les données à envoyer
      // Pour les véhicules vérifiés, on ne modifie que la couleur
      const updatedVehicles = UserVehicles.map((vehicle) => {
        if (vehicle._id === currentVehicle._id) {
          if (vehicle.statut === "vérifié") {
            // Pour les véhicules vérifiés, on ne modifie que la couleur et la capacité
            return {
              ...vehicle,
              couleur: newVehicle.couleur,
              capacite: newVehicle.capacite,
            }
          } else {
            // Pour les autres véhicules, on peut tout modifier
            return {
              ...vehicle,
              type: newVehicle.type,
              plaque: newVehicle.plaque || undefined,
              couleur: newVehicle.couleur,
              capacite: newVehicle.capacite,
            }
          }
        }
        return vehicle
      })

      // Envoyer la requête avec tous les véhicules
      const response = await fetch("/api/user/updateUserform", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: authUser._id,
          vehicules: updatedVehicles,
          role: "livreur",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Échec de la mise à jour du véhicule")
      }

      toast.success("Véhicule mis à jour avec succès!")
      setShowEditVehicleForm(false)
      setCurrentVehicle(null)
      setNewVehicle({
        type: "vélo",
        plaque: "",
        couleur: "",
        capacite: 50,
      })

      setTimeout(() => {
        refetchAuthUser()
      }, 1000)
    } catch (error) {
      toast.error(error.message || "Une erreur est survenue lors de la mise à jour du véhicule")
    }
  }

  // Modifier la fonction handleDeleteVehicle pour utiliser l'endpoint "/api/user/updateUserform"
  const handleDeleteVehicle = async (vehicleId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce véhicule ?")) {
      try {
        // Filtrer le véhicule à supprimer
        const updatedVehicles = UserVehicles.filter((vehicle) => vehicle._id !== vehicleId)

        // Envoyer la requête avec la liste mise à jour des véhicules
        const response = await fetch("/api/user/updateUserform", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: authUser._id,
            vehicules: updatedVehicles,
            role: "livreur",
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Échec de la suppression du véhicule")
        }

        toast.success("Véhicule supprimé avec succès!")

        setTimeout(() => {
          refetchAuthUser()
        }, 1000)
      } catch (error) {
        toast.error(error.message || "Une erreur est survenue lors de la suppression du véhicule")
      }
    }
  }

  const getDocumentTypeLabel = (docType) => {
    return docType
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  const getFileIcon = (fileName) => {
    if (!fileName) return null
    const extension = fileName.split(".").pop()?.toLowerCase()

    if (extension === "pdf") {
      return <FaFilePdf className="text-red-500 h-4 w-4" />
    } else if (["jpg", "jpeg", "png"].includes(extension || "")) {
      return <FaFileImage className="text-blue-500 h-4 w-4" />
    }

    return <FaFile className="text-gray-500 h-4 w-4" />
  }

  const getFileType = (fileName) => {
    if (!fileName) return "Document"
    const extension = fileName.split(".").pop()?.toLowerCase()

    if (extension === "pdf") {
      return "PDF"
    } else if (["jpg", "jpeg", "png"].includes(extension || "")) {
      return "Image"
    }

    return "Document"
  }

  const getStatusIcon = (statut) => {
    switch (statut) {
      case "en attente":
        return <FaHourglassHalf className="text-yellow-500" />
      case "validé":
        return <FaCheckCircle className="text-green-500" />
      case "vérifié":
        return <FaCheckCircle className="text-green-500" />
      case "refusé":
        return <FaTimesCircle className="text-red-500" />
      case "non vérifié":
        return <FaExclamationTriangle className="text-orange-500" />
      default:
        return <FaSpinner className="text-gray-500 animate-spin" />
    }
  }

  const getStatusText = (statut) => {
    switch (statut) {
      case "en attente":
        return "En attente de vérification"
      case "validé":
        return "Validé"
      case "vérifié":
        return "Vérifié"
      case "refusé":
        return "Refusé"
      case "non vérifié":
        return "Non vérifié"
      default:
        return "En attente"
    }
  }

  const getStatusClass = (statut) => {
    switch (statut) {
      case "en attente":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "validé":
        return "bg-green-100 text-green-800 border-green-200"
      case "vérifié":
        return "bg-green-100 text-green-800 border-green-200"
      case "refusé":
        return "bg-red-100 text-red-800 border-red-200"
      case "non vérifié":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
    }
  }

  const handleUpdateDocument = (documentId) => {
    const fileInput = document.createElement("input")
    fileInput.type = "file"
    fileInput.accept = "image/*,application/pdf"
    fileInput.onchange = (e) => {
      const file = e.target.files?.[0]
      if (!file) return

      if (file.size > 5 * 1024 * 1024) {
        toast.error("Le fichier est trop volumineux (max 5MB)")
        return
      }

      if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type)) {
        toast.error("Format de fichier non valide (JPEG, PNG, PDF)")
        return
      }

      updateDocument({ documentId, file })
    }
    fileInput.click()
  }

  const handleDeleteDocument = (documentId, statut) => {
    if (statut === "approuvé") {
      toast.error("Impossible de supprimer un document approuvé")
      return
    }

    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) {
      deleteDocument(documentId)
    }
  }

  // Si l'utilisateur est en cours de vérification, afficher le tableau des documents et des véhicules
  if (authUser?.statut !== "non vérifié" && !isAddingNewVehicle) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Statut de vos pièces justificatives</h1>
          <p className="text-gray-600">Vos documents sont en cours de vérification par notre équipe</p>
        </div>

        {/* Statut global */}
        {authUser?.statut === "vérifié" ? (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <FaCheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">
                  Félicitations! Votre compte est <span className="font-semibold">vérifié</span>. Vous pouvez maintenant
                  accéder à toutes les fonctionnalités.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <FaHourglassHalf className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Votre compte est actuellement <span className="font-semibold">en vérification</span>. Nos équipes
                  examinent vos documents. Vous recevrez une notification lorsque la vérification sera terminée.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Section des véhicules */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Mes véhicules</h2>
            {authUser?.statut === "non vérifié" && (
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowAddVehicleForm(true)}
                  className="flex items-center text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors"
                >
                  <FaPlus className="mr-1" />
                  Ajouter rapidement
                </button>
                <button
                  onClick={() => {
                    setIsAddingNewVehicle(true)
                    setStep("vehicles")
                    setSelectedVehicles([])
                    setVehicleDetails({})
                    setDocuments({})
                    setUploadProgress({})
                  }}
                  className="flex items-center text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors"
                >
                  <FaPlus className="mr-1" />
                  Ajouter avec assistant
                </button>
              </div>
            )}
          </div>

          {UserVehicles && UserVehicles.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left py-4 px-4 font-semibold text-gray-600 rounded-tl-lg">Type</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-600">Plaque</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-600">Couleur</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-600">Capacité</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-600">Statut</th>
                    <th className="text-right py-4 px-4 font-semibold text-gray-600 rounded-tr-lg">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {UserVehicles.map((vehicle, index) => (
                    <tr
                      key={vehicle._id || index}
                      className={`hover:bg-emerald-50 transition-colors duration-150 ${
                        index === UserVehicles.length - 1 ? "rounded-b-lg" : ""
                      }`}
                    >
                      <td className="py-4 px-4 font-medium text-gray-900 capitalize">{vehicle.type}</td>
                      <td className="py-4 px-4 text-gray-500">{vehicle.plaque || "-"}</td>
                      <td className="py-4 px-4 text-gray-500">{vehicle.couleur || "Inconnue"}</td>
                      <td className="py-4 px-4 text-gray-500">{vehicle.capacite || 50}</td>
                      <td className="py-4 px-4">
                        <div
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(
                            vehicle.statut || "non vérifié",
                          )}`}
                        >
                          {getStatusIcon(vehicle.statut || "non vérifié")}
                          <span className="ml-1.5">{getStatusText(vehicle.statut || "non vérifié")}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex space-x-3 justify-end">
                          <button
                            onClick={() => handleEditVehicle(vehicle)}
                            className="text-amber-600 hover:text-amber-800 flex items-center"
                          >
                            <FaPencilAlt className="mr-1" />
                            <span>{vehicle.statut === "vérifié" ? "Modifier couleur/capacité" : "Modifier"}</span>
                          </button>

                          <button
                            onClick={() => handleDeleteVehicle(vehicle._id)}
                            className="text-red-600 hover:text-red-800 flex items-center"
                            disabled={vehicle.statut === "vérifié"}
                          >
                            <FaTrash className="mr-1" />
                            <span>Supprimer</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Aucun véhicule enregistré</p>
            </div>
          )}
        </div>

        {/* Section des documents */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Documents soumis</h2>
            <button
              onClick={() => {
                refetchAuthUser()
                toast.success("Statut actualisé")
              }}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              <FaSync className="mr-1" />
              Actualiser
            </button>
          </div>

          {UserDocuments && UserDocuments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left py-4 px-4 font-semibold text-gray-600 rounded-tl-lg">Nom</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-600">Label</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-600">Type</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-600">Statut</th>
                    <th className="text-right py-4 px-4 font-semibold text-gray-600 rounded-tr-lg">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {UserDocuments.map((doc, index) => {
                    const isDeleted = !doc.url

                    return (
                      <tr
                        key={doc._id}
                        className={`hover:bg-emerald-50 transition-colors duration-150 ${
                          index === UserDocuments.length - 1 ? "rounded-b-lg" : ""
                        }`}
                      >
                        <td className="py-4 px-4 font-medium text-gray-900">{doc.nom}</td>

                        <td className="py-4 px-4 text-gray-500">{doc.label || "Non spécifié"}</td>

                        <td className="py-4 px-4 text-gray-500">
                          <div className="flex items-center">
                            {getFileIcon(doc.nom)}
                            <span className="ml-2 text-xs">{getFileType(doc.nom)}</span>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <div
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(
                              doc.statut,
                            )}`}
                          >
                            {getStatusIcon(doc.statut)}
                            <span className="ml-1.5">{getStatusText(doc.statut)}</span>
                          </div>
                        </td>

                        <td className="py-4 px-4 text-right">
                          {isDeleted ? (
                            <button
                              onClick={() => handleUpdateDocument(doc._id)}
                              className="text-green-600 hover:text-green-800 flex items-center justify-end ml-auto"
                            >
                              <FaUpload className="mr-1" />
                              <span>Re-soumettre</span>
                            </button>
                          ) : (
                            <div className="flex space-x-3 justify-end">
                              <button
                                onClick={() => window.open(getDocumentUrl(doc.url), "_blank")}
                                className="text-blue-600 hover:text-blue-800 flex items-center"
                              >
                                <FaEye className="mr-1" />
                                <span>Voir</span>
                              </button>

                              <button
                                onClick={() => handleUpdateDocument(doc._id)}
                                className="text-amber-600 hover:text-amber-800 flex items-center"
                              >
                                <FaSync className="mr-1" />
                                <span>Modifier</span>
                              </button>

                              {doc.statut !== "validé" && (
                                <button
                                  onClick={() => handleDeleteDocument(doc._id, doc.statut)}
                                  className="text-red-600 hover:text-red-800 flex items-center"
                                >
                                  <FaTrash className="mr-1" />
                                  <span>Supprimer</span>
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <FaSpinner className="animate-spin h-8 w-8 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Chargement des documents...</p>
            </div>
          )}

          <div className="mt-6 flex justify-between">
            <button
              onClick={() => {
                setIsAddingNewVehicle(true)
                setStep("vehicles")
                setSelectedVehicles([])
                setVehicleDetails({})
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
            >
              <FaPlus className="mr-2" />
              Ajouter un nouveau véhicule
            </button>
            <button
              onClick={() => (window.location.href = "/dashboard")}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Aller au tableau de bord
            </button>
          </div>
        </div>

        {/* Modal d'ajout de véhicule */}
        {showAddVehicleForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold mb-4">Ajouter un véhicule</h3>
              <form onSubmit={handleAddVehicle}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type de véhicule</label>
                    <select
                      name="type"
                      value={newVehicle.type}
                      onChange={handleNewVehicleChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="vélo">Vélo</option>
                      <option value="moto">Moto</option>
                      <option value="voiture">Voiture</option>
                      <option value="autres">Autres</option>
                    </select>
                  </div>

                  {(newVehicle.type === "voiture" || newVehicle.type === "moto") && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Plaque d'immatriculation <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="plaque"
                        value={newVehicle.plaque}
                        onChange={handleNewVehicleChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Couleur</label>
                    <input
                      type="text"
                      name="couleur"
                      value={newVehicle.couleur}
                      onChange={handleNewVehicleChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Capacité (1-100)</label>
                    <input
                      type="number"
                      name="capacite"
                      min="1"
                      max="100"
                      value={newVehicle.capacite}
                      onChange={handleNewVehicleChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddVehicleForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    disabled={isUploadingVehicle}
                  >
                    {isUploadingVehicle ? "Ajout en cours..." : "Ajouter"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de modification de véhicule */}
        {showEditVehicleForm && currentVehicle && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold mb-4">
                {currentVehicle.statut === "vérifié" ? "Modifier la couleur du véhicule" : "Modifier le véhicule"}
              </h3>
              {currentVehicle.statut === "vérifié" && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-600 text-sm">
                  <strong>Note :</strong> Pour un véhicule vérifié, seules la couleur et la capacité peuvent être
                  modifiées.
                </div>
              )}
              <form onSubmit={handleUpdateVehicle}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type de véhicule</label>
                    <select
                      name="type"
                      value={newVehicle.type}
                      onChange={handleNewVehicleChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      disabled={currentVehicle.statut === "vérifié"}
                    >
                      <option value="vélo">Vélo</option>
                      <option value="moto">Moto</option>
                      <option value="voiture">Voiture</option>
                      <option value="autres">Autres</option>
                    </select>
                  </div>

                  {(newVehicle.type === "voiture" || newVehicle.type === "moto") && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Plaque d'immatriculation{" "}
                        {currentVehicle.statut !== "vérifié" && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="text"
                        name="plaque"
                        value={newVehicle.plaque}
                        onChange={handleNewVehicleChange}
                        className={`w-full border border-gray-300 rounded-md px-3 py-2 ${currentVehicle.statut === "vérifié" ? "bg-gray-100" : ""}`}
                        required={currentVehicle.statut !== "vérifié"}
                        disabled={currentVehicle.statut === "vérifié"}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Couleur</label>
                    <input
                      type="text"
                      name="couleur"
                      value={newVehicle.couleur}
                      onChange={handleNewVehicleChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Capacité (1-100)</label>
                    <input
                      type="number"
                      name="capacite"
                      min="1"
                      max="100"
                      value={newVehicle.capacite}
                      onChange={handleNewVehicleChange}
                      className={`w-full border border-gray-300 rounded-md px-3 py-2`}
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowEditVehicleForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button type="submit" className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700">
                    Modifier
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Sinon, afficher le formulaire normal avec les étapes
  return (
    <div className="max-w-4xl mx-auto p-6 ">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Soumettre vos pièces justificatives</h1>
        <p className="text-gray-600">Veuillez compléter les informations ci-dessous pour finaliser votre inscription</p>
      </div>
      {/* Modifier la section de navigation des étapes pour inclure la nouvelle étape */}
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <div
            className={`rounded-full w-8 h-8 flex items-center justify-center ${
              step === "vehicles" ? "bg-green-500 text-white" : "bg-green-100 text-green-800"
            } mr-2`}
          >
            1
          </div>
          <div className="h-1 w-12 bg-gray-200"></div>
          <div
            className={`rounded-full w-8 h-8 flex items-center justify-center ${
              step === "vehicleDetails"
                ? "bg-green-500 text-white"
                : step === "documents"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-200 text-gray-500"
            } mx-2`}
          >
            2
          </div>
          <div className="h-1 w-12 bg-gray-200"></div>
          <div
            className={`rounded-full w-8 h-8 flex items-center justify-center ${
              step === "documents" ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
            } mx-2`}
          >
            3
          </div>
        </div>
        <div className="flex text-sm">
          <div className="w-8 text-center mr-2">Véhicules</div>
          <div className="w-12"></div>
          <div className="w-20 text-center mx-2">Détails</div>
          <div className="w-12"></div>
          <div className="w-20 text-center mx-2">Documents</div>
        </div>
      </div>
      {step === "vehicles" ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6">
            {isAddingNewVehicle ? "Quel(s) véhicule(s) voulez-vous rajouter ?" : "Quel(s) véhicule(s) utilisez-vous ?"}
          </h2>
          <p className="text-gray-600 mb-6">Sélectionnez tous les véhicules que vous utiliserez pour vos livraisons</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {vehicleOptions.map((vehicle) => (
              <div
                key={vehicle.name}
                className={`cursor-pointer border-2 rounded-lg transition-all duration-200 relative ${
                  selectedVehicles.includes(vehicle.value)
                    ? "border-green-500 ring-2 ring-green-200"
                    : "border-gray-200"
                } ${vehicle.color}`}
                onClick={() => handleVehicleChange(vehicle.value)}
              >
                <div className="p-6 flex flex-col items-center justify-center">
                  <div className="mb-4">{vehicle.icon}</div>
                  <p className="font-medium text-lg">{vehicle.name}</p>
                  {selectedVehicles.includes(vehicle.value) && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                      <FaCheck className="h-4 w-4" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {isAddingNewVehicle && (
            <div className="flex justify-between">
              <button
                onClick={() => setIsAddingNewVehicle(false)}
                className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmitVehicles}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center transition-colors duration-200"
              >
                Continuer
                <FaArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      ) : null}
      {/* Ajouter une nouvelle section pour le formulaire de détails des véhicules */}
      {step === "vehicleDetails" && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6">Détails des véhicules</h2>
          <p className="text-gray-600 mb-6">Veuillez renseigner les détails pour chaque véhicule sélectionné</p>

          <div className="space-y-8">
            {Object.entries(vehicleDetails).map(([vehicleType, details]) => (
              <div key={vehicleType} className="border rounded-lg p-4">
                <h3 className="text-lg font-medium mb-4 capitalize">{vehicleType}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(vehicleType === "voiture" || vehicleType === "moto") && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Plaque d'immatriculation <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={details.plaque}
                        onChange={(e) => handleVehicleDetailChange(vehicleType, "plaque", e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Couleur</label>
                    <input
                      type="text"
                      value={details.couleur}
                      onChange={(e) => handleVehicleDetailChange(vehicleType, "couleur", e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Capacité (1-100)</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={details.capacite}
                      onChange={(e) => handleVehicleDetailChange(vehicleType, "capacite", e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-6">
            <button
              type="button"
              onClick={() => setStep("vehicles")}
              className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Retour
            </button>

            <button
              type="button"
              onClick={handleSubmitVehicleDetails}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center transition-colors duration-200"
              disabled={isUploadingVehicle || processingVehicles}
            >
              {isUploadingVehicle || processingVehicles ? (
                <>
                  <FaSpinner className="animate-spin mr-2 h-4 w-4" />
                  Traitement en cours...
                </>
              ) : (
                <>
                  Continuer
                  <FaArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
      {step === "documents" ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6">Télécharger vos pièces justificatives</h2>
          <p className="text-gray-600 mb-6">
            Veuillez fournir les documents suivants pour valider votre compte. Formats acceptés: JPEG, PNG, PDF (max
            5MB)
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {getRequiredDocs().map((doc) => (
                <div key={doc} className="relative">
                  <div
                    className={`border-2 rounded-lg p-4 ${
                      documents[doc] ? "border-green-500 bg-green-50" : "border-dashed border-gray-300"
                    }`}
                  >
                    <label className="block mb-2 font-medium text-gray-700">{getDocumentTypeLabel(doc)}</label>

                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileChange(e, doc)}
                      className="hidden"
                      id={`file-input-${doc}`}
                    />

                    {!documents[doc] ? (
                      <button
                        type="button"
                        onClick={() => document.getElementById(`file-input-${doc}`)?.click()}
                        className="w-full py-8 border border-gray-300 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                      >
                        <FaUpload className="h-6 w-6 text-gray-500" />
                        <span className="text-sm text-gray-500">Cliquez pour sélectionner</span>
                      </button>
                    ) : (
                      <div className="flex items-center justify-between bg-white p-3 rounded border">
                        <div className="flex items-center">
                          {getFileIcon(documents[doc].name)}
                          <span className="ml-2 text-sm truncate max-w-[180px]">{documents[doc].name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => document.getElementById(`file-input-${doc}`)?.click()}
                          className="text-xs text-gray-600 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100"
                        >
                          Modifier
                        </button>
                      </div>
                    )}

                    {uploadProgress[doc] && (
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                        <div
                          className="bg-green-500 h-1 rounded-full"
                          style={{
                            width: `${uploadProgress[doc]}%`,
                          }}
                        ></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-4">
              {/* Modifier le bouton de retour dans la section des documents pour revenir à l'étape des détails des
              véhicules */}
              <button
                type="button"
                onClick={() => {
                  if (isAddingNewVehicle && authUser?.statut !== "non vérifié") {
                    setIsAddingNewVehicle(false)
                  } else {
                    setStep("vehicleDetails")
                  }
                }}
                className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {isAddingNewVehicle && authUser?.statut !== "non vérifié" ? "Annuler" : "Retour"}
              </button>
              <button
                type="submit"
                className={`bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors ${
                  isUploading ? "opacity-70 cursor-not-allowed" : ""
                }`}
                disabled={isUploading}
              >
                {isUploading
                  ? "Envoi en cours..."
                  : isAddingNewVehicle && authUser?.statut !== "non vérifié"
                    ? "Soumettre les documents pour le nouveau véhicule"
                    : "Soumettre les documents"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}

export default JustificativePage
