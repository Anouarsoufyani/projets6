"use client";

import { useState } from "react";
import { Link } from "react-router"; // Correction de l'import
import { FaEnvelope, FaLock } from "react-icons/fa";
import { useLogin } from "../../../Hooks"; // Import du hook modularisé
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const LoginPage = () => {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const queryClient = useQueryClient();
    const { mutate: loginMutation, isPending } = useLogin();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.email || !formData.password) {
            toast.error("Please fill in all fields");
        } else {
            loginMutation(
                {
                    email: formData.email,
                    password: formData.password,
                },
                {
                    onSuccess: () => {
                        setFormData({
                            email: "",
                            password: "",
                        });
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
            <div className="flex flex-col gap-6 justify-center items-center w-full max-w-md mx-auto bg-white p-4 sm:p-8 rounded-xl shadow-2xl">
                <h1 className="text-3xl font-bold text-emerald-600 mb-4">
                    Connexion
                </h1>
                <form
                    onSubmit={handleSubmit}
                    className="w-full flex flex-col gap-4"
                >
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
                    <button
                        type="submit"
                        className="w-full bg-emerald-600 text-white py-3 rounded-md hover:bg-emerald-700 transition duration-300 mt-4"
                    >
                        {isPending ? (
                            <span className="loading loading-spinner loading-md"></span>
                        ) : (
                            "Se connecter"
                        )}
                    </button>
                </form>
                <div className="mt-4 text-center">
                    <p className="text-gray-600">
                        Pas de compte ?{" "}
                        <Link
                            to="/signup"
                            className="text-emerald-600 font-semibold hover:underline"
                        >
                            S&apos;inscrire
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
};

export default LoginPage;
