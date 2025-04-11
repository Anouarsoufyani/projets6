import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-routing-machine";
import PropTypes from "prop-types";

const livreur = { id: 3, name: "Livreur", position: [48.8466, 2.3622] }; // Paris (Sud)
const client = { id: 5, name: "Client", position: [48.8066, 2.3022] }; // Paris (Sud)

const RoutingMachine = ({ from, to }) => {
    const map = useMap();

    useEffect(() => {
        if (!map) return;

        const routingControl = L.Routing.control({
            waypoints: [L.latLng(from[0], from[1]), L.latLng(to[0], to[1])],
            routeWhileDragging: true,
            createMarker: () => null, // Désactive les marqueurs automatiques
            showAlternatives: false,
        }).addTo(map);

        return () => map.removeControl(routingControl);
    }, [map, from, to]);

    return null;
};

RoutingMachine.propTypes = {
    from: PropTypes.arrayOf(PropTypes.number).isRequired,
    to: PropTypes.arrayOf(PropTypes.number).isRequired,
};

const LivraisonPage = () => {
    return (
        <div className="w-full min-h-full bg-gray-100 p-6 flex flex-col">
            <h1 className="text-2xl font-bold text-emerald-700 mb-6">
                Livraison - Suivi en temps réel
            </h1>
            <div className="flex flex-1 p-4 bg-gradient-to-r from-emerald-100 to-emerald-200">
                <div className="w-3/12  bg-emerald-50 p-4 text-black rounded-lg">
                    <h2 className="text-lg font-bold mb-4">
                        Information Commande
                    </h2>
                    <ul>
                        <li key={livreur.id} className="mb-2">
                            🚴 {livreur.name}
                        </li>
                        <li className="mb-2">photo de profil</li>
                        <li className="mb-2">commande</li>
                        <li className="mb-2">véhicule</li>
                        <li className="mb-2">immatriculation</li>
                        <li className="mb-2">note</li>
                    </ul>
                </div>

                {/* Map Container */}
                <div className="w-9/12 p-4">
                    <MapContainer
                        center={[48.8366, 2.3322]} // Centre ajusté
                        zoom={13}
                        className="w-full h-full rounded-lg shadow-lg"
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        <Marker key={livreur.id} position={livreur.position}>
                            <Popup>{livreur.name} - 📍 En déplacement</Popup>
                        </Marker>
                        <Marker key={client.id} position={client.position}>
                            <Popup>{client.name} - 📍 Adresse client</Popup>
                        </Marker>
                        <RoutingMachine
                            from={livreur.position}
                            to={client.position}
                        />
                    </MapContainer>
                </div>
            </div>
        </div>
    );
};

export default LivraisonPage;
