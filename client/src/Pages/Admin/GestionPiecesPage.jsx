"use client";

import { useParams, useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthUserQuery } from "../../Hooks";
import { useGetDocuments, useUpdateDocument } from "../../Hooks";
import { toast } from "react-hot-toast";
import { useGetUserById } from "../../Hooks/useGetUsers";
import { FaEye } from "react-icons/fa";

const GestionPiecesPage = () => {
    const { id } = useParams(); // id du livreur
    const queryClient = useQueryClient(); //

    const { data: authUser, isLoading: authLoading } = useAuthUserQuery();
    const { data: livreur, isLoading: livreurLoading } = useGetUserById(id);
    console.log("livreur", livreur);
    const navigate = useNavigate();
    const { data: docs, isLoading: usersLoading, error } = useGetDocuments(id);
    const { mutate: updateDocument } = useUpdateDocument();

    if (authLoading || usersLoading || livreurLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                Chargement...
            </div>
        );
    }

    if (!authUser) {
        return (
            <div className="text-center text-red-600">
                Erreur : Utilisateur non trouvé
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-red-600 text-center">
                Erreur lors du chargement des utilisateurs
            </div>
        );
    }

    const handleRefuser = (documentId) => {
        updateDocument(
            { livreurId: id, documentId, statut: "refusé" },
            {
                onSuccess: () => {
                    toast.success("Document refusé avec succès");
                    queryClient.invalidateQueries(["getDocuments", id]); //
                },
            }
        );
    };

    const handleValider = (documentId) => {
        updateDocument(
            { livreurId: id, documentId, statut: "validé" },
            {
                onSuccess: () => {
                    toast.success("Document validé avec succès");
                    queryClient.invalidateQueries(["getDocuments", id]); //
                },
            }
        );
    };

    const getDocumentUrl = (url) => {
        if (!url) return "#";
        // Remplacer les backslashes par des slashes pour l'URL
        return `/${url.replace(/\\/g, "/")}`;
    };

    return (
        <main className="w-full min-h-full p-6">
            <h1 className="text-2xl font-bold text-emerald-700 mb-6">
                Gestion des documents du livreur {livreur.data?.nom} ({id})
            </h1>

            <div className="mb-4">
                {" "}
                <button
                    onClick={() => navigate("/gestion/livreur")}
                    className="flex items-center px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                >
                    {" "}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        {" "}
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 19l-7-7m0 0l7-7m-7 7h18"
                        />{" "}
                    </svg>{" "}
                    Retour à la liste des livreurs{" "}
                </button>{" "}
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-emerald-100 to-emerald-200">
                    <h2 className="text-lg font-semibold text-emerald-800">
                        Liste des documents ({docs?.data?.length ?? 0})
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="text-left py-4 px-4 font-semibold text-gray-600 rounded-tl-lg">
                                    Pièces
                                </th>
                                <th className="text-left py-4 px-4 font-semibold text-gray-600">
                                    Nom
                                </th>
                                <th className="text-left py-4 px-4 font-semibold text-gray-600">
                                    Statut
                                </th>
                                <th className="text-right py-4 px-4 font-semibold text-gray-600 rounded-tr-lg">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {docs?.data.map((data, index) => (
                                <tr
                                    key={data._id}
                                    className={`hover:bg-emerald-50 transition-colors duration-150 ${
                                        index === docs.data.length - 1
                                            ? "rounded-b-lg"
                                            : ""
                                    }`}
                                >
                                    <td className="py-4 px-4 font-medium text-gray-900">
                                        {data.nomFichier ||
                                            data._id.slice(0, 5)}
                                    </td>
                                    <td className="py-4 px-4">{data.nom}</td>
                                    <td className="py-4 px-4">
                                        <span
                                            className={`px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center ${
                                                data.statut === "validé"
                                                    ? "bg-green-100 text-green-800"
                                                    : data.statut === "refusé"
                                                    ? "bg-red-100 text-red-800"
                                                    : data.statut ===
                                                      "en attente"
                                                    ? "bg-yellow-100 text-yellow-800"
                                                    : "bg-gray-100 text-gray-800"
                                            }`}
                                        >
                                            <span
                                                className="w-2 h-2 rounded-full mr-1.5"
                                                style={{
                                                    backgroundColor:
                                                        data.statut === "validé"
                                                            ? "#16a34a"
                                                            : data.statut ===
                                                              "refusé"
                                                            ? "#dc2626"
                                                            : data.statut ===
                                                              "en attente"
                                                            ? "#ca8a04"
                                                            : "#4b5563",
                                                }}
                                            ></span>
                                            {data.statut}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <div className="flex gap-3 justify-end">
                                            <button
                                                onClick={() =>
                                                    window.open(
                                                        getDocumentUrl(
                                                            data.url
                                                        ),
                                                        "_blank"
                                                    )
                                                }
                                                className="flex items-center px-3 py-1 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                            >
                                                <FaEye className="mr-1" />{" "}
                                                <span>Voir</span>
                                            </button>
                                            {data.statut === "en attente" && (
                                                <>
                                                    <button
                                                        className="flex items-center px-3 py-1 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                                        onClick={() =>
                                                            handleValider(
                                                                data._id
                                                            )
                                                        }
                                                    >
                                                        <span>Valider</span>
                                                    </button>
                                                    <button
                                                        className="flex items-center px-3 py-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                                        onClick={() =>
                                                            handleRefuser(
                                                                data._id
                                                            )
                                                        }
                                                    >
                                                        <span>Refuser</span>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
};

export default GestionPiecesPage;
