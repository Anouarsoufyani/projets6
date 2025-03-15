import { useState, useEffect } from "react";
import { useAuthUserQuery } from "../../Hooks/useAuthQueries";
import useUpdateProfile from "../../Hooks/useUpdateProfile";
import toast from "react-hot-toast";

const ProfilePage = () => {
    const [edit, setEdit] = useState(false);
    const { data: authUser, isLoading } = useAuthUserQuery();
    const { updateProfile, isUpdatingProfile } = useUpdateProfile();

    const [formData, setFormData] = useState({
        nom: "",
        email: "",
        numero: "",
        currentPassword: "",
        newPassword: "",
        // Champs spécifiques par rôle
        nom_boutique: "",
        adresse_boutique: {
            rue: "",
            ville: "",
            code_postal: "",
            lat: "",
            lng: "",
        },
        vehicule: { type: "", plaque: "", couleur: "", capacite: "" },
        position: { lat: "", lng: "" },
        disponibilite: false,
        distance_max: "",
        adresses_favorites: [
            { nom: "", rue: "", ville: "", code_postal: "", lat: "", lng: "" },
        ],
    });

    // Initialisation des données utilisateur
    useEffect(() => {
        if (authUser) {
            setFormData({
                nom: authUser.nom || "",
                email: authUser.email || "",
                numero: authUser.numero || "",
                currentPassword: "",
                newPassword: "",
                nom_boutique: authUser.nom_boutique || "",
                adresse_boutique: authUser.adresse_boutique || {
                    rue: "",
                    ville: "",
                    code_postal: "",
                    lat: "",
                    lng: "",
                },
                vehicule: authUser.vehicule || {
                    type: "",
                    plaque: "",
                    couleur: "",
                    capacite: "",
                },
                position: authUser.position || { lat: "", lng: "" },
                disponibilite: authUser.disponibilite || false,
                distance_max: authUser.distance_max || "",
                adresses_favorites:
                    authUser.adresses_favorites?.length > 0
                        ? authUser.adresses_favorites
                        : [
                              {
                                  nom: "",
                                  rue: "",
                                  ville: "",
                                  code_postal: "",
                                  lat: "",
                                  lng: "",
                              },
                          ],
            });
        }
    }, [authUser]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleNestedChange = (e, field, subField) => {
        setFormData({
            ...formData,
            [field]: { ...formData[field], [subField]: e.target.value },
        });
    };

    const handleAdresseFavoriteChange = (e, index, field) => {
        const newAdresses = [...formData.adresses_favorites];
        newAdresses[index][field] = e.target.value;
        setFormData({ ...formData, adresses_favorites: newAdresses });
    };

    const addAdresseFavorite = () => {
        setFormData({
            ...formData,
            adresses_favorites: [
                ...formData.adresses_favorites,
                {
                    nom: "",
                    rue: "",
                    ville: "",
                    code_postal: "",
                    lat: "",
                    lng: "",
                },
            ],
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.currentPassword && formData.newPassword) {
            toast.error(
                "Veuillez entrer votre mot de passe actuel pour en définir un nouveau"
            );
            return;
        }
        updateProfile(formData);
        setEdit(false);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <span className="loading loading-spinner loading-lg text-emerald-600"></span>
            </div>
        );
    }

    if (!authUser) {
        return (
            <div className="text-center text-red-600">
                Erreur : Utilisateur non trouvé
            </div>
        );
    }

    return (
        <main className="w-full min-h-screen bg-gray-100 p-6">
            <h1 className="text-2xl font-bold text-emerald-700 mb-6">Profil</h1>
            <div className="bg-white rounded-lg shadow-md p-6">
                {/* En-tête */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-6">
                        <img
                            src={
                                authUser.profilePic ||
                                "https://placehold.co/100x100"
                            }
                            alt="Profil"
                            className="w-20 h-20 rounded-full object-cover"
                        />
                        <div>
                            <p className="text-2xl font-bold text-emerald-700">
                                {authUser.nom}
                            </p>
                            <p className="text-gray-600 capitalize">
                                {authUser.role}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setEdit(!edit)}
                        className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition"
                    >
                        {edit ? "Annuler" : "Modifier le profil"}
                    </button>
                </div>

                {/* Contenu */}
                {edit ? (
                    <form
                        onSubmit={handleSubmit}
                        className="grid grid-cols-2 gap-6"
                    >
                        {/* Champs communs */}
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">
                                Nom
                            </label>
                            <input
                                type="text"
                                name="nom"
                                value={formData.nom}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">
                                Numéro
                            </label>
                            <input
                                type="tel"
                                name="numero"
                                value={formData.numero}
                                onChange={handleInputChange}
                                pattern="^0[1-9](\s?\d{2}){4}$"
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>

                        {/* Champs spécifiques selon le rôle */}
                        {authUser.role === "commercant" && (
                            <>
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700">
                                        Nom de la boutique
                                    </label>
                                    <input
                                        type="text"
                                        name="nom_boutique"
                                        value={formData.nom_boutique}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block mb-1 text-sm font-medium text-gray-700">
                                        Adresse de la boutique
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            type="text"
                                            name="rue"
                                            placeholder="Rue"
                                            value={
                                                formData.adresse_boutique.rue
                                            }
                                            onChange={(e) =>
                                                handleNestedChange(
                                                    e,
                                                    "adresse_boutique",
                                                    "rue"
                                                )
                                            }
                                            className="p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                        />
                                        <input
                                            type="text"
                                            name="ville"
                                            placeholder="Ville"
                                            value={
                                                formData.adresse_boutique.ville
                                            }
                                            onChange={(e) =>
                                                handleNestedChange(
                                                    e,
                                                    "adresse_boutique",
                                                    "ville"
                                                )
                                            }
                                            className="p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                        />
                                        <input
                                            type="text"
                                            name="code_postal"
                                            placeholder="Code postal"
                                            value={
                                                formData.adresse_boutique
                                                    .code_postal
                                            }
                                            onChange={(e) =>
                                                handleNestedChange(
                                                    e,
                                                    "adresse_boutique",
                                                    "code_postal"
                                                )
                                            }
                                            className="p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                        />
                                        <input
                                            type="number"
                                            name="lat"
                                            placeholder="Latitude"
                                            value={
                                                formData.adresse_boutique.lat
                                            }
                                            onChange={(e) =>
                                                handleNestedChange(
                                                    e,
                                                    "adresse_boutique",
                                                    "lat"
                                                )
                                            }
                                            className="p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                        />
                                        <input
                                            type="number"
                                            name="lng"
                                            placeholder="Longitude"
                                            value={
                                                formData.adresse_boutique.lng
                                            }
                                            onChange={(e) =>
                                                handleNestedChange(
                                                    e,
                                                    "adresse_boutique",
                                                    "lng"
                                                )
                                            }
                                            className="p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {authUser.role === "livreur" && (
                            <>
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700">
                                        Type de véhicule
                                    </label>
                                    <select
                                        name="type"
                                        value={formData.vehicule.type}
                                        onChange={(e) =>
                                            handleNestedChange(
                                                e,
                                                "vehicule",
                                                "type"
                                            )
                                        }
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                    >
                                        <option value="">Sélectionner</option>
                                        <option value="voiture">Voiture</option>
                                        <option value="moto">Moto</option>
                                        <option value="vélo">Vélo</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700">
                                        Plaque
                                    </label>
                                    <input
                                        type="text"
                                        name="plaque"
                                        value={formData.vehicule.plaque}
                                        onChange={(e) =>
                                            handleNestedChange(
                                                e,
                                                "vehicule",
                                                "plaque"
                                            )
                                        }
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700">
                                        Couleur
                                    </label>
                                    <input
                                        type="text"
                                        name="couleur"
                                        value={formData.vehicule.couleur}
                                        onChange={(e) =>
                                            handleNestedChange(
                                                e,
                                                "vehicule",
                                                "couleur"
                                            )
                                        }
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700">
                                        Capacité
                                    </label>
                                    <input
                                        type="number"
                                        name="capacite"
                                        value={formData.vehicule.capacite}
                                        onChange={(e) =>
                                            handleNestedChange(
                                                e,
                                                "vehicule",
                                                "capacite"
                                            )
                                        }
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700">
                                        Distance max (km)
                                    </label>
                                    <input
                                        type="number"
                                        name="distance_max"
                                        value={formData.distance_max}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="disponibilite"
                                        checked={formData.disponibilite}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                disponibilite: e.target.checked,
                                            })
                                        }
                                        className="h-4 w-4 text-emerald-600 border-gray-300 rounded"
                                    />
                                    <label className="text-sm font-medium text-gray-700">
                                        Disponible
                                    </label>
                                </div>
                            </>
                        )}

                        {authUser.role === "client" && (
                            <div className="col-span-2">
                                <label className="block mb-1 text-sm font-medium text-gray-700">
                                    Adresses favorites
                                </label>
                                {formData.adresses_favorites.map(
                                    (adresse, index) => (
                                        <div
                                            key={index}
                                            className="grid grid-cols-3 gap-2 mb-2"
                                        >
                                            <input
                                                type="text"
                                                placeholder="Nom"
                                                value={adresse.nom}
                                                onChange={(e) =>
                                                    handleAdresseFavoriteChange(
                                                        e,
                                                        index,
                                                        "nom"
                                                    )
                                                }
                                                className="p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Rue"
                                                value={adresse.rue}
                                                onChange={(e) =>
                                                    handleAdresseFavoriteChange(
                                                        e,
                                                        index,
                                                        "rue"
                                                    )
                                                }
                                                className="p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Ville"
                                                value={adresse.ville}
                                                onChange={(e) =>
                                                    handleAdresseFavoriteChange(
                                                        e,
                                                        index,
                                                        "ville"
                                                    )
                                                }
                                                className="p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Code postal"
                                                value={adresse.code_postal}
                                                onChange={(e) =>
                                                    handleAdresseFavoriteChange(
                                                        e,
                                                        index,
                                                        "code_postal"
                                                    )
                                                }
                                                className="p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                            />
                                            <input
                                                type="number"
                                                placeholder="Latitude"
                                                value={adresse.lat}
                                                onChange={(e) =>
                                                    handleAdresseFavoriteChange(
                                                        e,
                                                        index,
                                                        "lat"
                                                    )
                                                }
                                                className="p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                            />
                                            <input
                                                type="number"
                                                placeholder="Longitude"
                                                value={adresse.lng}
                                                onChange={(e) =>
                                                    handleAdresseFavoriteChange(
                                                        e,
                                                        index,
                                                        "lng"
                                                    )
                                                }
                                                className="p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                            />
                                        </div>
                                    )
                                )}
                                <button
                                    type="button"
                                    onClick={addAdresseFavorite}
                                    className="text-emerald-600 hover:underline"
                                >
                                    + Ajouter une adresse
                                </button>
                            </div>
                        )}

                        {/* Champs mot de passe */}
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">
                                Mot de passe actuel
                            </label>
                            <input
                                type="password"
                                name="currentPassword"
                                value={formData.currentPassword}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">
                                Nouveau mot de passe
                            </label>
                            <input
                                type="password"
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>

                        {/* Bouton de soumission */}
                        <div className="col-span-2 flex justify-end">
                            <button
                                type="submit"
                                disabled={isUpdatingProfile}
                                className="bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-600 transition disabled:bg-emerald-300"
                            >
                                {isUpdatingProfile
                                    ? "Mise à jour..."
                                    : "Mettre à jour"}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-xl font-bold text-emerald-700 mb-4">
                                Informations
                            </p>
                            <ul className="space-y-2 text-gray-700">
                                <li>
                                    <strong>Nom :</strong> {authUser.nom}
                                </li>
                                <li>
                                    <strong>Email :</strong> {authUser.email}
                                </li>
                                <li>
                                    <strong>Numéro :</strong> {authUser.numero}
                                </li>
                                <li>
                                    <strong>Rôle :</strong> {authUser.role}
                                </li>
                            </ul>
                        </div>
                        <div>
                            {authUser.role === "commercant" && (
                                <ul className="space-y-2 text-gray-700">
                                    <li>
                                        <strong>Nom boutique :</strong>{" "}
                                        {authUser.nom_boutique || "N/A"}
                                    </li>
                                    <li>
                                        <strong>Adresse boutique :</strong>{" "}
                                        {authUser.adresse_boutique?.rue
                                            ? `${authUser.adresse_boutique.rue}, ${authUser.adresse_boutique.ville}`
                                            : "N/A"}
                                    </li>
                                </ul>
                            )}
                            {authUser.role === "livreur" && (
                                <ul className="space-y-2 text-gray-700">
                                    <li>
                                        <strong>Véhicule :</strong>{" "}
                                        {authUser.vehicule?.type || "N/A"}
                                    </li>
                                    <li>
                                        <strong>Plaque :</strong>{" "}
                                        {authUser.vehicule?.plaque || "N/A"}
                                    </li>
                                    <li>
                                        <strong>Disponibilité :</strong>{" "}
                                        {authUser.disponibilite ? "Oui" : "Non"}
                                    </li>
                                    <li>
                                        <strong>Distance max :</strong>{" "}
                                        {authUser.distance_max} km
                                    </li>
                                </ul>
                            )}
                            {authUser.role === "client" && (
                                <ul className="space-y-2 text-gray-700">
                                    <li>
                                        <strong>Adresses favorites :</strong>
                                        {authUser.adresses_favorites?.length >
                                        0 ? (
                                            <ul className="ml-4 list-disc">
                                                {authUser.adresses_favorites.map(
                                                    (adresse, index) => (
                                                        <li key={index}>
                                                            {adresse.nom} -{" "}
                                                            {adresse.rue},{" "}
                                                            {adresse.ville}
                                                        </li>
                                                    )
                                                )}
                                            </ul>
                                        ) : (
                                            " Aucune"
                                        )}
                                    </li>
                                </ul>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
};

export default ProfilePage;
