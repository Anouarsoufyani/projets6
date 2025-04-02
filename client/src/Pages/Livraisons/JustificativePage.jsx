"use client"

import { useState } from "react"
import { toast } from "react-hot-toast"
import { useMutation } from "@tanstack/react-query"
import { FaBiking, FaCar, FaMotorcycle, FaBox, FaUpload, FaCheck, FaArrowRight } from "react-icons/fa"

const JustificativePage = () => {
  const [selectedVehicles, setSelectedVehicles] = useState([])
  const [step, setStep] = useState("vehicles")
  const [documents, setDocuments] = useState({})
  const [uploadProgress, setUploadProgress] = useState({})

  const vehicleOptions = [
    {
      name: "Vélo",
      icon: <FaBiking className="h-12 w-12" />,
      color: "bg-green-50 border-green-200 hover:bg-green-100",
    },
    {
      name: "Moto",
      icon: <FaMotorcycle className="h-12 w-12" />,
      color: "bg-blue-50 border-blue-200 hover:bg-blue-100",
    },
    {
      name: "Voiture",
      icon: <FaCar className="h-12 w-12" />,
      color: "bg-amber-50 border-amber-200 hover:bg-amber-100",
    },
    {
      name: "Autres",
      icon: <FaBox className="h-12 w-12" />,
      color: "bg-purple-50 border-purple-200 hover:bg-purple-100",
    },
  ]

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

  const handleSubmitVehicles = () => {
    if (selectedVehicles.length === 0) {
      toast.error("Veuillez sélectionner au moins un véhicule.")
      return
    }
    setStep("documents")
  }

  const getRequiredDocs = () => {
    const docs = ["carte d'identité", "photo de votre tête"]
    selectedVehicles.forEach((vehicle) => {
      if (vehicle === "Moto" || vehicle === "Voiture") {
        docs.push(`permis ${vehicle}`, `carte grise ${vehicle}`, `assurance ${vehicle}`)
      }
    })
    return docs
  }

  const uploadMutation = useMutation({
    mutationFn: async (formData) => {
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) throw new Error("Échec de l'envoi des documents")
      return res.json()
    },
    onSuccess: () => {
      toast.success("Documents soumis avec succès !")
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de la soumission")
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData()
    const requiredDocs = getRequiredDocs()
    let allDocsPresent = true

    requiredDocs.forEach((doc) => {
      if (documents[doc]) {
        formData.append(doc, documents[doc])
      } else {
        toast.error(`Veuillez ajouter le fichier pour ${doc}`)
        allDocsPresent = false
      }
    })

    if (allDocsPresent) {
      uploadMutation.mutate(formData)
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
      return <div className="text-red-500 text-xs font-medium">PDF</div>
    } else if (["jpg", "jpeg", "png"].includes(extension || "")) {
      return <div className="text-blue-500 text-xs font-medium">IMAGE</div>
    }

    return null
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Soumettre vos pièces justificatives</h1>
        <p className="text-gray-600">Veuillez compléter les informations ci-dessous pour finaliser votre inscription</p>
      </div>

      <div className="mb-6">
        <div className="flex items-center mb-2">
          <div
            className={`rounded-full w-8 h-8 flex items-center justify-center ${step === "vehicles" ? "bg-green-500 text-white" : "bg-green-100 text-green-800"} mr-2`}
          >
            1
          </div>
          <div className="h-1 w-12 bg-gray-200"></div>
          <div
            className={`rounded-full w-8 h-8 flex items-center justify-center ${step === "documents" ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"} mx-2`}
          >
            2
          </div>
        </div>
        <div className="flex text-sm">
          <div className="w-8 text-center mr-2">Véhicules</div>
          <div className="w-12"></div>
          <div className="w-8 text-center mx-2">Documents</div>
        </div>
      </div>

      {step === "vehicles" ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6">Quel(s) véhicule(s) utilisez-vous ?</h2>
          <p className="text-gray-600 mb-6">Sélectionnez tous les véhicules que vous utiliserez pour vos livraisons</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {vehicleOptions.map((vehicle) => (
              <div
                key={vehicle.name}
                className={`cursor-pointer border-2 rounded-lg transition-all duration-200 relative ${
                  selectedVehicles.includes(vehicle.name) ? "border-green-500 ring-2 ring-green-200" : "border-gray-200"
                } ${vehicle.color}`}
                onClick={() => handleVehicleChange(vehicle.name)}
              >
                <div className="p-6 flex flex-col items-center justify-center">
                  <div className="mb-4">{vehicle.icon}</div>
                  <p className="font-medium text-lg">{vehicle.name}</p>
                  {selectedVehicles.includes(vehicle.name) && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                      <FaCheck className="h-4 w-4" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSubmitVehicles}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center transition-colors duration-200"
            >
              Continuer
              <FaArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
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
                    className={`border-2 rounded-lg p-4 ${documents[doc] ? "border-green-500 bg-green-50" : "border-dashed border-gray-300"}`}
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
                          style={{ width: `${uploadProgress[doc]}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep("vehicles")}
                className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Retour
              </button>

              <button
                type="submit"
                className={`bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors ${uploadMutation.isPending ? "opacity-70 cursor-not-allowed" : ""}`}
                disabled={uploadMutation.isPending}
              >
                {uploadMutation.isPending ? "Envoi en cours..." : "Soumettre les documents"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default JustificativePage

