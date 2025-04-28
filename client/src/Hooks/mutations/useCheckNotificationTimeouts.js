"use client";

import React from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export const useCheckNotificationTimeouts = () => {
    const queryClient = useQueryClient();

    // Track when the last check was performed to prevent excessive calls
    const lastCheckRef = React.useRef(0);

    return useMutation({
        mutationFn: async () => {
            // Prevent calling the API too frequently (minimum 5 seconds between calls)
            const now = Date.now();
            if (now - lastCheckRef.current < 5000) {
                return { results: [], skipped: true };
            }

            lastCheckRef.current = now;

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

                const res = await fetch(`/api/commandes/check-timeouts`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    throw new Error(
                        errorData.error ||
                            "Erreur lors de la vérification des timeouts"
                    );
                }

                return res.json();
            } catch (error) {
                // Don't throw for AbortError (timeout)
                if (error.name === "AbortError") {
                    console.warn("Request timeout for notification check");
                    return { results: [], timedOut: true };
                }
                throw error;
            }
        },
        onSuccess: (data) => {
            // Skip invalidation if the request was skipped or timed out
            if (data.skipped || data.timedOut || data.locked) return;

            if (data.results && data.results.length > 0) {
                // Use a small delay to avoid race conditions with other queries
                setTimeout(() => {
                    queryClient.invalidateQueries(["notifications"]);
                    queryClient.invalidateQueries(["commandes"]);
                    queryClient.invalidateQueries(["filteredNotifications"]);
                }, 300);

                // Only show toast if there were actual changes
                if (
                    data.results.some(
                        (r) =>
                            r.status === "timeout" || r.status === "activated"
                    )
                ) {
                    toast.success(
                        `${data.results.length} notifications expirées traitées`
                    );
                }
            }
        },
        onError: (error) => {
            console.error(
                "Erreur lors de la vérification des timeouts:",
                error
            );
            // Don't show error toast to avoid spamming the user
        },
        retry: 2,
        retryDelay: 1000,
    });
};
