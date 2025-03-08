/* eslint-disable no-unused-vars */
import { Link } from "react-router";
import { useState } from "react";

import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
// import { set } from "mongoose";

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

            console.log("formdata ", email, name, password, numero, userType);

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Something went wrong");
            }

            // if (data.error) {
            //     throw new Error(data.error);
            // }
            console.log("formdata ", formData);
            console.log(data);
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
        e.preventDefault(); // Prevent the form from reloading the page
        signupMutation({
            email: formData.email,
            name: formData.name,
            password: formData.password,
            numero: formData.numero,
            userType: formData.userType,
        });
    };

    const handleInputChange = (e) => {
        console.log(e.target.value);

        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <main className="flex justify-center items-center w-full h-[95vh]">
            <div className="flex flex-col gap-4 justify-center items-center w-1/2 h-[80%] border p-4 rounded-md shadow-lg">
                <form
                    className="flex items-center justify-center gap-5 flex-col w-full h-[60%]"
                    onSubmit={handleSubmit}
                >
                    <div className="flex flex-col items-start gap-2 w-1/2">
                        <h1 className=" text-4xl font-extrabold">
                            Inscription
                        </h1>
                    </div>
                    <label className="flex flex-col items-start w-1/2 input input-bordered rounded flex items-center gap-2">
                        Nom
                        <input
                            type="text"
                            placeholder="Nom complet"
                            name="name"
                            className="border border-black w-full rounded-md p-2"
                            onChange={handleInputChange}
                            value={formData.name}
                        />
                    </label>
                    <label className="flex flex-col items-start w-1/2 input input-bordered rounded flex items-center gap-2">
                        Adresse email
                        <input
                            type="email"
                            placeholder="adresse email"
                            name="email"
                            className="border border-black w-full rounded-md p-2"
                            onChange={handleInputChange}
                            value={formData.email}
                        />
                    </label>
                    <label className="flex flex-col items-start w-1/2 input input-bordered rounded flex items-center gap-2">
                        Numero de telephone
                        <input
                            type="tel"
                            placeholder="Numero de telephone"
                            name="numero"
                            pattern="^0[1-9](\s?\d{2}){4}$"
                            className="border border-black w-full rounded-md p-2"
                            onChange={handleInputChange}
                            value={formData.numero}
                        />
                    </label>

                    <label className="flex flex-col items-start w-1/2 input input-bordered rounded flex items-center gap-2">
                        Mot de passe
                        <input
                            type="password"
                            placeholder="Password"
                            name="password"
                            className="border border-black w-full rounded-md p-2"
                            onChange={handleInputChange}
                            value={formData.password}
                        />
                    </label>
                    <label className="flex flex-col items-start w-1/2 input input-bordered rounded flex items-center gap-2">
                        Je suis
                        <select
                            name="userType"
                            className="border border-black w-full rounded-md p-2"
                            onChange={handleInputChange}
                            value={formData.userType}
                        >
                            <option value="">Sélectionnez une option</option>
                            <option value="livreur">Livreur</option>
                            <option value="client">Client</option>
                            <option value="commercant">Commerçant</option>
                        </select>
                    </label>
                    <button className="btn rounded-md p-2 cursor-pointer btn-primary border w-1/2 hover:bg-slate-950 hover:text-white transition-all">
                        {isPending ? (
                            <span className="loading loading-spinner loading-md"></span>
                        ) : (
                            "S'inscrire"
                        )}
                    </button>
                    {/* {isError && <p className='text-red-500'>Something went wrong</p>} */}
                </form>
                <div className="flex flex-col gap-2 mt-4">
                    <p className="text-lg">
                        {"I already have an account ? "}
                        <Link to="/login">
                            <span className="font-bold cursor-pointer text-emerald-600">
                                Se connecter
                            </span>
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
};
export default SignupPage;
