import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useMutation } from '@tanstack/react-query';

const JustificativePage = () => {
  const [selectedVehicles, setSelectedVehicles] = useState([]);
  const [showDocuments, setShowDocuments] = useState(false);
  const [documents, setDocuments] = useState({});

  const vehicleOptions = [
    { name: 'Vélo', image: '/images/velo.jpg' },
    { name: 'Moto', image: '/images/moto.pnj' },
    { name: 'Voiture', image: '/images/voiture.jpg' },
    { name: 'Autres', image: '/images/autres.pnj' },
  ];

  const handleVehicleChange = (vehicleName) => {
    setSelectedVehicles((prev) =>
      prev.includes(vehicleName)
        ? prev.filter((v) => v !== vehicleName)
        : [...prev, vehicleName]
    );
  };

  const handleFileSelect = (e, vehicleName) => {
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) {
      toast.error('Le fichier est trop volumineux (max 5MB)');
      return;
    }
    if (file && !['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
      toast.error('Format de fichier non valide (JPEG, PNG, PDF)');
      return;
    }
    setDocuments((prev) => ({ ...prev, [vehicleName]: file }));
  };

  const handleSubmitVehicles = () => {
    if (selectedVehicles.length === 0) {
      toast.error('Veuillez sélectionner au moins un véhicule.');
      return;
    }
    setShowDocuments(true);
  };

  const handleFileChange = (e, docType) => {
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) {
      toast.error('Le fichier est trop volumineux (max 5MB)');
      return;
    }
    if (file && !['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
      toast.error('Format de fichier non valide (JPEG, PNG, PDF)');
      return;
    }
    setDocuments((prev) => ({ ...prev, [docType]: file }));
  };

  const requiredDocs = () => {
    const docs = ['carte d\'identité', 'photo de votre tête'];
    selectedVehicles.forEach((vehicle) => {
      if (vehicle === 'Moto' || vehicle === 'Voiture') {
        docs.push(`permis ${vehicle}`, `carte grise ${vehicle}`, `assurance ${vehicle}`);
      }
    });
    return docs;
  };

  const { mutate: submitDocuments } = useMutation({
    mutationFn: async (formData) => {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Échec de l’envoi des documents');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Documents soumis avec succès !');
    },
    onError: (error) => {
      toast.error(error.message || 'Erreur lors de la soumission');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    let allDocsPresent = true;

    requiredDocs().forEach((doc) => {
      if (documents[doc]) {
        formData.append(doc, documents[doc]);
      } else {
        toast.error(`Veuillez ajouter le fichier pour ${doc}`);
        allDocsPresent = false;
        return;
      }
    });

    if (allDocsPresent) {
      submitDocuments(formData);
    } else {
      toast.error('Veuillez remplir tous les champs');
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Soumettre vos pièces justificatives</h1>

      {!showDocuments ? (
        <div>
          <h2 className="text-lg font-semibold mb-2">Quel(s) véhicule(s) utilisez-vous ?</h2>
          <div className="relative w-[400px] h-[400px]">
            {vehicleOptions.map((vehicle) => (
              <div
                key={vehicle.name}
                className={`cursor-pointer absolute w-[150px] h-[150px] border border-green-500 text-center leading-[150px] transition-transform duration-300 hover:scale-110 hover:bg-gray-100 ${
                  selectedVehicles.includes(vehicle.name) ? 'scale-110 bg-gray-100' : ''
                } ${
                  vehicle.name === 'Voiture' ? 'top-0 left-0' :
                  vehicle.name === 'Moto' ? 'top-0 right-0' :
                  vehicle.name === 'Vélo' ? 'bottom-0 left-0' :
                  vehicle.name === 'Autres' ? 'bottom-0 right-0' : ''
                }`}
                onClick={() => handleVehicleChange(vehicle.name)}
              >
                <img
                  src={vehicle.image}
                  alt={vehicle.name}
                  className="w-32 h-32 object-cover rounded-md hidden"
                />
                <p className="text-center mt-2">{vehicle.name}</p>
              </div>
            ))}
          </div>
          <button
            className="bg-emerald-500 text-white px-4 py-2 rounded hover:bg-emerald-600 mt-4"
            onClick={handleSubmitVehicles}
          >
            Soumettre les véhicules
          </button>
        </div>
      ) : (
        <div>
          <h2 className="text-lg font-semibold mb-4">Télécharger vos pièces justificatives</h2>
          <form onSubmit={handleSubmit}>
            {requiredDocs().map((doc) => (
              <div className="mb-4" key={doc}>
                <label className="block mb-2 capitalize">Insérez votre {doc}</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => handleFileChange(e, doc)}
                  className="hidden"
                  id={`file-input-${doc}`}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById(`file-input-${doc}`).click()}
                  className="bg-white border-2 border-green-500 text-green-700 font-bold py-2 px-4 rounded hover:bg-green-100"
                >
                  Choisir le fichier
                </button>
                {documents[doc] && (
                  <p className="mt-2 text-sm">Fichier sélectionné : {documents[doc].name}</p>
                )}
              </div>
            ))}
            <button
              className="bg-emerald-500 text-white px-4 py-2 rounded hover:bg-emerald-600"
              type="submit"
            >
              Soumettre les documents
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default JustificativePage;