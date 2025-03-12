import { useState, useEffect } from "react";
import { useAuthUserQuery } from "../../Hooks/useAuthQueries";
import useUpdateProfile from "../../Hooks/useUpdateProfile";

const DashboardPage = () => {
    const [edit, setEdit] = useState(false);
    const { data: authUser } = useAuthUserQuery();
    const [formData, setFormData] = useState({
        nom: "",
        email: "",
        numero: "",
        nom_boutique: "",
        adresse_boutique: "",
        newPassword: "",
        currentPassword: "",
    });

    const { updateProfile, isUpdatingProfile } = useUpdateProfile();

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    useEffect(() => {
        if (authUser) {
            setFormData({
                nom: authUser.nom,
                email: authUser.email,
                numero: authUser.numero,
                nom_boutique: authUser.nom_boutique,
                adresse_boutique: authUser.adresse_boutique,
                newPassword: "",
                currentPassword: "",
            });
        }
    }, [authUser]);

    return (
        <div>
            {" "}
            {/* Ajout de marge gauche égale à la largeur de la sidebar (w-72) */}
            <main className="w-full h-screen bg-gray-100 p-6">
                <h1 className="text-2xl font-bold text-emerald-700 mb-6">
                    Profil
                </h1>
                <div className="w-full h-9/10">
                    <div className="flex justify-between items-center w-full p-6">
                        <div className="flex gap-10 items-center w-1/2">
                            <img src="https://fakeimg.pl/100x100/" />
                            <p className="text-3xl font-bold text-emerald-700">
                                {authUser.nom}
                            </p>
                        </div>
                        <div>
                            <button
                                className="text-center bg-emerald-200 p-3 rounded-4xl transition hover:bg-emerald-300"
                                onClick={() => {
                                    setEdit(!edit);
                                    console.log(edit);
                                }}
                            >
                                Edit Profile
                            </button>
                        </div>
                    </div>
                    <div className="w-1/2 h-1/2 p-6">
                        {edit == true ? (
                            <>
                                <form
                                    className="flex flex-col gap-4"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        updateProfile();
                                    }}
                                >
                                    <div className="flex flex-wrap gap-2">
                                        <input
                                            type="text"
                                            placeholder="Nom"
                                            className="flex-1 input border border-gray-700 rounded p-2 input-md"
                                            value={formData.nom}
                                            name="nom"
                                            onChange={handleInputChange}
                                        />
                                        <input
                                            type="text"
                                            placeholder="email"
                                            className="flex-1 input border border-gray-700 rounded p-2 input-md"
                                            value={formData.email}
                                            name="email"
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <input
                                            type="tel"
                                            placeholder="numero"
                                            pattern="^0[1-9](\s?\d{2}){4}$"
                                            className="flex-1 input border border-gray-700 rounded p-2 input-md"
                                            value={formData.numero}
                                            name="numero"
                                            onChange={handleInputChange}
                                        />
                                        <textarea
                                            placeholder="nom_boutique"
                                            className="flex-1 input border border-gray-700 rounded p-2 input-md"
                                            value={formData.nom_boutique}
                                            name="nom_boutique"
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <input
                                            type="password"
                                            placeholder="Current Password"
                                            className="flex-1 input border border-gray-700 rounded p-2 input-md"
                                            value={formData.currentPassword}
                                            name="currentPassword"
                                            onChange={handleInputChange}
                                        />
                                        <input
                                            type="password"
                                            placeholder="New Password"
                                            className="flex-1 input border border-gray-700 rounded p-2 input-md"
                                            value={formData.newPassword}
                                            name="newPassword"
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="adresse_boutique"
                                        className="flex-1 input border border-gray-700 rounded p-2 input-md"
                                        value={formData.adresse_boutique}
                                        name="adresse_boutique"
                                        onChange={handleInputChange}
                                    />
                                    <button
                                        className="btn btn-primary rounded-full btn-sm text-white"
                                        onClick={() => {
                                            updateProfile(formData);
                                            document
                                                .getElementById(
                                                    "edit_profile_modal"
                                                )
                                                .close();
                                        }}
                                    >
                                        {isUpdatingProfile
                                            ? "Updating..."
                                            : "Update"}
                                    </button>
                                </form>
                            </>
                        ) : (
                            <>
                                <p className="text-xl font-bold text-emerald-700 mb-6">
                                    Informations :
                                </p>
                                <ul className="flex flex-col gap-3">
                                    {Object.entries(authUser).map(
                                        ([key, value]) =>
                                            [
                                                "email",
                                                "numero",
                                                "role",
                                                "nom_boutique",
                                            ].includes(key) && (
                                                <li
                                                    key={key}
                                                    className="text-lg font-medium text-gray-700"
                                                >
                                                    {`${key
                                                        .charAt(0)
                                                        .toUpperCase()}${key.slice(
                                                        1
                                                    )}`}{" "}
                                                    : {value}
                                                </li>
                                            )
                                    )}
                                </ul>
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DashboardPage;
