import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useState } from "react";
import { Link } from "react-router"; // Correction de "react-router" à "react-router-dom"
import { FaEnvelope, FaLock } from "react-icons/fa";

const LoginPage = () => {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const queryClient = useQueryClient();

    const {
        mutate: loginMutation,
        isError,
        isPending,
        error,
    } = useMutation({
        mutationFn: async ({ email, password }) => {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Something went wrong");
            }

            return data;
        },
        onSuccess: () => {
            toast.success("Login successful");
            setFormData({
                email: "",
                password: "",
            });
            queryClient.invalidateQueries({ queryKey: ["authUser"] });
        },
        onError: (error) => {
            console.log(error);
            toast.error(error.message);
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.email || !formData.password) {
            toast.error("Please fill in all fields");
        } else {
            loginMutation({
                email: formData.email,
                password: formData.password,
            });
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <main className="flex justify-center items-center w-full h-[95vh] bg-gray-100">
            <div className="flex flex-col gap-6 justify-center items-center w-1/3 bg-white p-8 rounded-xl shadow-2xl">
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
                                name="email" // Aligné avec formData.username
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
                {isError && (
                    <p className="text-red-500 mt-2">{error.message}</p>
                )}
                <div className="mt-4 text-center">
                    <p className="text-gray-600">
                        Pas de compte ?{" "}
                        <Link
                            to="/signup"
                            className="text-emerald-600 font-semibold hover:underline"
                        >
                            S'inscrire
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
};

export default LoginPage;
