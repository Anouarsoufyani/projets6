import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const LivraisonPage = () => {
    return (
        <div>
            <main className="w-full h-screen bg-gray-100 p-6">
                <h1 className="text-2xl font-bold text-emerald-700 mb-6">
                    Livraison
                </h1>
                <div className="flex justify-between flex-row h-9/10 w-full bg-black p-4">
                    <div className="w-3/12 h-full bg-red-900"></div>
                    {/* Carte ici */}
                    <div className="w-9/12 h-full bg-yellow-900">
                        <MapContainer
                            center={[48.8566, 2.3522]} // Coordonnées de Paris (à modifier)
                            zoom={13}
                            className="w-full h-full"
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />
                        </MapContainer>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default LivraisonPage;
