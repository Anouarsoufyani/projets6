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
        <main className="w-full h-full bg-gray-100 p-6">
            <h1 className="text-2xl font-bold text-emerald-700 mb-6">Profil</h1>
            <div className="w-full h-9/10">
                <div className="flex justify-between items-center w-full p-6">
                    <div className="flex gap-10 items-center w-1/2">
                        <img
                            className="rounded-full"
                            src="https://placehold.co/100x100"
                        />
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
                                className="grid grid-cols-2 gap-4"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    updateProfile(formData);
                                }}
                            >
                                <div className="col-span-2">
                                    <label
                                        htmlFor="nom"
                                        className="block mb-2 text-sm font-medium text-black "
                                    >
                                        Nom
                                    </label>
                                    <input
                                        type="text"
                                        id="nom"
                                        placeholder="Nom"
                                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                                        value={formData.nom}
                                        name="nom"
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label
                                        htmlFor="numero"
                                        className="block mb-2 text-sm font-medium text-black "
                                    >
                                        Numero
                                    </label>
                                    <input
                                        type="tel"
                                        id="numero"
                                        placeholder="Numero"
                                        pattern="^0[1-9](\s?\d{2}){4}$"
                                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                                        value={formData.numero}
                                        name="numero"
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label
                                        htmlFor="email"
                                        className="block mb-2 text-sm font-medium text-black"
                                    >
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        placeholder="Email"
                                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                                        value={formData.email}
                                        name="email"
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label
                                        htmlFor="adresse_boutique"
                                        className="block mb-2 text-sm font-medium text-black"
                                    >
                                        Adresse de la boutique
                                    </label>
                                    <input
                                        type="text"
                                        id="adresse_boutique"
                                        placeholder="Adresse de la boutique"
                                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                                        value={formData.adresse_boutique}
                                        name="adresse_boutique"
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label
                                        htmlFor="nom_boutique"
                                        className="block mb-2 text-sm font-medium text-black"
                                    >
                                        Nom de la boutique
                                    </label>
                                    <input
                                        type="text"
                                        id="nom_boutique"
                                        placeholder="Nom de la boutique"
                                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                                        value={formData.nom_boutique}
                                        name="nom_boutique"
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label
                                        htmlFor="currentPassword"
                                        className="block mb-2 text-sm font-medium text-black"
                                    >
                                        Current Password
                                    </label>
                                    <input
                                        type="password"
                                        id="currentPassword"
                                        placeholder="Current Password"
                                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                                        value={formData.currentPassword}
                                        name="currentPassword"
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label
                                        htmlFor="newPassword"
                                        className="block mb-2 text-sm font-medium text-black"
                                    >
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        id="newPassword"
                                        placeholder="New Password"
                                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                                        value={formData.newPassword}
                                        name="newPassword"
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="col-span-2"></div>
                                <div className="col-span-2 flex justify-end mt-4">
                                    <button
                                        type="submit"
                                        className="rounded-full btn-sm bg-emerald-500 p-2.5 px-5 hover:bg-emerald-300 transition ease-in-out text-black"
                                    >
                                        {isUpdatingProfile
                                            ? "Updating..."
                                            : "Update"}
                                    </button>
                                </div>
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
    );
};

export default DashboardPage;
