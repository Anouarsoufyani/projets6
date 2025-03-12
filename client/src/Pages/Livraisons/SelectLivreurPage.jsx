import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const fakeLivreurs = [
    {
        id: 1,
        name: "Marc Livreur",
        position: [48.8566, 2.3522], // Paris
        statut: "Disponible",
        distance: "2.3 km",
        commandesEnCours: 1,
    },
    {
        id: 2,
        name: "Sophie Transport",
        position: [48.8666, 2.3422], // Paris (Nord)
        statut: "En livraison",
        distance: "1.5 km",
        commandesEnCours: 2,
    },
    {
        id: 3,
        name: "Lucas Course",
        position: [48.8466, 2.3622], // Paris (Sud)
        statut: "Hors ligne",
        distance: "4.0 km",
        commandesEnCours: 0,
    },
];

const SelectLivreurPage = () => {
    const [livreurs, setLivreurs] = useState(fakeLivreurs);

    // Simulation d'une mise à jour en temps réel
    useEffect(() => {
        const interval = setInterval(() => {
            setLivreurs((prevLivreurs) =>
                prevLivreurs.map((livreur) => ({
                    ...livreur,
                    position: [
                        livreur.position[0] + (Math.random() - 0.5) * 0.01, // Variation lat
                        livreur.position[1] + (Math.random() - 0.5) * 0.01, // Variation long
                    ],
                }))
            );
        }, 3000); // Mise à jour toutes les 3 secondes

        return () => clearInterval(interval);
    }, []);

    // Colonnes pour la table des livreurs
    const columns = [
        "ID",
        "Nom",
        "Position",
        "Statut",
        "Distance",
        "Commandes en cours",
    ];

    return (
        <div className="w-full h-screen bg-gray-100 p-6 flex flex-col">
            <h1 className="text-2xl font-bold text-emerald-700 mb-6">
                Livraison - Sélection de livreurs
            </h1>
            <div className="flex flex-1 p-4 bg-gradient-to-r from-emerald-100 to-emerald-200 rounded-lg">
                {/* Section Tableaux Livreurs */}
                <div className="w-3/10 bg-white p-4 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold text-emerald-800 mb-4">
                        Livreurs connectés
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    {columns.map((column) => (
                                        <th
                                            key={column}
                                            className="py-2 px-3 text-sm font-semibold text-gray-700"
                                        >
                                            {column}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {livreurs.map((livreur) => (
                                    <tr
                                        key={livreur.id}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="py-2 px-3">
                                            {livreur.id}
                                        </td>
                                        <td className="py-2 px-3">
                                            {livreur.name}
                                        </td>
                                        <td className="py-2 px-3">{`${livreur.position[0].toFixed(
                                            4
                                        )}, ${livreur.position[1].toFixed(
                                            4
                                        )}`}</td>
                                        <td className="py-2 px-3">
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    livreur.statut ===
                                                    "Disponible"
                                                        ? "bg-green-100 text-green-800"
                                                        : livreur.statut ===
                                                          "En livraison"
                                                        ? "bg-yellow-100 text-yellow-800"
                                                        : "bg-gray-100 text-gray-800"
                                                }`}
                                            >
                                                {livreur.statut}
                                            </span>
                                        </td>
                                        <td className="py-2 px-3">
                                            {livreur.distance}
                                        </td>
                                        <td className="py-2 px-3">
                                            {livreur.commandesEnCours}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Map Container */}
                <div className="w-7/10 p-4">
                    <MapContainer
                        center={[48.8566, 2.3522]} // Paris
                        zoom={13}
                        className="w-full h-full rounded-lg shadow-lg"
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        {livreurs.map((livreur) => (
                            <Marker
                                key={livreur.id}
                                position={livreur.position}
                            >
                                <Popup>
                                    {livreur.name} - 📍 {livreur.statut}
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>
            </div>
        </div>
    );
};

export default SelectLivreurPage;
