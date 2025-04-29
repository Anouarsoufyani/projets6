"use client"

import { useState } from "react"
import { useGetUserCommandes, useAuthUserQuery } from "../../Hooks"
import toast from "react-hot-toast"
import PropTypes from "prop-types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router"
import DataTable from "../../Components/UI/DataTable"
import StatusBadge from "../../Components/UI/StatusBadge"
import ActionButton from "../../Components/UI/ActionButton"
import { FaEye, FaMapMarkedAlt, FaCheck, FaTimes, FaTruck, FaPlus } from "react-icons/fa"
import LoadingSpinner from "../../Components/UI/Loading";

const CommandesListePage = () => {
  const { data: commandesData, isLoading, isError } = useGetUserCommandes()
  const { data: authUser, isLoading: authLoading } = useAuthUserQuery()
  const queryClient = useQueryClient()
  const [selectedCommande, setSelectedCommande] = useState(null)

  // Mutation pour mettre à jour le statut d'une commande
  const updateCommandeStatusMutation = useMutation({
    mutationFn: async ({ commandeId, newStatus }) => {
      const res = await fetch(`/api/commandes/update-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ commandeId, statut: newStatus }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Erreur lors de la mise à jour du statut")
      }

      return res.json()
    },
    onSuccess: (data, variables) => {
      const statusText = variables.newStatus === "en_preparation" ? "acceptée" : "refusée"
      toast.success(`Commande ${statusText} avec succès!`)
      // Rafraîchir les données des commandes
      queryClient.invalidateQueries(["getUserCommandes"])
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de la mise à jour du statut")
    },
  })

  // Fonction pour accepter une commande
  const acceptCommande = (commandeId) => {
    updateCommandeStatusMutation.mutate({
      commandeId,
      newStatus: "en_preparation",
    })
  }

  // Fonction pour refuser une commande
  const refuseCommande = (commandeId) => {
    updateCommandeStatusMutation.mutate({
      commandeId,
      newStatus: "refusee",
    })
  }

  // Fonction pour annuler une commande (client)
  const cancelCommande = async (id) => {
    try {
      const response = await fetch(`api/commandes/cancel/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: "annulee" }),
      })
      if (!response.ok) throw new Error("Échec de l'annulation")

      // Rafraîchir les données au lieu de recharger la page
      queryClient.invalidateQueries(["getUserCommandes"])
      toast.success("Commande annulée avec succès")
    } catch (error) {
      console.error("Erreur annulation:", error)
      toast.error("Impossible d'annuler la commande")
    }
  }

  if (isLoading || authLoading) return <LoadingSpinner />
  if (isError || !commandesData || !authUser) return <ErrorMessage message="Erreur lors du chargement" />

  const commandes = (commandesData.commandes || []).sort(
    (a, b) => new Date(b.date_creation) - new Date(a.date_creation),
  )

  // Configuration des colonnes pour le DataTable
  const getTableColumns = () => {
    const baseColumns = [
      {
        key: "_id",
        header: "ID",
        render: (row) => <span className="font-medium text-indigo-600">{row._id.slice(-6)}</span>,
      },
    ]

    // Colonnes spécifiques au rôle
    const roleSpecificColumns = {
      client: [
        {
          key: "commercant_id.nom",
          header: "Commerçant",
          render: (row) => (
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium mr-3">
                {(row.commercant_id?.nom || "N/A").charAt(0).toUpperCase()}
              </div>
              <span>{row.commercant_id?.nom || "N/A"}</span>
            </div>
          ),
        },
        {
          key: "livreur_id.nom",
          header: "Livreur",
          render: (row) =>
            row.livreur_id?.nom ? (
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-medium mr-3">
                  {row.livreur_id.nom.charAt(0).toUpperCase()}
                </div>
                <span>{row.livreur_id.nom}</span>
              </div>
            ) : (
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">Non assigné</span>
            ),
        },
        {
          key: "produits",
          header: "Produits",
          render: (row) => <span>{formatProduits(row.produits)}</span>,
        },
        {
          key: "total",
          header: "Total",
          render: (row) => (
            <div className="font-medium bg-gray-50 px-3 py-1.5 rounded-lg inline-block">{row.total?.toFixed(2)} €</div>
          ),
        },
      ],
      commercant: [
        {
          key: "client_id.nom",
          header: "Client",
          render: (row) => (
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium mr-3">
                {(row.client_id?.nom || "N/A").charAt(0).toUpperCase()}
              </div>
              <span>{row.client_id?.nom || "N/A"}</span>
            </div>
          ),
        },
        {
          key: "livreur_id.nom",
          header: "Livreur",
          render: (row) =>
            row.livreur_id?.nom ? (
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-medium mr-3">
                  {row.livreur_id.nom.charAt(0).toUpperCase()}
                </div>
                <span>{row.livreur_id.nom}</span>
              </div>
            ) : (
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">Non assigné</span>
            ),
        },
        {
          key: "produits",
          header: "Produits",
          render: (row) => <span>{formatProduits(row.produits)}</span>,
        },
        {
          key: "total",
          header: "Total",
          render: (row) => (
            <div className="font-medium bg-gray-50 px-3 py-1.5 rounded-lg inline-block">{row.total?.toFixed(2)} €</div>
          ),
        },
      ],
      livreur: [
        {
          key: "client_id.nom",
          header: "Client",
          render: (row) => (
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium mr-3">
                {(row.client_id?.nom || "N/A").charAt(0).toUpperCase()}
              </div>
              <span>{row.client_id?.nom || "N/A"}</span>
            </div>
          ),
        },
        {
          key: "commercant_id.nom",
          header: "Commerçant",
          render: (row) => (
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium mr-3">
                {(row.commercant_id?.nom || "N/A").charAt(0).toUpperCase()}
              </div>
              <span>{row.commercant_id?.nom || "N/A"}</span>
            </div>
          ),
        },
        {
          key: "adresse_livraison.rue",
          header: "Adresse",
          render: (row) => (
            <div className="flex items-start">
              <div className="mt-1 text-gray-400 mr-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <span className="text-gray-700">{row.adresse_livraison?.rue || "N/A"}</span>
            </div>
          ),
        },
        {
          key: "distance",
          header: "Distance",
          render: (row) =>
            calculateDistance(row.adresse_livraison) ? (
              <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-200">
                {calculateDistance(row.adresse_livraison)}
              </span>
            ) : (
              "N/A"
            ),
        },
      ],
    }

    // Colonnes communes à tous les rôles
    const commonColumns = [
      {
        key: "statut",
        header: "Statut",
        render: (row) => <StatusBadge status={row.statut} />,
      },
      {
        key: "date_creation",
        header: "Date",
        render: (row) => (
          <div className="text-gray-700">
            {new Date(row.date_creation).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </div>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        sortable: false,
        className: "text-right",
        render: (row) => (
          <div className="flex gap-2 justify-end">
            <Link to={`/commande/${row._id}`}>
              <ActionButton icon={<FaEye />} label="Voir" color="indigo" />
            </Link>

            {/* Actions pour les commandes en livraison ou livrées */}
            {(row.statut === "prete_a_etre_recuperee" ||
              row.statut === "recuperee_par_livreur" ||
              row.statut === "livree" ||
              row.statut === "en_livraison") && (
              <Link to={`/livraison/${row._id}`}>
                <ActionButton icon={<FaMapMarkedAlt />} label="Suivre" color="green" />
              </Link>
            )}

            {/* Actions pour les commandes en attente */}
            {row.statut === "en_attente" && (
              <>
                {/* Actions pour le client */}
                {authUser.role === "client" && (
                  <ActionButton
                    icon={<FaTimes />}
                    label="Annuler"
                    color="red"
                    onClick={() => cancelCommande(row._id)}
                    disabled={updateCommandeStatusMutation.isPending}
                  />
                )}

                {/* Actions pour le commerçant */}
                {authUser.role === "commercant" && (
                  <div className="flex gap-2">
                    <ActionButton
                      icon={<FaCheck />}
                      label="Accepter"
                      color="green"
                      onClick={() => acceptCommande(row._id)}
                      disabled={updateCommandeStatusMutation.isPending}
                    />
                    <ActionButton
                      icon={<FaTimes />}
                      label="Refuser"
                      color="red"
                      onClick={() => refuseCommande(row._id)}
                      disabled={updateCommandeStatusMutation.isPending}
                    />
                  </div>
                )}
              </>
            )}

            {/* Actions pour les commandes en préparation */}
            {row.statut === "en_preparation" && authUser.role === "commercant" && (
              <Link to={`/livreurs/${row._id}`}>
                <ActionButton icon={<FaTruck />} label="Assigner" color="purple" />
              </Link>
            )}
          </div>
        ),
      },
    ]

    return [...baseColumns, ...roleSpecificColumns[authUser.role], ...commonColumns]
  }

  return (
    <main className="w-full min-h-full p-6 bg-gray-50">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Mes Commandes</h1>
          <p className="text-gray-500">Gérez et suivez vos commandes</p>
        </div>

        <div className="flex gap-4">
          {authUser.role === "client" && (
            <Link to="/commandes/create">
              <ActionButton icon={<FaPlus />} label="Nouvelle commande" color="indigo" className="shadow-md" />
            </Link>
          )}

          <div className="bg-white shadow-sm border border-gray-100 px-5 py-3 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <div>
              <div className="text-sm text-gray-500">Total des commandes</div>
              <div className="text-xl font-bold text-gray-800">{commandes.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques des commandes */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="En attente"
          value={commandes.filter((cmd) => cmd.statut === "en_attente").length}
          color="amber"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />

        <StatCard
          title="En préparation"
          value={commandes.filter((cmd) => cmd.statut === "en_preparation").length}
          color="blue"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          }
        />

        <StatCard
          title="En livraison"
          value={
            commandes.filter((cmd) =>
              ["prete_a_etre_recuperee", "recuperee_par_livreur", "en_livraison"].includes(cmd.statut),
            ).length
          }
          color="indigo"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
              />
            </svg>
          }
        />

        <StatCard
          title="Livrées"
          value={commandes.filter((cmd) => cmd.statut === "livree").length}
          color="emerald"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
      </div>

      <DataTable
        data={commandes}
        columns={getTableColumns()}
        onRowClick={setSelectedCommande}
        selectedRow={selectedCommande}
        emptyMessage="Aucune commande trouvée"
        searchable={true}
        pagination={true}
      />
    </main>
  )
}

const StatCard = ({ title, value, color, icon }) => {
  const [isHovered, setIsHovered] = useState(false)

  const colorStyles = {
    amber: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      icon: "text-amber-500",
      border: "border-amber-200",
      shadow: "shadow-amber-100",
    },
    blue: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      icon: "text-blue-500",
      border: "border-blue-200",
      shadow: "shadow-blue-100",
    },
    indigo: {
      bg: "bg-indigo-50",
      text: "text-indigo-700",
      icon: "text-indigo-500",
      border: "border-indigo-200",
      shadow: "shadow-indigo-100",
    },
    emerald: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      icon: "text-emerald-500",
      border: "border-emerald-200",
      shadow: "shadow-emerald-100",
    },
  }

  const style = colorStyles[color] || colorStyles.blue

  return (
    <div
      className={`${style.bg} border ${style.border} rounded-xl p-4 flex items-center gap-4 transition-all duration-200 ${isHovered ? `shadow-md ${style.shadow}` : "shadow"}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`p-3 rounded-lg ${style.bg} ${style.icon}`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className={`text-2xl font-bold ${style.text}`}>{value}</p>
      </div>
    </div>
  )
}


const ErrorMessage = ({ message }) => (
  <div className="flex justify-center items-center h-screen bg-gray-50">
    <div className="bg-white shadow-xl rounded-2xl p-8 max-w-md w-full border border-red-100">
      <div className="flex items-center justify-center w-16 h-16 bg-red-50 rounded-full mx-auto mb-6">
        <svg className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-center text-gray-800 mb-2">Une erreur est survenue</h3>
      <p className="text-center text-gray-600">{message}</p>
      <button
        onClick={() => window.location.reload()}
        className="mt-6 w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg"
      >
        Réessayer
      </button>
    </div>
  </div>
)

ErrorMessage.propTypes = {
  message: PropTypes.string.isRequired,
}

const calculateDistance = (adresse) => (adresse?.lat && adresse?.lng ? "2.5 km" : "N/A")

const formatProduits = (produits) => {
  if (!produits || produits.length === 0) return "Aucun produit"

  if (produits.length === 1) {
    return `${produits[0].nom} (${produits[0].quantite})`
  }

  return `${produits.length} produits`
}

export default CommandesListePage
