import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useState } from "react";
import { Link } from "react-router"; // Correction de "react-router" à "react-router-dom"
import { FaUser, FaEnvelope, FaPhone, FaLock, FaUserTie } from "react-icons/fa";

const SignupPage = () => {
    const [formData, setFormData] = useState({
        email: "",
        name: "",
        password: "",
        numero: "",
        userType: "user",
    });

    const {
        mutate: signupMutation,
        isError,
        isPending,
        error,
    } = useMutation({
        mutationFn: async ({ email, name, password, numero, userType }) => {
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    name,
                    password,
                    numero,
                    userType,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Something went wrong");
            }

            return data;
        },
        onSuccess: () => {
            toast.success("Account created successfully");
            setFormData({
                email: "",
                name: "",
                password: "",
                numero: "",
                userType: "user",
            });
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (
            !formData.email ||
            !formData.name ||
            !formData.password ||
            !formData.numero ||
            !formData.userType
        ) {
            toast.error("Please fill in all fields");
        } else {
            signupMutation({
                email: formData.email,
                name: formData.name,
                password: formData.password,
                numero: formData.numero,
                userType: formData.userType,
            });
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <main className="flex justify-center items-center w-full h-[95vh] bg-gray-100">
            <div className="flex flex-col gap-6 justify-center items-center w-1/2 bg-white p-8 rounded-xl shadow-2xl">
                <h1 className="text-3xl font-bold text-emerald-600 mb-4">
                    Inscription
                </h1>
                <form
                    onSubmit={handleSubmit}
                    className="w-full flex flex-col gap-4"
                >
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700">
                            Nom complet
                        </label>
                        <div className="relative">
                            <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Votre nom complet"
                                name="name"
                                className="pl-10 w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                onChange={handleInputChange}
                                value={formData.name}
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700">
                            Adresse email
                        </label>
                        <div className="relative">
                            <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="email"
                                placeholder="Votre email"
                                name="email"
                                className="pl-10 w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                onChange={handleInputChange}
                                value={formData.email}
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700">
                            Numéro de téléphone
                        </label>
                        <div className="relative">
                            <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="tel"
                                placeholder="Votre numéro de téléphone"
                                name="numero"
                                pattern="^0[1-9](\s?\d{2}){4}$"
                                className="pl-10 w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                onChange={handleInputChange}
                                value={formData.numero}
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700">
                            Mot de passe
                        </label>
                        <div className="relative">
                            <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="password"
                                placeholder="Votre mot de passe"
                                name="password"
                                className="pl-10 w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                onChange={handleInputChange}
                                value={formData.password}
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700">
                            Je suis
                        </label>
                        <div className="relative">
                            <FaUserTie className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <select
                                name="userType"
                                className="pl-10 w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                onChange={handleInputChange}
                                value={formData.userType}
                            >
                                <option value="">
                                    Sélectionnez une option
                                </option>
                                <option value="livreur">Livreur</option>
                                <option value="client">Client</option>
                                <option value="commercant">Commerçant</option>
                            </select>
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-emerald-600 text-white py-3 rounded-md hover:bg-emerald-700 transition duration-300 mt-4"
                    >
                        {isPending ? (
                            <span className="loading loading-spinner loading-md"></span>
                        ) : (
                            "S'inscrire"
                        )}
                    </button>
                </form>
                {isError && (
                    <p className="text-red-500 mt-2">{error.message}</p>
                )}
                <div className="mt-4 text-center">
                    <p className="text-gray-600">
                        Vous avez déjà un compte ?{" "}
                        <Link
                            to="/login"
                            className="text-emerald-600 font-semibold hover:underline"
                        >
                            Se connecter
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
};

export default SignupPage;
