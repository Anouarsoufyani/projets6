/* eslint-disable no-unused-vars */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useState } from "react";
import { Link } from "react-router";

const LoginPage = () => {
    const [formData, setFormData] = useState({
        username: "",
        password: "",
    });

    const queryClient = useQueryClient();

    const {
        mutate: loginMutation,
        isError,
        isPending,
        error,
    } = useMutation({
        mutationFn: async ({ username, password }) => {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
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
                username: "",
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
        if (!formData.username || !formData.password) {
            toast.error("Please fill in all fields");
        } else {
            loginMutation({
                username: formData.username,
                password: formData.password,
            });
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    return (
        <>
            <main className="flex justify-center items-center w-full h-[95vh]">
                <div className="flex flex-col gap-4 justify-center items-center w-1/3 h-1/2 border p-4 rounded-md shadow-lg">
                    <form
                        className="flex items-center justify-center gap-5 flex-col w-full h-1/2"
                        onSubmit={handleSubmit}
                    >
                        <div className="flex flex-col items-start gap-2 w-1/2">
                            <h1 className=" text-4xl font-extrabold">
                                Connexion
                            </h1>
                        </div>
                        <label className="flex flex-col items-start w-1/2 input input-bordered rounded flex items-center gap-2">
                            Adresse email
                            <input
                                type="email"
                                placeholder="email adress"
                                name="email"
                                className="border border-black w-full rounded-md p-2"
                                onChange={handleInputChange}
                                value={formData.username}
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
                        <button className="btn rounded-md p-2 cursor-pointer btn-primary border w-1/2 hover:bg-slate-950 hover:text-white transition-all">
                            {isPending ? (
                                <span className="loading loading-spinner loading-md"></span>
                            ) : (
                                "Se connecter"
                            )}
                        </button>
                        {/* {isError && <p className='text-red-500'>Something went wrong</p>} */}
                    </form>
                    <div className="flex flex-col gap-2 mt-4">
                        <p className="text-lg">
                            {"Don't have an account ? "}
                            <Link to="/signup">
                                <span className="font-bold cursor-pointer text-emerald-600">
                                    S'inscrire
                                </span>
                            </Link>
                        </p>
                    </div>
                </div>
            </main>
        </>
    );
};
export default LoginPage;
