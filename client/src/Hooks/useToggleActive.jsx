import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const api = import.meta.env.VITE_API_URL;
const useToggleActive = () => {
    const queryClient = useQueryClient();

    const { mutateAsync: toggleActive, isPending: isToggleActive } =
        useMutation({
            mutationFn: async (id) => {
                console.log("id", JSON.stringify({ id }));

                const res = await fetch(`${api}/user/active`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ id }),
                });

                const data = await res.json();
                if (!res.ok) {
                    throw new Error(
                        data.error || "Erreur lors de l'activation du livreur"
                    );
                }
                console.log("Livreur activé :", data);
                return data;
            },
            onSuccess: () => {
                toast.success("Livreur activé avec succès");
                // Invalide les caches pour rafraîchir les données
                Promise.all([
                    // queryClient.invalidateQueries({ queryKey: ["livreurs"] }),
                    queryClient.invalidateQueries({ queryKey: ["authUser"] }),
                ]);
            },
            onError: (err) => {
                toast.error(err.message);
            },
        });

    return { toggleActive, isToggleActive };
};

export default useToggleActive;
