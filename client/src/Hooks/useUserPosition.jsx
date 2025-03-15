import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const useUserPosition = () => {
    const [position, setPosition] = useState([null, null]);

    useEffect(() => {
        if (!navigator.geolocation) {
            toast.error(
                "La géolocalisation n'est pas supportée par votre navigateur"
            );
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
            (err) => toast.error(`Erreur : ${err.message}`),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    return position;
};

export default useUserPosition;
