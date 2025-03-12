import { Link } from "react-router";
const CommandePage = () => {
    // Données codées en dur pour les commandes
    const commandes = [
        {
            id: 1,
            client: "Jean",
            livreur: "Marc",
            produits: "Pizza x2, Soda",
            position: "48.8566, 2.3522",
            distance: "3.5 km",
            statut: "En cours",
        },
        {
            id: 2,
            client: "Marie",
            livreur: "Sophie",
            produits: "Burger x1, Frites",
            position: "48.8600, 2.3376",
            distance: "1.8 km",
            statut: "Livré",
        },
        {
            id: 3,
            client: "Paul",
            livreur: "Lucas",
            produits: "Sushi x3",
            position: "48.8500, 2.3400",
            distance: "4.2 km",
            statut: "En attente",
        },
    ];

    // Colonnes fixes pour tous les rôles
    const columns = [
        "ID",
        "Client",
        "Livreur",
        "Produits",
        "Position",
        "Distance",
        "Statut",
        "",
    ];

    return (
        <div>
            <main className="w-full min-h-screen bg-gray-100 p-6">
                <h1 className="text-2xl font-bold text-emerald-700 mb-6">
                    Commandes
                </h1>
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="p-4 bg-gradient-to-r from-emerald-100 to-emerald-200">
                        <h2 className="text-lg font-semibold text-emerald-800">
                            Liste des commandes
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    {columns.map((column) => (
                                        <th
                                            key={column}
                                            className="py-3 px-4 text-sm font-semibold text-gray-700"
                                        >
                                            {column}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {commandes.map((commande) => (
                                    <tr
                                        key={commande.id}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="py-3 px-4">
                                            {commande.id}
                                        </td>
                                        <td className="py-3 px-4">
                                            {commande.client}
                                        </td>
                                        <td className="py-3 px-4">
                                            {commande.livreur}
                                        </td>
                                        <td className="py-3 px-4">
                                            {commande.produits}
                                        </td>
                                        <td className="py-3 px-4">
                                            {commande.position}
                                        </td>
                                        <td className="py-3 px-4">
                                            {commande.distance}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    commande.statut ===
                                                    "En cours"
                                                        ? "bg-yellow-100 text-yellow-800"
                                                        : commande.statut ===
                                                          "Livré"
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-gray-100 text-gray-800"
                                                }`}
                                            >
                                                {commande.statut}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <Link
                                                className="text-emerald-500 cursor-pointer hover:text-emerald-800"
                                                to={"/livraison/" + commande.id}
                                            >
                                                Suivre la commande
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CommandePage;
