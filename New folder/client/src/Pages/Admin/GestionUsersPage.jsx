import { useParams } from "react-router";
import { useAuthUserQuery } from "../../Hooks/useAuthQueries";
import { useGetUsersByRole } from "../../Hooks/useGetUsers";
import {
    FaSpinner,
    FaTimesCircle,
    FaCheckCircle,
    FaHourglassHalf,
} from "react-icons/fa";

const GestionUsersPage = () => {
    const { role } = useParams(); // "client", "livreur", etc.
    const { data: authUser, isLoading: authLoading } = useAuthUserQuery();

    const {
        data: usersData,
        isLoading: usersLoading,
        error,
    } = useGetUsersByRole(role);

    console.log("usersData", usersData);

    if (authLoading || usersLoading) {
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

    return (
        <main className="w-full min-h-full bg-gray-100 p-6">
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
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="py-3 px-4">ID</th>
                                <th className="py-3 px-4">Nom</th>
                                <th className="py-3 px-4">Email</th>
                                {role === "livreur" && (
                                    <th className="py-3 px-4">Statut</th>
                                )}
                                <th className="py-3 px-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {usersData?.data.map((data) => (
                                <tr
                                    key={data.id}
                                    className="hover:bg-gray-50 transition-colors"
                                >
                                    <td className="py-3 px-4">
                                        {data._id.slice(0, 5)}...
                                    </td>
                                    <td className="py-3 px-4">{data.nom}</td>
                                    <td className="py-3 px-4">{data.email}</td>
                                    {role === "livreur" && (
                                        <td className="py-3 px-4">
                                            <span
                                                className={`${getStatusClass(
                                                    data.statut
                                                )} px-2 py-1 rounded-full text-xs font-medium inline-flex items-center`}
                                            >
                                                {getStatusIcon(data.statut)}
                                                {getStatusText(data.statut)}
                                            </span>
                                        </td>
                                    )}
                                    <td className="py-3 px-4 flex gap-2">
                                        <button className="text-blue-600 hover:text-blue-800">
                                            Voir
                                        </button>
                                        <button className="text-amber-600 hover:text-amber-800">
                                            Modifier
                                        </button>
                                        <button className="text-red-600 hover:text-red-800">
                                            Supprimer
                                        </button>
                                        {role === "livreur" &&
                                            data.statut !== "non vérifié" && (
                                                <button className="text-purple-600 hover:text-purple-800">
                                                    <a
                                                        href={`/livreur/${data._id}/pieces`}
                                                    >
                                                        Voir pièces jointes
                                                    </a>
                                                </button>
                                            )}
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
