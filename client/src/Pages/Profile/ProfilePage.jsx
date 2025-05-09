"use client";

import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useAuthUserQuery, useUpdateProfile } from "../../Hooks";
import toast from "react-hot-toast";

const initialForm = {
    nom: "",
    email: "",
    numero: "",
    currentPassword: "",
    newPassword: "",
    nom_boutique: "",
    adresse_boutique: { rue: "", ville: "", code_postal: "", lat: "", lng: "" },
    vehicule: { type: "", plaque: "", couleur: "", capacite: "" },
    position: { lat: "", lng: "" },
    disponibilite: false,
    distance_max: "",
    adresses_favorites: [
        { rue: "", ville: "", code_postal: "", lat: "", lng: "" },
    ],
};

const ProfilePage = () => {
    const [edit, setEdit] = useState(false);
    const { data: authUser, isLoading } = useAuthUserQuery();
    const { updateProfile, isUpdatingProfile } = useUpdateProfile();
    const [formData, setFormData] = useState(initialForm);

    useEffect(() => {
        if (authUser) {
            setFormData({
                ...initialForm,
                ...authUser,
                currentPassword: "",
                newPassword: "",
                adresses_favorites:
                    authUser.adresses_favorites?.length > 0
                        ? authUser.adresses_favorites
                        : initialForm.adresses_favorites,
            });
        }
    }, [authUser]);


    const handleChange = (e, field = null, subField = null, index = null) => {
        const { name, value, type, checked } = e.target;

        if (field && subField) {

            setFormData((prev) => ({
                ...prev,
                [field]: { ...prev[field], [subField]: value },
            }));
        } else if (field && index !== null) {
            const newArray = [...formData[field]];
            newArray[index][name] = value;
            setFormData((prev) => ({ ...prev, [field]: newArray }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: type === "checkbox" ? checked : value,
            }));
        }
    };

    const getCoords = async (adresse) => {
        if (!adresse) throw new Error("L'adresse ne peut pas être vide");

        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
            adresse
        )}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.status !== "OK") {
            throw new Error(
                data.error_message || "Impossible de récupérer les coordonnées"
            );
        }

        return data.results[0].geometry.location;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (formData.newPassword && !formData.currentPassword) {
                toast.error(
                    "Veuillez entrer votre mot de passe actuel pour en définir un nouveau"
                );
                return;
            }

            const updatedFormData = { ...formData };

            if (
                authUser.role === "client" &&
                updatedFormData.adresses_favorites
            ) {
                for (
                    let i = 0;
                    i < updatedFormData.adresses_favorites.length;
                    i++
                ) {
                    const favorite = updatedFormData.adresses_favorites[i];

                    if (
                        favorite?.rue &&
                        favorite?.ville &&
                        favorite?.code_postal
                    ) {
                        const adr = `${favorite.rue} ${favorite.ville} ${favorite.code_postal}`;
                        try {
                            const data = await getCoords(adr);
                            updatedFormData.adresses_favorites[i].lat =
                                data.lat;
                            updatedFormData.adresses_favorites[i].lng =
                                data.lng;
                        } catch (error) {
                            console.error(
                                "Erreur récupération coordonnées :",
                                error
                            );
                            toast.error(
                                `Erreur pour l'adresse "${
                                    favorite.nom || i + 1
                                }": ${error.message}`
                            );
                        }
                    }
                }
            }

            if (
                authUser.role === "commercant" &&
                updatedFormData.adresse_boutique?.rue &&
                updatedFormData.adresse_boutique?.ville &&
                updatedFormData.adresse_boutique?.code_postal
            ) {
                const adr = `${updatedFormData.adresse_boutique.rue} ${updatedFormData.adresse_boutique.ville} ${updatedFormData.adresse_boutique.code_postal}`;
                try {
                    const data = await getCoords(adr);
                    updatedFormData.adresse_boutique.lat = data.lat;
                    updatedFormData.adresse_boutique.lng = data.lng;
                } catch (error) {
                    console.error(
                        "Erreur récupération coordonnées boutique:",
                        error
                    );
                    toast.error(
                        `Erreur pour l'adresse de la boutique: ${error.message}`
                    );
                }
            }

            updateProfile(updatedFormData);
            setEdit(false);
        } catch (error) {
            toast.error(`Une erreur est survenue: ${error.message}`);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen"></div>
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
        <main className="w-full min-h-full bg-gradient-to-br from-emerald-50 to-teal-100 p-4 md:p-6 overflow-x-hidden">
            <h1 className="text-xl md:text-2xl font-bold text-emerald-700 mb-4 md:mb-6">
                Profil
            </h1>
            <div className="bg-white rounded-lg shadow-md p-4 md:p-6">

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 md:gap-6">
                        <img
                            src={
                                authUser.profilePic ||
                                "https://placehold.co/100x100"
                            }
                            alt="Profil"
                            className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover"
                        />
                        <div>
                            <p className="text-xl md:text-2xl font-bold text-emerald-700 break-words">
                                {authUser.nom}
                            </p>
                            <p className="text-gray-600 capitalize">
                                {authUser.role}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setEdit(!edit)}
                        className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition self-start sm:self-auto"
                    >
                        {edit ? "Annuler" : "Modifier le profil"}
                    </button>
                </div>

                {edit ? (
                    <form
                        onSubmit={handleSubmit}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
                    >
                        <FormField
                            label="Nom"
                            name="nom"
                            value={formData.nom}
                            onChange={handleChange}
                        />
                        <FormField
                            label="Email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                        />
                        <FormField
                            label="Numéro"
                            name="numero"
                            type="tel"
                            value={formData.numero}
                            onChange={handleChange}
                            pattern="^0[1-9](\s?\d{2}){4}$"
                        />

                        {authUser.role === "commercant" && (
                            <>
                                <FormField
                                    label="Nom de la boutique"
                                    name="nom_boutique"
                                    value={formData.nom_boutique}
                                    onChange={handleChange}
                                />
                                <div className="col-span-1 md:col-span-2">
                                    <label className="block mb-1 text-sm font-medium text-gray-700">
                                        Adresse de la boutique
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {["rue", "ville", "code_postal"].map(
                                            (field) => (
                                                <input
                                                    key={field}
                                                    type="text"
                                                    name={field}
                                                    placeholder={
                                                        field
                                                            .charAt(0)
                                                            .toUpperCase() +
                                                        field
                                                            .slice(1)
                                                            .replace("_", " ")
                                                    }
                                                    value={
                                                        formData
                                                            .adresse_boutique[
                                                            field
                                                        ]
                                                    }
                                                    onChange={(e) =>
                                                        handleChange(
                                                            e,
                                                            "adresse_boutique",
                                                            field
                                                        )
                                                    }
                                                    className="p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                                />
                                            )
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Les coordonnées GPS seront
                                        automatiquement calculées lors de la
                                        sauvegarde.
                                    </p>
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
                                            handleChange(e, "vehicule", "type")
                                        }
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                    >
                                        <option value="">Sélectionner</option>
                                        {["voiture", "moto", "vélo"].map(
                                            (type) => (
                                                <option key={type} value={type}>
                                                    {type
                                                        .charAt(0)
                                                        .toUpperCase() +
                                                        type.slice(1)}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>

                                {["plaque", "couleur"].map((field) => (
                                    <FormField
                                        key={field}
                                        label={
                                            field.charAt(0).toUpperCase() +
                                            field.slice(1)
                                        }
                                        name={field}
                                        value={formData.vehicule[field]}
                                        onChange={(e) =>
                                            handleChange(e, "vehicule", field)
                                        }
                                    />
                                ))}

                                <FormField
                                    label="Capacité"
                                    name="capacite"
                                    type="number"
                                    value={formData.vehicule.capacite}
                                    onChange={(e) =>
                                        handleChange(e, "vehicule", "capacite")
                                    }
                                />

                                <FormField
                                    label="Distance max (km)"
                                    name="distance_max"
                                    type="number"
                                    value={formData.distance_max}
                                    onChange={handleChange}
                                />

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="disponibilite"
                                        checked={formData.disponibilite}
                                        onChange={handleChange}
                                        className="h-4 w-4 text-emerald-600 border-gray-300 rounded"
                                    />
                                    <label className="text-sm font-medium text-gray-700">
                                        Disponible
                                    </label>
                                </div>
                            </>
                        )}

                        {authUser.role === "client" && (
                            <div className="col-span-1 md:col-span-2">
                                <label className="block mb-1 text-sm font-medium text-gray-700">
                                    Adresses favorites
                                </label>
                                {formData.adresses_favorites.length > 0 ? (
                                    formData.adresses_favorites.map(
                                        (adresse, index) => (
                                            <div
                                                key={index}
                                                className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4 p-3 border border-gray-100 rounded-lg bg-gray-50"
                                            >
                                                {[
                                                    "rue",
                                                    "ville",
                                                    "code_postal",
                                                ].map((field) => (
                                                    <input
                                                        key={field}
                                                        type="text"
                                                        placeholder={
                                                            field
                                                                .charAt(0)
                                                                .toUpperCase() +
                                                            field
                                                                .slice(1)
                                                                .replace(
                                                                    "_",
                                                                    " "
                                                                )
                                                        }
                                                        value={
                                                            adresse[field] || ""
                                                        }
                                                        name={field}
                                                        onChange={(e) =>
                                                            handleChange(
                                                                e,
                                                                "adresses_favorites",
                                                                null,
                                                                index
                                                            )
                                                        }
                                                        className="p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                                                    />
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newAddresses = [
                                                            ...formData.adresses_favorites,
                                                        ];
                                                        newAddresses.splice(
                                                            index,
                                                            1
                                                        );
                                                        setFormData({
                                                            ...formData,
                                                            adresses_favorites:
                                                                newAddresses,
                                                        });
                                                    }}
                                                    className="text-red-500 hover:text-red-700 text-sm mt-2"
                                                >
                                                    Supprimer cette adresse
                                                </button>
                                            </div>
                                        )
                                    )
                                ) : (
                                    <p className="text-gray-500 italic mb-2">
                                        Aucune adresse favorite
                                    </p>
                                )}
                                <p className="text-xs text-gray-500 mb-2">
                                    Les coordonnées GPS seront automatiquement
                                    calculées lors de la sauvegarde.
                                </p>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setFormData({
                                            ...formData,
                                            adresses_favorites: [
                                                ...formData.adresses_favorites,
                                                {
                                                    rue: "",
                                                    ville: "",
                                                    code_postal: "",
                                                    lat: "",
                                                    lng: "",
                                                },
                                            ],
                                        })
                                    }
                                    className="text-emerald-600 hover:underline mt-2"
                                >
                                    + Ajouter une adresse
                                </button>
                            </div>
                        )}

                        <FormField
                            label="Mot de passe actuel"
                            name="currentPassword"
                            type="password"
                            value={formData.currentPassword}
                            onChange={handleChange}
                        />
                        <FormField
                            label="Nouveau mot de passe"
                            name="newPassword"
                            type="password"
                            value={formData.newPassword}
                            onChange={handleChange}
                        />

                        <div className="col-span-1 md:col-span-2 flex justify-end mt-4">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <p className="text-lg md:text-xl font-bold text-emerald-700 mb-4">
                                Informations
                            </p>
                            <ul className="space-y-2 text-gray-700">
                                {["nom", "email", "numero", "role"].map(
                                    (field) => (
                                        <li key={field} className="break-words">
                                            <strong>
                                                {field.charAt(0).toUpperCase() +
                                                    field.slice(1)}{" "}
                                                :
                                            </strong>{" "}
                                            {authUser[field]}
                                        </li>
                                    )
                                )}
                            </ul>
                        </div>
                        <div>
                            {authUser.role === "commercant" && (
                                <ul className="space-y-2 text-gray-700">
                                    <li className="break-words">
                                        <strong>Nom boutique :</strong>{" "}
                                        {authUser.nom_boutique || "N/A"}
                                    </li>
                                    <li className="break-words">
                                        <strong>Adresse boutique :</strong>{" "}
                                        {authUser.adresse_boutique?.rue
                                            ? `${authUser.adresse_boutique.rue}, ${authUser.adresse_boutique.ville}`
                                            : "N/A"}
                                    </li>
                                </ul>
                            )}
                            {authUser.role === "livreur" && (
                                <ul className="space-y-2 text-gray-700">
                                    <li className="break-words">
                                        <strong>Véhicule :</strong>{" "}
                                        {authUser.vehicule?.type || "N/A"}
                                    </li>
                                    <li className="break-words">
                                        <strong>Plaque :</strong>{" "}
                                        {authUser.vehicule?.plaque || "N/A"}
                                    </li>
                                    <li className="break-words">
                                        <strong>Disponibilité :</strong>{" "}
                                        {authUser.disponibilite ? "Oui" : "Non"}
                                    </li>
                                    <li className="break-words">
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
                                                        <li
                                                            key={index}
                                                            className="break-words"
                                                        >
                                                            {adresse.rue},{" "}
                                                            {adresse.ville}{" "}
                                                            {
                                                                adresse.code_postal
                                                            }
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

function FormField({ label, name, value, onChange, type, pattern }) {
    return (
        <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
                {label}
            </label>
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                pattern={pattern}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
            />
        </div>
    );
}


FormField.propTypes = {
    label: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    onChange: PropTypes.func.isRequired,
    type: PropTypes.string,
    pattern: PropTypes.string,
};


FormField.defaultProps = {
    type: "text",
    pattern: null,
};

export default ProfilePage;
