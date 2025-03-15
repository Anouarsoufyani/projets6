import { useGetUserCommandes } from "../../Hooks/useGetCommandes";
import { useAuthUserQuery } from "../../Hooks/useAuthQueries";

const CommandesListePage = () => {
    const { data: commandesData, isLoading, isError } = useGetUserCommandes();
    const { data: authUser, isLoading: authLoading } = useAuthUserQuery();

    // Gestion des états de chargement et d'erreur
    if (isLoading || authLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <span className="loading loading-spinner loading-lg text-emerald-600"></span>
            </div>
        );
    }

    if (isError || !commandesData || !authUser) {
        return (
            <div className="flex justify-center items-center h-screen text-red-600">
                Erreur lors du chargement des données
            </div>
        );
    }

    const commandes = commandesData.commandes || [];
    console.log("Commandes:", commandes);

    // Colonnes dynamiques selon le rôle
    const getColumns = (role) => {
        const baseColumns = ["ID", "Statut", "Produits", "Total", ""];
        switch (role) {
            case "client":
                return [
                    "ID",
                    "Commerçant",
                    "Livreur",
                    "Produits",
                    "Total",
                    "Statut",
                    "",
                ];
            case "commercant":
                return [
                    "ID",
                    "Client",
                    "Livreur",
                    "Produits",
                    "Total",
                    "Statut",
                    "",
                ];
            case "livreur":
                return [
                    "ID",
                    "Client",
                    "Commerçant",
                    "Adresse de livraison",
                    "Distance",
                    "Statut",
                    "",
                ];
            default:
                return baseColumns;
        }
    };

    const columns = getColumns(authUser.role);

    // Fonction pour formater les produits
    // const formatProduits = (produits) => {
    //     return produits
    //         .map((p) => `${p.quantite}x ${p.produit_id.nom || "Produit"}`)
    //         .join(", ");
    // };

    // Fonction pour calculer une distance fictive (à remplacer par une vraie API)
    const calculateDistance = (adresse) => {
        return adresse.lat && adresse.lng ? "2.5 km" : "N/A"; // Simulation
    };

    return (
        <div>
            <main className="w-full min-h-screen bg-gray-100 p-6">
                <h1 className="text-2xl font-bold text-emerald-700 mb-6">
                    Mes Commandes
                </h1>
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="p-4 bg-gradient-to-r from-emerald-100 to-emerald-200">
                        <h2 className="text-lg font-semibold text-emerald-800">
                            Liste des commandes ({commandes.length})
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
                                {commandes.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={columns.length}
                                            className="py-3 px-4 text-center text-gray-500"
                                        >
                                            Aucune commande trouvée
                                        </td>
                                    </tr>
                                ) : (
                                    commandes.map((commande) => (
                                        <tr
                                            key={commande._id}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="py-3 px-4">
                                                {commande._id.slice(-6)}{" "}
                                                {/* Affiche les 6 derniers chiffres pour lisibilité */}
                                            </td>
                                            {authUser.role === "client" && (
                                                <>
                                                    <td className="py-3 px-4">
                                                        {commande.commercant_id
                                                            ?.nom || "N/A"}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {commande.livreur_id
                                                            ?.nom ||
                                                            "Non assigné"}
                                                    </td>
                                                </>
                                            )}
                                            {authUser.role === "commercant" && (
                                                <>
                                                    <td className="py-3 px-4">
                                                        {commande.client_id
                                                            ?.nom || "N/A"}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {commande.livreur_id
                                                            ?.nom ||
                                                            "Non assigné"}
                                                    </td>
                                                </>
                                            )}
                                            {authUser.role === "livreur" && (
                                                <>
                                                    <td className="py-3 px-4">
                                                        {commande.client_id
                                                            ?.nom || "N/A"}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {commande.commercant_id
                                                            ?.nom || "N/A"}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {commande
                                                            .adresse_livraison
                                                            ?.rue || "N/A"}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {calculateDistance(
                                                            commande.adresse_livraison
                                                        )}
                                                    </td>
                                                </>
                                            )}
                                            {authUser.role !== "livreur" && (
                                                <td className="py-3 px-4">
                                                    {/* {formatProduits(
                                                        commande.produits
                                                    )} */}
                                                </td>
                                            )}
                                            {authUser.role !== "livreur" && (
                                                <td className="py-3 px-4">
                                                    {commande.total.toFixed(2)}{" "}
                                                    €
                                                </td>
                                            )}
                                            <td className="py-3 px-4">
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        commande.statut ===
                                                        "en_attente"
                                                            ? "bg-gray-100 text-gray-800"
                                                            : commande.statut ===
                                                              "en_preparation"
                                                            ? "bg-yellow-100 text-yellow-800"
                                                            : commande.statut ===
                                                              "en_livraison"
                                                            ? "bg-blue-100 text-blue-800"
                                                            : commande.statut ===
                                                              "livree"
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-red-100 text-red-800"
                                                    }`}
                                                >
                                                    {commande.statut.replace(
                                                        /_/g,
                                                        " "
                                                    )}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                {commande.statut ===
                                                    "en_livraison" && (
                                                    // <Link
                                                    //     className="text-emerald-500 hover:text-emerald-800 transition-colors"
                                                    //     to={`/livraison/${commande._id}`}
                                                    // >
                                                    //     Suivre
                                                    // </Link>
                                                    <a
                                                        className="text-emerald-500 hover:text-emerald-800 transition-colors"
                                                        href={`/livraison/${commande._id}`}
                                                    >
                                                        Suivre
                                                    </a>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CommandesListePage;
