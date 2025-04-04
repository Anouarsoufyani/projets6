"use client";

import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useAuthUserQuery } from "../../Hooks/useAuthQueries";
import toast from "react-hot-toast";

const fakeClients = [
    {
        id: "C001",
        nom: "Anouar Soufyani",
        email: "anouar@email.com",
        statut: "actif",
    },
    {
        id: "C002",
        nom: "Rayan Hasnaoui-Mounir",
        email: "rayan@email.com",
        statut: "inactif",
    },
    {
        id: "C003",
        nom: "Fahed Zakaria",
        email: "fahed@email.com",
        statut: "actif",
    },
];

const GestionClientPage = () => {
    const { data: authUser, isLoading } = useAuthUserQuery();

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
        <main className="w-full min-h-full bg-gray-100 p-6">
            <h1 className="text-2xl font-bold text-emerald-700 mb-6">
                Gestion Clients
            </h1>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-emerald-100 to-emerald-200">
                    <h2 className="text-lg font-semibold text-emerald-800">
                        Liste des clients ({fakeClients.length})
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="py-3 px-4 text-sm font-semibold text-gray-700">
                                    ID
                                </th>
                                <th className="py-3 px-4 text-sm font-semibold text-gray-700">
                                    Nom
                                </th>
                                <th className="py-3 px-4 text-sm font-semibold text-gray-700">
                                    Email
                                </th>
                                <th className="py-3 px-4 text-sm font-semibold text-gray-700">
                                    Statut
                                </th>
                                <th className="py-3 px-4 text-sm font-semibold text-gray-700">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {fakeClients.map((client) => (
                                <tr
                                    key={client.id}
                                    className="hover:bg-gray-50 transition-colors"
                                >
                                    <td className="py-3 px-4">{client.id}</td>
                                    <td className="py-3 px-4">{client.nom}</td>
                                    <td className="py-3 px-4">
                                        {client.email}
                                    </td>
                                    <td className="py-3 px-4">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                client.statut === "actif"
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-red-100 text-red-800"
                                            }`}
                                        >
                                            {client.statut}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 flex gap-2">
                                        <button className="text-blue-600 hover:text-blue-800 transition-colors">
                                            Voir
                                        </button>
                                        <button className="text-amber-600 hover:text-amber-800 transition-colors">
                                            Modifier
                                        </button>
                                        <button className="text-red-600 hover:text-red-800 transition-colors">
                                            Supprimer
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
};

export default GestionClientPage;
