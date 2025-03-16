import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const DeliveryControls = ({ commandeId, onStatusChange, initialStatus }) => {
  const [status, setStatus] = useState(initialStatus || "en_preparation");
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const endDeliveryMutation = useMutation({
    mutationFn: async () => {
      setIsLoading(true);
      try {
        // Mettre à jour le statut dans la base de données
        const response = await fetch(`/api/commandes/${commandeId}/status`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ status: "livré" })
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || "Erreur lors de la mise à jour du statut");
        }
        
        return data;
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: () => {
      // Mettre à jour l'état local
      setStatus("livré");
      if (onStatusChange) onStatusChange("livré");
      
      // Invalider les requêtes pour forcer un rafraîchissement
      queryClient.invalidateQueries(["getCommande", commandeId]);
      queryClient.invalidateQueries(["userCommandes"]);
      
      toast.success("Livraison terminée avec succès");
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const handleEndDelivery = () => {
    endDeliveryMutation.mutate();
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="bg-emerald-50 p-4 rounded-lg">
        <h3 className="font-medium text-emerald-800 mb-2">Contrôle de livraison</h3>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-gray-700">Statut actuel: </span>
            <span className={`font-semibold ${
              status === "en_attente" ? "text-yellow-600" :
              status === "en_livraison" ? "text-blue-600" :
              status === "livré" ? "text-green-600" : "text-gray-600"
            }`}>
              {status === "en_attente" ? "En attente" :
               status === "en_livraison" ? "En livraison" :
               status === "livré" ? "Livré" : status}
            </span>
          </div>
          <div className="space-x-2">
            {status === "en_attente" && (
              <button
                onClick={handleEndDelivery}
                disabled={isLoading}
                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
              >
                {isLoading ? "Chargement..." : "Terminer la livraison"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryControls; 