import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";

export const useGetNotifications = () => {
    return useQuery({
        queryKey: ["notifications"],
        queryFn: async () => {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

                const res = await fetch(`/api/notifications`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                    signal: controller.signal,
                    // Add cache control headers to prevent browser caching
                    cache: "no-cache",
                });

                clearTimeout(timeoutId);

                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data.error || "Erreur lors du chargement");
                }

                return await res.json();
            } catch (error) {
                // Don't show toast for AbortError (timeout)
                if (error.name !== "AbortError") {
                    console.error("Error fetching notifications:", error);
                }
                throw error;
            }
        },
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
        refetchInterval: 5000,
        refetchIntervalInBackground: false,
        refetchOnWindowFocus: true,
        staleTime: 2000,
        onError: (error) => {
            // Only show one toast error message to avoid spamming
            if (error.name !== "AbortError") {
                toast.error("Erreur lors du chargement des notifications", {
                    id: "notification-fetch-error",
                });
            }
        },
    });
};

export const useFilteredNotifications = (authUser) => {
    return useQuery({
        queryKey: ["filteredNotifications"],
        queryFn: async () => {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

                const res = await fetch(`/api/notifications`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                    signal: controller.signal,
                    cache: "no-cache",
                });

                clearTimeout(timeoutId);

                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data.error || "Erreur lors du chargement");
                }

                const data = await res.json();
                const unreadNotifications = data.notifications.filter(
                    (notif) => !notif.read
                )?.length;

                return unreadNotifications;
            } catch (error) {
                // Silent failure for this query
                console.warn("Error fetching filtered notifications:", error);
                return 0;
            }
        },
        retry: 2,
        retryDelay: 1000,
        refetchInterval: 10000,
        enabled: !!authUser,
        staleTime: 5000,
    });
};
