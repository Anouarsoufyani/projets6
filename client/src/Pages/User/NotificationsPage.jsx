import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";

const api = import.meta.env.VITE_API_URL;

const getNotifications = async () => {
    try {
        const res = await fetch(`${api}/notifications`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "Erreur lors du chargement");
        }

        return data;
    } catch (error) {
        toast.error(error.message);
        throw error;
    }
};

const NotificationsPage = () => {
    const { data, isLoading, isError } = useQuery({
        queryKey: ["notifications"],
        queryFn: getNotifications,
        retry: false,
    });

    if (isLoading) {
        return <div>Chargement des notifications...</div>;
    }

    if (isError) {
        return (
            <div className="text-red-500">
                Erreur lors de la récupération des notifications.
            </div>
        );
    }

    if (!data.notifications || data.notifications.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center py-10 text-center bg-white shadow rounded-md border border-gray-200">
                <p className="text-gray-600 text-lg font-medium mb-1">
                    Aucune notification pour le moment.
                </p>
                <p className="text-sm text-gray-400">Vérifiez plus tard.</p>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-3">
            <h1 className="text-xl font-semibold mb-4">Notifications</h1>
            {data.notifications.map((notification) => (
                <div
                    key={notification._id}
                    className="p-3 bg-white shadow rounded-md border"
                >
                    <p className="font-medium">
                        {notification.type} de {notification.sender.nom}
                    </p>
                </div>
            ))}
        </div>
    );
};

export default NotificationsPage;
