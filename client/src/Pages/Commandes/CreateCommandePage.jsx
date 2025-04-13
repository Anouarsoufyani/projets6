"use client"

import { useAuthUserQuery, useGetUsersByRole, useGetCoords   } from "../../Hooks"
import { useMutation } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { useEffect, useState } from "react"
import { FaStore, FaMapMarkerAlt, FaMoneyBillWave } from "react-icons/fa"

const CreateCommandePage = () => {
  const { data: authUser } = useAuthUserQuery()
  const [shouldSubmit, setShouldSubmit] = useState(false)

  const [formData, setFormData] = useState({
    commercant_id: "",
    adresse_livraison: {
      rue: "",
      ville: "",
      code_postal: "",
      lat: "",
      lng: "",
    },
    total: 0,
  })

  const fullAdresse =
    formData.adresse_livraison.rue && formData.adresse_livraison.ville && formData.adresse_livraison.code_postal
      ? `${formData.adresse_livraison.rue}, ${formData.adresse_livraison.ville}, ${formData.adresse_livraison.code_postal}`
      : null

  const {
    data: coords,
    isSuccess,
    isFetching,
    refetch,
  } = useGetCoords(fullAdresse, {
    enabled: false, // on déclenche manuellement
    retry: false,
  })

  const { data: commercantsData, isLoading: isLoadingCommercants } = useGetUsersByRole("commercant")

  const { mutate: createCommandeMutation, isPending } = useMutation({
    mutationFn: async (commandeData) => {
      const res = await fetch(`/api/commandes/new`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(commandeData),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la création de la commande")
      }

      return data
    },
    onSuccess: () => {
      toast.success("Commande créée avec succès")
      setFormData({
        commercant_id: "",
        adresse_livraison: {
          rue: "",
          ville: "",
          code_postal: "",
          lat: "",
          lng: "",
        },
        total: 0,
      })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()

    const { commercant_id, adresse_livraison, total } = formData

    if (
      !authUser?._id ||
      !commercant_id ||
      !adresse_livraison.rue ||
      !adresse_livraison.ville ||
      !adresse_livraison.code_postal ||
      !total
    ) {
      toast.error("Veuillez remplir tous les champs obligatoires")
      return
    }

    // Déclencher la récupération des coordonnées
    setShouldSubmit(true)
    refetch()
  }

  useEffect(() => {
    if (shouldSubmit && isSuccess && coords) {
      setShouldSubmit(false)
      createCommandeMutation({
        ...formData,
        client_id: authUser._id,
        adresse_livraison: {
          ...formData.adresse_livraison,
          lat: coords.lat,
          lng: coords.lng,
        },
      })
    }
  }, [shouldSubmit, isSuccess, coords])

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleAdresseChange = (e) => {
    setFormData({
      ...formData,
      adresse_livraison: {
        ...formData.adresse_livraison,
        [e.target.name]: e.target.value,
      },
    })
  }

  return (
    <div className="w-full min-h-full items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 p-6 flex flex-col">
      <div className="flex flex-col gap-6 justify-center items-center w-1/2 h-9/10 bg-white p-8 rounded-xl shadow-2xl">
        <h1 className="text-3xl font-bold text-emerald-600 mb-4">Créer une commande</h1>
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Commerçant</label>
            <div className="relative">
              <FaStore className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black" />
              <select
                name="commercant_id"
                className="pl-10 w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                onChange={handleInputChange}
                value={formData.commercant_id}
                disabled={isLoadingCommercants}
              >
                <option value="">Sélectionner un commerçant</option>
                {commercantsData?.data?.map((commercant) => (
                  <option key={commercant._id} value={commercant._id}>
                    {commercant.nom_boutique || commercant.nom} -{" "}
                    {commercant.adresse_boutique?.ville || "Adresse non spécifiée"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Adresse de livraison */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Adresse de livraison</label>
            <div className="relative">
              <FaMapMarkerAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black" />
              <input
                type="text"
                placeholder="Rue"
                name="rue"
                className="pl-10 w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                onChange={handleAdresseChange}
                value={formData.adresse_livraison.rue}
              />
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ville"
                name="ville"
                className="w-1/2 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                onChange={handleAdresseChange}
                value={formData.adresse_livraison.ville}
              />
              <input
                type="text"
                placeholder="Code postal"
                name="code_postal"
                className="w-1/2 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                onChange={handleAdresseChange}
                value={formData.adresse_livraison.code_postal}
              />
            </div>
          </div>

          {/* Total */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Total</label>
            <div className="relative">
              <FaMoneyBillWave className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black" />
              <input
                type="number"
                name="total"
                className="pl-10 w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                onChange={handleInputChange}
                value={formData.total || ""}
              />
            </div>
          </div>

          {/* Bouton */}
          <button
            type="submit"
            className="w-full bg-emerald-600 text-white py-3 rounded-md hover:bg-emerald-700 transition duration-300 mt-4"
            disabled={isFetching || isPending}
          >
            {isFetching || isPending ? (
              <span className="loading loading-spinner loading-md"></span>
            ) : (
              "Créer la commande"
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default CreateCommandePage
