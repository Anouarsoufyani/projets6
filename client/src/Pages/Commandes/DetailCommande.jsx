"use client"

import { useState } from "react"
import { useAuthUserQuery, useGetCommandeById, useUpdateCommandeStatus, useCancelCommande } from "../../Hooks"
import { useParams, useNavigate, Link } from "react-router"
import { FaUser, FaStore, FaTruck, FaMapMarkerAlt, FaEuroSign, FaClock, FaBarcode } from "react-icons/fa"
import ReviewForm from "../../Components/Reviews/ReviewForm"
import { useGetReviewsForUser } from "../../Hooks/queries/useGetReviews"

const DetailCommande = () => {
  const { data: authUser } = useAuthUserQuery()
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: commande, isCommandeLoading: isLoading } = useGetCommandeById(id)
  const { mutate: updateStatus, isLoading: isUpdating } = useUpdateCommandeStatus()
  const { mutate: cancelCommande, isLoading: isCancelling } = useCancelCommande()
  const [showCommercantReviewForm, setShowCommercantReviewForm] = useState(false)
  const [showLivreurReviewForm, setShowLivreurReviewForm] = useState(false)

  // Récupérer les avis existants pour cette commande
  const { data: commercantReviews } = useGetReviewsForUser(commande?.commercant_id?._id)
  const { data: livreurReviews } = useGetReviewsForUser(commande?.livreur_id?._id)

  // Vérifier si l'utilisateur a déjà laissé un avis
  const hasReviewedCommercant = commercantReviews?.some(
    (review) => review.commandeId === id && review.clientId === authUser?._id,
  )
  const hasReviewedLivreur = livreurReviews?.some(
    (review) => review.commandeId === id && review.clientId === authUser?._id,
  )

  if (isLoading || !commande) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  const {
    _id,
    client_id,
    commercant_id,
    livreur_id,
    total,
    statut,
    date_creation,
    code_Client,
    code_Commercant,
    adresse_livraison,
  } = commande

  const handleRedirect = () => navigate(`/livraison/${_id}`)

  const handleUpdateStatus = (newStatus) => {
    updateStatus({ commandeId: _id, newStatus })
  }

  const handleCancelCommande = () => {
    cancelCommande(_id, {
      onSuccess: () => {
        navigate("/commandes")
      },
    })
  }

  const renderActionButtons = () => {
    if (!authUser) return null

    const role = authUser.role

    if (role === "commercant" && statut === "en_attente") {
      return (
        <div className="flex gap-4">
          <button
            className="bg-green-600 text-white px-4 py-2 rounded-xl shadow hover:bg-green-700 transition-colors"
            onClick={() => handleUpdateStatus("en_preparation")}
            disabled={isUpdating}
          >
            {isUpdating ? "Traitement..." : "Valider"}
          </button>
          <button
            className="bg-red-600 text-white px-4 py-2 rounded-xl shadow hover:bg-red-700 transition-colors"
            onClick={() => handleUpdateStatus("refusee")}
            disabled={isUpdating}
          >
            {isUpdating ? "Traitement..." : "Refuser"}
          </button>
        </div>
      )
    }

    if (role === "commercant" && statut === "en_preparation") {
      return (
        <button className="bg-blue-600 text-white px-4 py-2 rounded-xl shadow hover:bg-blue-700 transition-colors">
          <Link to={`/livreurs/${_id}`}>Assigner un livreur</Link>
        </button>
      )
    }

    if (role === "client" && statut === "en_attente") {
      return (
        <button
          className="bg-yellow-600 text-white px-4 py-2 rounded-xl shadow hover:bg-yellow-700 transition-colors"
          onClick={handleCancelCommande}
          disabled={isCancelling}
        >
          {isCancelling ? "Annulation..." : "Annuler"}
        </button>
      )
    }

    if (role === "livreur" && statut === "en_preparation") {
      return (
        <div className="flex gap-4">
          <button
            className="bg-green-600 text-white px-4 py-2 rounded-xl shadow hover:bg-green-700 transition-colors"
            onClick={() => {}}
          >
            Accepter la course
          </button>
          <button
            className="bg-red-600 text-white px-4 py-2 rounded-xl shadow hover:bg-red-700 transition-colors"
            onClick={() => {}}
          >
            Refuser
          </button>
        </div>
      )
    }

    if (["prete_a_etre_recuperee", "recuperee_par_livreur", "livree"].includes(statut)) {
      return (
        <button
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl shadow hover:bg-indigo-700 transition-colors"
          onClick={handleRedirect}
        >
          Voir la livraison
        </button>
      )
    }

    return null
  }

  // Afficher les formulaires d'avis uniquement pour les clients et les commandes livrées
  const canReview = authUser?.role === "client" && statut === "livree"

  return (
    <div className="w-full min-h-screen p-6 flex justify-center">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl p-8 space-y-8">
        <h1 className="text-3xl font-bold text-emerald-700">Détail de la commande</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-xl shadow-sm">
            <div className="flex items-center mb-2 text-emerald-700">
              <FaUser className="mr-2" />
              <h2 className="text-lg font-semibold">Client</h2>
            </div>
            <p>
              <strong>Nom :</strong> {client_id.nom}
            </p>
            <p>
              <strong>Email :</strong> {client_id.email}
            </p>
            <p>
              <strong>Téléphone :</strong> {client_id.numero}
            </p>
            <p>
              <strong>Code Client :</strong> {code_Client}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl shadow-sm">
            <div className="flex items-center mb-2 text-emerald-700">
              <FaStore className="mr-2" />
              <h2 className="text-lg font-semibold">Commerçant</h2>
            </div>
            <p>
              <strong>Boutique :</strong> {commercant_id.nom_boutique}
            </p>
            <p>
              <strong>Email :</strong> {commercant_id.email}
            </p>
            <p>
              <strong>Téléphone :</strong> {commercant_id.numero}
            </p>
            <p>
              <strong>Code Commerçant :</strong> {code_Commercant}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl shadow-sm">
            <div className="flex items-center mb-2 text-emerald-700">
              <FaTruck className="mr-2" />
              <h2 className="text-lg font-semibold">Livreur</h2>
            </div>
            {!livreur_id ? (
              <p>Aucun livreur n'a été attribué</p>
            ) : (
              <>
                <p>
                  <strong>Nom :</strong> {livreur_id.nom}
                </p>
                <p>
                  <strong>Email :</strong> {livreur_id.email}
                </p>
                <p>
                  <strong>Téléphone :</strong> {livreur_id.numero}
                </p>
                <p>
                  <strong>Véhicule :</strong>{" "}
                  {livreur_id?.vehicule?.type && livreur_id?.vehicule?.plaque
                    ? `${livreur_id.vehicule.type} - ${livreur_id.vehicule.plaque}`
                    : "Aucune information disponible"}
                </p>
              </>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-xl shadow-sm">
            <div className="flex items-center mb-2 text-emerald-700">
              <FaMapMarkerAlt className="mr-2" />
              <h2 className="text-lg font-semibold">Adresse de Livraison</h2>
            </div>
            <p>{adresse_livraison.rue}</p>
            <p>
              {adresse_livraison.code_postal}, {adresse_livraison.ville}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-100 p-4 rounded-xl text-center">
            <FaClock className="text-emerald-600 mx-auto mb-2" size={24} />
            <p className="font-semibold">Créée le</p>
            <p>{new Date(date_creation).toLocaleString()}</p>
          </div>
          <div className="bg-gray-100 p-4 rounded-xl text-center">
            <FaBarcode className="text-emerald-600 mx-auto mb-2" size={24} />
            <p className="font-semibold">Statut</p>
            <p className="capitalize">{statut.replace(/_/g, " ")}</p>
          </div>
          <div className="bg-gray-100 p-4 rounded-xl text-center">
            <FaEuroSign className="text-emerald-600 mx-auto mb-2" size={24} />
            <p className="font-semibold">Total</p>
            <p>{total.toFixed(2)} €</p>
          </div>
        </div>

        <div className="pt-6">{renderActionButtons()}</div>

        {/* Section d'avis pour le client */}
        {canReview && (
          <div className="mt-8 space-y-6">
            <h2 className="text-2xl font-semibold text-emerald-700 border-b border-emerald-200 pb-2">Évaluations</h2>

            {/* Avis pour le commerçant */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-800">Évaluer le commerçant</h3>
                {hasReviewedCommercant ? (
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">Avis déjà soumis</span>
                ) : (
                  <button
                    onClick={() => setShowCommercantReviewForm(!showCommercantReviewForm)}
                    className="text-emerald-600 hover:text-emerald-800 font-medium"
                  >
                    {showCommercantReviewForm ? "Annuler" : "Laisser un avis"}
                  </button>
                )}
              </div>

              {showCommercantReviewForm && !hasReviewedCommercant && (
                <ReviewForm
                  targetId={commercant_id._id}
                  targetType="commercant"
                  commandeId={_id}
                  onReviewSubmitted={() => setShowCommercantReviewForm(false)}
                />
              )}
            </div>

            {/* Avis pour le livreur (seulement si un livreur a été assigné) */}
            {livreur_id && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-800">Évaluer le livreur</h3>
                  {hasReviewedLivreur ? (
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">Avis déjà soumis</span>
                  ) : (
                    <button
                      onClick={() => setShowLivreurReviewForm(!showLivreurReviewForm)}
                      className="text-emerald-600 hover:text-emerald-800 font-medium"
                    >
                      {showLivreurReviewForm ? "Annuler" : "Laisser un avis"}
                    </button>
                  )}
                </div>

                {showLivreurReviewForm && !hasReviewedLivreur && (
                  <ReviewForm
                    targetId={livreur_id._id}
                    targetType="livreur"
                    commandeId={_id}
                    onReviewSubmitted={() => setShowLivreurReviewForm(false)}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default DetailCommande
