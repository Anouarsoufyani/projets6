"use client";

import { useParams, Navigate } from "react-router";
import { useAuthUserQuery } from "../../Hooks"; // adapte selon ton projet
import { useEffect, useState } from "react";

const ViewDocs = () => {
    const { id, filename } = useParams();
    const { data: authUser, isLoading } = useAuthUserQuery();

    const [url, setUrl] = useState("");

    useEffect(() => {
        if (id && filename) {
            const fileUrl = `http://localhost:5001/uploads/${id}/${filename}`;
            setUrl(fileUrl);
        }
    }, [id, filename]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <span>Chargement...</span>
            </div>
        );
    }

    // 🚫 Protection ici
    if (!authUser || (authUser.role !== "admin" && authUser._id !== id)) {
        return <Navigate to="/login" />;
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
            <h1 className="text-xl font-bold text-emerald-600 mb-4">
                Visualisation du document
            </h1>
            <div className="w-full max-w-5xl h-[80vh] border rounded shadow bg-white">
                {url ? (
                    <iframe
                        src={url}
                        title="Document"
                        className="w-full h-full"
                    />
                ) : (
                    <p>Chargement du document...</p>
                )}
            </div>
        </div>
    );
};

export default ViewDocs;
