import { useAuthUserQuery } from "../../Hooks/useAuthQueries";
import { useGetLivreurs } from "../../Hooks/useGetUsers";

const GestionLivreurPage = () => {
    const { data: authUser, isLoading } = useAuthUserQuery();
    const { data: users } = useGetLivreurs();

    console.log("users", users);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen"></div>
        );
    }

    if (!authUser) {
        return (
            <div className="text-center text-red-600">
                Erreur : Utilisateur non trouvé
            </div>
        );
    }

    return (
        <main className="w-full min-h-full p-6">
            <h1 className="text-2xl font-bold text-emerald-700 mb-6">
                Gestion livreurs
            </h1>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-emerald-100 to-emerald-200">
                    <h2 className="text-lg font-semibold text-emerald-800">
                        Liste des livreurs ({users.data.length})
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="py-3 px-4 text-sm font-semibold text-gray-700">
                                    ID
                                </th>
                                <th className="py-3 px-4 text-sm font-semibold text-gray-700">
                                    Nom
                                </th>
                                <th className="py-3 px-4 text-sm font-semibold text-gray-700">
                                    Email
                                </th>
                                <th className="py-3 px-4 text-sm font-semibold text-gray-700">
                                    Statut
                                </th>
                                <th className="py-3 px-4 text-sm font-semibold text-gray-700">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {users.data.map((data) => (
                                <tr
                                    key={data.id}
                                    className="hover:bg-gray-50 transition-colors"
                                >
                                    <td className="py-3 px-4">{data.id}</td>
                                    <td className="py-3 px-4">{data.nom}</td>
                                    <td className="py-3 px-4">{data.email}</td>
                                    <td className="py-3 px-4">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                data.statut === "actif"
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-red-100 text-red-800"
                                            }`}
                                        >
                                            {data.statut}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 flex gap-2">
                                        <button className="text-blue-600 hover:text-blue-800 transition-colors">
                                            Voir
                                        </button>
                                        <button className="text-amber-600 hover:text-amber-800 transition-colors">
                                            Modifier
                                        </button>
                                        <button className="text-red-600 hover:text-red-800 transition-colors">
                                            Supprimer
                                        </button>
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

export default GestionLivreurPage;
