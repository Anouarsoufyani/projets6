"use client"

import { useState, useEffect } from "react"
import PropTypes from "prop-types"
import { useAuthUserQuery } from "../../Hooks/useAuthQueries"
import useUpdateProfile from "../../Hooks/useUpdateProfile"
import toast from "react-hot-toast"

// Initial form structure with empty values
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
  adresses_favorites: [{ nom: "", rue: "", ville: "", code_postal: "", lat: "", lng: "" }],
}

const ProfilePage = () => {
  const [edit, setEdit] = useState(false)
  const { data: authUser, isLoading } = useAuthUserQuery()
  const { updateProfile, isUpdatingProfile } = useUpdateProfile()
  const [formData, setFormData] = useState(initialForm)

  // Initialize form data when user data is available
  useEffect(() => {
    if (authUser) {
      setFormData({
        ...initialForm,
        ...authUser,
        currentPassword: "",
        newPassword: "",
        adresses_favorites:
          authUser.adresses_favorites?.length > 0 ? authUser.adresses_favorites : initialForm.adresses_favorites,
      })
    }
  }, [authUser])

  // Form change handlers
  const handleChange = (e, field = null, subField = null, index = null) => {
    const { name, value, type, checked } = e.target

    if (field && subField) {
      // Handle nested object changes
      setFormData((prev) => ({
        ...prev,
        [field]: { ...prev[field], [subField]: value },
      }))
    } else if (field && index !== null) {
      // Handle array of objects changes
      const newArray = [...formData[field]]
      newArray[index][name] = value
      setFormData((prev) => ({ ...prev, [field]: newArray }))
    } else {
      // Handle direct field changes
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (formData.newPassword && !formData.currentPassword) {
      toast.error("Veuillez entrer votre mot de passe actuel pour en définir un nouveau")
      return
    }
    updateProfile(formData)
    setEdit(false)
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"></div>
  }

  if (!authUser) {
    return <div className="text-center text-red-600">Erreur : Utilisateur non trouvé</div>
  }

  return (
    <main className="w-full min-h-full bg-gray-100 p-6">
      <h1 className="text-2xl font-bold text-emerald-700 mb-6">Profil</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-6">
            <img
              src={authUser.profilePic || "https://placehold.co/100x100"}
              alt="Profil"
              className="w-20 h-20 rounded-full object-cover"
            />
            <div>
              <p className="text-2xl font-bold text-emerald-700">{authUser.nom}</p>
              <p className="text-gray-600 capitalize">{authUser.role}</p>
            </div>
          </div>
          <button
            onClick={() => setEdit(!edit)}
            className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition"
          >
            {edit ? "Annuler" : "Modifier le profil"}
          </button>
        </div>

        {edit ? (
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
            {/* Common fields */}
            <FormField label="Nom" name="nom" value={formData.nom} onChange={handleChange} />
            <FormField label="Email" name="email" type="email" value={formData.email} onChange={handleChange} />
            <FormField
              label="Numéro"
              name="numero"
              type="tel"
              value={formData.numero}
              onChange={handleChange}
              pattern="^0[1-9](\s?\d{2}){4}$"
            />

            {/* Role-specific fields */}
            {authUser.role === "commercant" && (
              <>
                <FormField
                  label="Nom de la boutique"
                  name="nom_boutique"
                  value={formData.nom_boutique}
                  onChange={handleChange}
                />
                <div className="col-span-2">
                  <label className="block mb-1 text-sm font-medium text-gray-700">Adresse de la boutique</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["rue", "ville", "code_postal", "lat", "lng"].map((field) => (
                      <input
                        key={field}
                        type={field === "lat" || field === "lng" ? "number" : "text"}
                        name={field}
                        placeholder={field.charAt(0).toUpperCase() + field.slice(1).replace("_", " ")}
                        value={formData.adresse_boutique[field]}
                        onChange={(e) => handleChange(e, "adresse_boutique", field)}
                        className="p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            {authUser.role === "livreur" && (
              <>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Type de véhicule</label>
                  <select
                    name="type"
                    value={formData.vehicule.type}
                    onChange={(e) => handleChange(e, "vehicule", "type")}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Sélectionner</option>
                    {["voiture", "moto", "vélo"].map((type) => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {["plaque", "couleur"].map((field) => (
                  <FormField
                    key={field}
                    label={field.charAt(0).toUpperCase() + field.slice(1)}
                    name={field}
                    value={formData.vehicule[field]}
                    onChange={(e) => handleChange(e, "vehicule", field)}
                  />
                ))}

                <FormField
                  label="Capacité"
                  name="capacite"
                  type="number"
                  value={formData.vehicule.capacite}
                  onChange={(e) => handleChange(e, "vehicule", "capacite")}
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
                  <label className="text-sm font-medium text-gray-700">Disponible</label>
                </div>
              </>
            )}

            {authUser.role === "client" && (
              <div className="col-span-2">
                <label className="block mb-1 text-sm font-medium text-gray-700">Adresses favorites</label>
                {formData.adresses_favorites.map((adresse, index) => (
                  <div key={index} className="grid grid-cols-3 gap-2 mb-2">
                    {["nom", "rue", "ville", "code_postal", "lat", "lng"].map((field) => (
                      <input
                        key={field}
                        type={field === "lat" || field === "lng" ? "number" : "text"}
                        placeholder={field.charAt(0).toUpperCase() + field.slice(1).replace("_", " ")}
                        value={adresse[field]}
                        name={field}
                        onChange={(e) => handleChange(e, "adresses_favorites", null, index)}
                        className="p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    ))}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
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
                    })
                  }
                  className="text-emerald-600 hover:underline"
                >
                  + Ajouter une adresse
                </button>
              </div>
            )}

            {/* Password fields */}
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

            {/* Submit button */}
            <div className="col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-600 transition disabled:bg-emerald-300"
              >
                {isUpdatingProfile ? "Mise à jour..." : "Mettre à jour"}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xl font-bold text-emerald-700 mb-4">Informations</p>
              <ul className="space-y-2 text-gray-700">
                {["nom", "email", "numero", "role"].map((field) => (
                  <li key={field}>
                    <strong>{field.charAt(0).toUpperCase() + field.slice(1)} :</strong> {authUser[field]}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              {authUser.role === "commercant" && (
                <ul className="space-y-2 text-gray-700">
                  <li>
                    <strong>Nom boutique :</strong> {authUser.nom_boutique || "N/A"}
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
                    <strong>Véhicule :</strong> {authUser.vehicule?.type || "N/A"}
                  </li>
                  <li>
                    <strong>Plaque :</strong> {authUser.vehicule?.plaque || "N/A"}
                  </li>
                  <li>
                    <strong>Disponibilité :</strong> {authUser.disponibilite ? "Oui" : "Non"}
                  </li>
                  <li>
                    <strong>Distance max :</strong> {authUser.distance_max} km
                  </li>
                </ul>
              )}
              {authUser.role === "client" && (
                <ul className="space-y-2 text-gray-700">
                  <li>
                    <strong>Adresses favorites :</strong>
                    {authUser.adresses_favorites?.length > 0 ? (
                      <ul className="ml-4 list-disc">
                        {authUser.adresses_favorites.map((adresse, index) => (
                          <li key={index}>
                            {adresse.nom} - {adresse.rue}, {adresse.ville}
                          </li>
                        ))}
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
  )
}

// Reusable form field component with PropTypes validation
function FormField({ label, name, value, onChange, type, pattern }) {
  return (
    <div>
      <label className="block mb-1 text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        pattern={pattern}
        className="w-full p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
      />
    </div>
  )
}

// PropTypes validation
FormField.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onChange: PropTypes.func.isRequired,
  type: PropTypes.string,
  pattern: PropTypes.string,
}

// Default props
FormField.defaultProps = {
  type: "text",
  pattern: null,
}

export default ProfilePage
