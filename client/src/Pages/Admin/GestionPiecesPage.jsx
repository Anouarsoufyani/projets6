"use client"

import { useState } from "react"
import { useParams, useNavigate } from "react-router"
import { useQueryClient } from "@tanstack/react-query"
import { useAuthUserQuery } from "../../Hooks"
import { useGetDocuments, useUpdateDocument } from "../../Hooks"
import { toast } from "react-hot-toast"
import { useGetUserById } from "../../Hooks/useGetUsers"
import { FaEye, FaCheck, FaTimes, FaArrowLeft, FaFileAlt, FaFileImage, FaFilePdf } from "react-icons/fa"
import DataTable from "../../Components/UI/DataTable"
import StatusBadge from "../../Components/UI/StatusBadge"
import ActionButton from "../../Components/UI/ActionButton"

const GestionPiecesPage = () => {
  const { id } = useParams() 
  const queryClient = useQueryClient()
  const { data: authUser, isLoading: authLoading } = useAuthUserQuery()
  const { data: livreur, isLoading: livreurLoading } = useGetUserById(id)
  const navigate = useNavigate()
  const { data: docs, isLoading: docsLoading, error } = useGetDocuments(id)
  const { mutate: updateDocument } = useUpdateDocument()
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [previewDocument, setPreviewDocument] = useState(null)

  if (authLoading || docsLoading || livreurLoading) {
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
          <p className="text-center text-gray-600">Erreur lors du chargement des documents</p>
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

  const handleRefuser = (documentId) => {
    updateDocument(
      { livreurId: id, documentId, statut: "refusé" },
      {
        onSuccess: () => {
          toast.success("Document refusé avec succès")
          queryClient.invalidateQueries(["getDocuments", id])
        },
      },
    )
  }

  const handleValider = (documentId) => {
    updateDocument(
      { livreurId: id, documentId, statut: "validé" },
      {
        onSuccess: () => {
          toast.success("Document validé avec succès")
          queryClient.invalidateQueries(["getDocuments", id])
        },
      },
    )
  }

  const getDocumentUrl = (url) => {
    if (!url) return "#"
    return `/${url.replace(/\\/g, "/")}`
  }

  const getFileIcon = (fileName) => {
    if (!fileName) return <FaFileAlt className="text-gray-500" />

    const extension = fileName.split(".").pop()?.toLowerCase()

    if (extension === "pdf") {
      return <FaFilePdf className="text-red-500" />
    } else if (["jpg", "jpeg", "png", "gif"].includes(extension)) {
      return <FaFileImage className="text-blue-500" />
    }

    return <FaFileAlt className="text-gray-500" />
  }

  const getTableColumns = () => [
    {
      key: "nomFichier",
      header: "Pièces",
      render: (row) => (
        <div className="flex items-center">
          <div className="p-2 bg-gray-100 rounded-lg mr-3">{getFileIcon(row.nomFichier)}</div>
          <span className="font-medium text-gray-900">{row.nomFichier || row._id.slice(0, 5)}</span>
        </div>
      ),
    },
    {
      key: "label",
      header: "Label",
      render: (row) => (
        <div className="px-3 py-1.5 bg-gray-100 rounded-lg inline-block">{row.label || "Non spécifié"}</div>
      ),
    },
    {
      key: "statut",
      header: "Statut",
      render: (row) => <StatusBadge status={row.statut} />,
    },
    {
      key: "actions",
      header: "Actions",
      sortable: false,
      className: "text-right",
      render: (row) => (
        <div className="flex gap-2 justify-end">
          <ActionButton icon={<FaEye />} label="Voir" color="indigo" onClick={() => setPreviewDocument(row)} />

          {row.statut === "en attente" && (
            <>
              <ActionButton icon={<FaCheck />} label="Valider" color="green" onClick={() => handleValider(row._id)} />

              <ActionButton icon={<FaTimes />} label="Refuser" color="red" onClick={() => handleRefuser(row._id)} />
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <main className="w-full min-h-full p-6 bg-gray-50">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Documents du livreur</h1>
          <p className="text-gray-500">Vérification des pièces justificatives</p>
        </div>

        <button
          onClick={() => navigate("/gestion/livreur")}
          className="flex items-center px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
        >
          <FaArrowLeft className="mr-2" />
          Retour à la liste des livreurs
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md mb-8 border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-2xl font-bold">
              {livreur?.data?.nom?.charAt(0).toUpperCase() || "L"}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{livreur?.data?.nom || "Livreur"}</h2>
              <p className="text-gray-600">{livreur?.data?.email || "Email non disponible"}</p>
              <div className="mt-1">
                <StatusBadge status={livreur?.data?.statut || "non vérifié"} />
              </div>
            </div>
          </div>
          <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl font-medium flex items-center gap-2">
            <FaFileAlt />
            <span>
              {docs?.data?.length || 0} document{docs?.data?.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      <DataTable
        data={docs?.data || []}
        columns={getTableColumns()}
        onRowClick={setSelectedDocument}
        selectedRow={selectedDocument}
        emptyMessage="Aucun document trouvé"
        searchable={true}
        pagination={true}
      />

      {previewDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                {getFileIcon(previewDocument.nomFichier)}
                {previewDocument.nomFichier || "Document"}
              </h3>
              <button
                onClick={() => setPreviewDocument(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FaTimes />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <iframe
                src={getDocumentUrl(previewDocument.url)}
                className="w-full h-[70vh] border border-gray-200 rounded-lg"
                title="Document Preview"
              />
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              {previewDocument.statut === "en attente" && (
                <>
                  <ActionButton
                    icon={<FaCheck />}
                    label="Valider"
                    color="green"
                    onClick={() => {
                      handleValider(previewDocument._id)
                      setPreviewDocument(null)
                    }}
                  />

                  <ActionButton
                    icon={<FaTimes />}
                    label="Refuser"
                    color="red"
                    onClick={() => {
                      handleRefuser(previewDocument._id)
                      setPreviewDocument(null)
                    }}
                  />
                </>
              )}
              <button
                onClick={() => setPreviewDocument(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default GestionPiecesPage
