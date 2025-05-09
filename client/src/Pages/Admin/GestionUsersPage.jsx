"use client";

import { useParams, useNavigate, Link } from "react-router";
import { useGetUsersByRole, useAuthUserQuery } from "../../Hooks";
import {
    FaSpinner,
    FaTimesCircle,
    FaCheckCircle,
    FaHourglassHalf,
    FaEye,
} from "react-icons/fa";

const GestionUsersPage = () => {
    const { role } = useParams(); 
    const navigate = useNavigate();
    const { data: authUser, isLoading: authLoading } = useAuthUserQuery();
    const {
        data: usersData,
        isLoading: usersLoading,
        error,
    } = useGetUsersByRole(role);

    if (authLoading || usersLoading) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
                <div className="relative animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-600">
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-400 opacity-30"></div>
                </div>
                <p className="mt-4 text-emerald-700 font-medium">Loading...</p>
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

    const getStatusIcon = (statut) => {
        switch (statut) {
            case "non vérifié":
                return (
                    <FaSpinner className="text-gray-500 animate-spin inline-block mr-2" />
                );
            case "en vérification":
                return (
                    <FaHourglassHalf className="text-yellow-500 inline-block mr-2" />
                );
            case "vérifié":
                return (
                    <FaCheckCircle className="text-green-500 inline-block mr-2" />
                );
            case "refusé":
                return (
                    <FaTimesCircle className="text-red-500 inline-block mr-2" />
                );
            default:
                return (
                    <FaSpinner className="text-gray-500 animate-spin inline-block mr-2" />
                );
        }
    };

    const getStatusClass = (statut) => {
        switch (statut) {
            case "non vérifié":
                return "bg-gray-100 text-gray-800 border-gray-200";
            case "en vérification":
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "vérifié":
                return "bg-green-100 text-green-800 border-green-200";
            case "refusé":
                return "bg-red-100 text-red-800 border-red-200";
            default:
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
        }
    };

    const getStatusText = (statut) => {
        switch (statut) {
            case "non vérifié":
                return "Non vérifié";
            case "en vérification":
                return "En attente de vérification";
            case "vérifié":
                return "Validé";
            case "refusé":
                return "Refusé";
            default:
                return "En attente";
        }
    };

    const handleViewUser = (userId) => {
        navigate(`/admin/user/${userId}`);
    };

    return (
        <main className="w-full min-h-full p-6">
            <h1 className="text-2xl font-bold text-emerald-700 mb-6">
                Gestion {role}s
            </h1>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-emerald-100 to-emerald-200">
                    <h2 className="text-lg font-semibold text-emerald-800">
                        Liste des {role}s ({usersData?.data?.length ?? 0})
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="text-left py-4 px-4 font-semibold text-gray-600 rounded-tl-lg">
                                    ID
                                </th>
                                <th className="text-left py-4 px-4 font-semibold text-gray-600">
                                    Nom
                                </th>
                                <th className="text-left py-4 px-4 font-semibold text-gray-600">
                                    Email
                                </th>
                                {role === "livreur" && (
                                    <th className="text-left py-4 px-4 font-semibold text-gray-600">
                                        Statut
                                    </th>
                                )}
                                <th className="text-right py-4 px-4 font-semibold text-gray-600 rounded-tr-lg">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {usersData?.data.map((data, index) => (
                                <tr
                                    key={data._id}
                                    className={`hover:bg-emerald-50 transition-colors duration-150 ${
                                        index === usersData.data.length - 1
                                            ? "rounded-b-lg"
                                            : ""
                                    }`}
                                >
                                    <td className="py-4 px-4 font-medium text-emerald-600">
                                        {data._id.slice(0, 5)}...
                                    </td>
                                    <td className="py-4 px-4">{data.nom}</td>
                                    <td className="py-4 px-4">{data.email}</td>
                                    {role === "livreur" && (
                                        <td className="py-4 px-4">
                                            <span
                                                className={`${getStatusClass(
                                                    data.statut
                                                )} px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center`}
                                            >
                                                {getStatusIcon(data.statut)}
                                                {getStatusText(data.statut)}
                                            </span>
                                        </td>
                                    )}
                                    <td className="py-4 px-4 text-right">
                                        <div className="flex gap-2 justify-end">
                                            <button
                                                onClick={() =>
                                                    handleViewUser(data._id)
                                                }
                                                className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-xs flex items-center gap-1"
                                            >
                                                <FaEye className="text-xs" />{" "}
                                                Voir
                                            </button>
                                            {data.role === "livreur" && (
                                                <Link
                                                    to={`/livreur/${data._id}/pieces`}
                                                    className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-xs flex items-center gap-1"
                                                >
                                                    <FaEye className="text-xs" />{" "}
                                                    Voir Pièce
                                                </Link>
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

export default GestionUsersPage;
