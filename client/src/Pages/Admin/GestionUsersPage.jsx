"use client"

import { useState, useCallback } from "react"
import { useParams, useNavigate } from "react-router"
import { useGetUsersByRole, useAuthUserQuery } from "../../Hooks"
import { FaEye, FaIdCard, FaUserEdit, FaUserSlash, FaFilter } from "react-icons/fa"
import DataTable from "../../Components/UI/DataTable"
import StatusBadge from "../../Components/UI/StatusBadge"
import ActionButton from "../../Components/UI/ActionButton"

const GestionUsersPage = () => {
  const { role } = useParams() // "client", "livreur", etc.
  const navigate = useNavigate()
  const { data: authUser, isLoading: authLoading } = useAuthUserQuery()
  const { data: usersData, isLoading: usersLoading, error } = useGetUsersByRole(role)
  const [selectedUser, setSelectedUser] = useState(null)
  const [filter, setFilter] = useState("all") // all, active, pending, rejected
  const [showMenuId, setShowMenuId] = useState(null)

  const toggleMenu = useCallback((userId) => {
    setShowMenuId((prevId) => (prevId === userId ? null : userId))
  }, [])

  if (authLoading || usersLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <div className="relative">
          <div className="h-24 w-24 rounded-full border-t-4 border-b-4 border-indigo-500 animate-spin"></div>
          <div
            className="absolute top-0 left-0 h-24 w-24 rounded-full border-t-4 border-b-4 border-indigo-300 animate-spin"
            style={{ animationDirection: "reverse", opacity: 0.7 }}
          ></div>
        </div>
        <p className="mt-4 text-indigo-700 font-medium text-xl">Chargement...</p>
      </div>
    )
  }

  if (!authUser) {
    return (
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
          <h3 className="text-xl font-bold text-center text-gray-800 mb-2">Erreur d'authentification</h3>
          <p className="text-center text-gray-600">Utilisateur non trouvé</p>
          <button
            onClick={() => navigate("/login")}
            className="mt-6 w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg"
          >
            Se connecter
          </button>
        </div>
      </div>
    )
  }

  if (error) {
    return (
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
          <p className="text-center text-gray-600">Erreur lors du chargement des utilisateurs</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  const handleViewUser = (userId) => {
    navigate(`/admin/user/${userId}`)
  }

  // Filtrer les utilisateurs selon leur statut
  const filteredUsers =
    usersData?.data?.filter((user) => {
      if (filter === "all") return true
      if (filter === "active") return user.statut === "vérifié"
      if (filter === "pending") return user.statut === "en vérification"
      if (filter === "rejected") return user.statut === "refusé"
      return true
    }) || []

  // Configuration des colonnes pour le DataTable
  const getTableColumns = () => {
    const columns = [
      {
        key: "_id",
        header: "ID",
        render: (row) => <span className="font-medium text-indigo-600">{row._id.slice(0, 5)}...</span>,
      },
      {
        key: "nom",
        header: "Nom",
        render: (row) => (
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium mr-3">
              {row.nom.charAt(0).toUpperCase()}
            </div>
            <span>{row.nom}</span>
          </div>
        ),
      },
      {
        key: "email",
        header: "Email",
      },
    ]

    // Ajouter la colonne de statut pour les livreurs
    if (role === "livreur") {
      columns.push({
        key: "statut",
        header: "Statut",
        render: (row) => <StatusBadge status={row.statut || "non vérifié"} />,
      })
    }

    // Ajouter la colonne d'actions avec menu déroulant
    columns.push({
      key: "actions",
      header: "Actions",
      sortable: false,
      className: "text-center", // Centrer les actions
      render: (row) => {
        return (
          <div className="flex gap-2 justify-center relative">
            <ActionButton icon={<FaEye />} label="Voir" color="indigo" onClick={() => handleViewUser(row._id)} />

            {row.role === "livreur" && (
              <ActionButton
                icon={<FaIdCard />}
                label="Pièces"
                color="green"
                onClick={() => navigate(`/livreur/${row._id}/pieces`)}
              />
            )}

            <div className="relative">
              <button
                onClick={() => toggleMenu(row._id)}
                className="px-4 py-2.5 rounded-xl flex items-center gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-200"
              >
                <span>Plus</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showMenuId === row._id && (
                <div
                  className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                  style={{
                    bottom: row._id === filteredUsers[filteredUsers.length - 1]?._id ? "100%" : "auto",
                    top: row._id === filteredUsers[filteredUsers.length - 1]?._id ? "auto" : "100%",
                  }}
                >
                  <button
                    onClick={() => {
                      handleViewUser(row._id)
                      toggleMenu(null)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-amber-700 hover:bg-amber-50 flex items-center"
                  >
                    <FaUserEdit className="mr-2" /> Modifier
                  </button>
                  <button
                    onClick={() => {
                      alert(`Désactivation de l'utilisateur ${row._id} non implémentée`)
                      toggleMenu(null)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center"
                  >
                    <FaUserSlash className="mr-2" /> Désactiver
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      },
    })

    return columns
  }

  return (
    <main className="w-full min-h-full p-6 bg-gray-50">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-emerald-800 mb-1">Gestion {role}s</h1>
          <p className="text-gray-500">Administration des comptes {role}s</p>
        </div>

        <div className="bg-white shadow-sm border border-emerald-100 px-5 py-3 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <div>
            <div className="text-sm text-gray-500">Total {role}s</div>
            <div className="text-xl font-bold text-emerald-800">{usersData?.data?.length || 0}</div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      {role === "livreur" && (
        <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-emerald-100">
          <div className="flex items-center gap-2 mb-2">
            <FaFilter className="text-emerald-500" />
            <h3 className="font-medium text-gray-700">Filtrer par statut</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "all" ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setFilter("active")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "active" ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Vérifiés
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "pending" ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              En vérification
            </button>
            <button
              onClick={() => setFilter("rejected")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "rejected" ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Refusés
            </button>
          </div>
        </div>
      )}

      <DataTable
        data={filteredUsers}
        columns={getTableColumns()}
        onRowClick={setSelectedUser}
        selectedRow={selectedUser}
        emptyMessage={`Aucun ${role} trouvé`}
        searchable={true}
        pagination={true}
      />
    </main>
  )
}

export default GestionUsersPage
