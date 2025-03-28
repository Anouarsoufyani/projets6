import DeliveryControls from "../../Components/DeliveryControls";
import { useAuthUserQuery } from "../../Hooks/useAuthQueries";

const DetailCommande = () => {
  const { data: authUser } = useAuthUserQuery();
  // autres hooks et variables...

  // Gérer le changement de statut
  const handleStatusChange = (newStatus) => {
    // Mettre à jour l'interface si nécessaire
  };

  return (
    <div className="w-full min-h-full bg-gray-50 p-4 md:p-6 flex flex-col">
      {/* Contenu existant... */}
      
      {/* Ajouter les contrôles pour les livreurs */}
      {authUser?.role === "livreur" && commande && (
        <DeliveryControls 
          commandeId={commande.data._id} 
          onStatusChange={handleStatusChange}
          initialStatus={commande.data.statut}
        />
      )}
      
      {/* Reste du contenu... */}
    </div>
  );
};

export default DetailCommande; 