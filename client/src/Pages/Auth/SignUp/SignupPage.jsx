"use client";

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { FaUser, FaEnvelope, FaPhone, FaLock, FaUserTie } from "react-icons/fa";
import { useSignup } from "../../../Hooks"; 
import toast from "react-hot-toast";

const SignupPage = () => {
    const navigate = useNavigate(); 
    const [role, setRole] = useState(null);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const roleParam = urlParams.get("role");
        setRole(roleParam);
    }, []);

    const [formData, setFormData] = useState({
        email: "",
        nom: "",
        password: "",
        numero: "",
        role: "client",
    });

    const { mutate: signupMutation, isPending } = useSignup();

    const handleSubmit = (e) => {
        console.log(formData);

        e.preventDefault();
        if (
            !formData.email ||
            !formData.nom ||
            !formData.password ||
            !formData.numero ||
            !formData.role
        ) {
            toast.error("Please fill in all fields");
        } else {
            signupMutation(
                {
                    email: formData.email,
                    nom: formData.nom,
                    password: formData.password,
                    numero: formData.numero,
                    role: formData.role,
                },
                {
                    onSuccess: () => {
                        setFormData({
                            email: "",
                            nom: "",
                            password: "",
                            numero: "",
                            role: "client",
                        });

                        navigate("/login");
                    },
                }
            );
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <main className="flex justify-center items-center w-full min-h-screen px-4 py-8 bg-gray-100">
            <div className="flex flex-col gap-6 justify-center items-center w-full max-w-lg mx-auto bg-white p-4 sm:p-8 rounded-xl shadow-2xl">
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
                            <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black" />
                            <input
                                type="text"
                                placeholder="Votre nom complet"
                                name="nom"
                                className="pl-10 w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                onChange={handleInputChange}
                                value={formData.nom}
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700">
                            Adresse email
                        </label>
                        <div className="relative">
                            <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black" />
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
                            <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black" />
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
                            <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black" />
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
                            <FaUserTie className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black" />
                            <select
                                name="role"
                                className="pl-10 w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                onChange={handleInputChange}
                                value={role ? role : formData.role}
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
