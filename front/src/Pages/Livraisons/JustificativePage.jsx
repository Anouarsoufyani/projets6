"use client";

// Remplacer les imports et les mutations directes par les hooks modularisés
import { useState } from "react";
import {
    useAuthUserQuery,
    useUploadDocument,
    useUpdateUploadedDocument,
    useDeleteDocument,
    getDocumentUrl,
} from "../../Hooks";
import {
    FaBiking,
    FaCar,
    FaMotorcycle,
    FaBox,
    FaUpload,
    FaCheck,
    FaArrowRight,
    FaSpinner,
    FaTimesCircle,
    FaCheckCircle,
    FaHourglassHalf,
    FaEye,
    FaSync,
    FaFilePdf,
    FaFileImage,
    FaFile,
    FaTrash,
} from "react-icons/fa";
import toast from "react-hot-toast";

const JustificativePage = () => {
    const [selectedVehicles, setSelectedVehicles] = useState([]);
    const [step, setStep] = useState("vehicles");
    const [documents, setDocuments] = useState({});
    const [uploadProgress, setUploadProgress] = useState({});
    const { data: authUser, refetch: refetchAuthUser } = useAuthUserQuery();
    const UserDocuments = authUser?.documents || [];

    // Utilisation des hooks modularisés
    const { mutate: uploadDocument, isPending: isUploading } =
        useUploadDocument();
    const { mutate: updateDocument, isPending: isUpdating } =
        useUpdateUploadedDocument();
    const { mutate: deleteDocument, isPending: isDeleting } =
        useDeleteDocument();

    const vehicleOptions = [
        {
            name: "Vélo",
            icon: <FaBiking className="h-12 w-12" />,
            color: "bg-green-50 border-green-200 hover:bg-green-100",
        },
        {
            name: "Moto",
            icon: <FaMotorcycle className="h-12 w-12" />,
            color: "bg-blue-50 border-blue-200 hover:bg-blue-100",
        },
        {
            name: "Voiture",
            icon: <FaCar className="h-12 w-12" />,
            color: "bg-amber-50 border-amber-200 hover:bg-amber-100",
        },
        {
            name: "Autres",
            icon: <FaBox className="h-12 w-12" />,
            color: "bg-purple-50 border-purple-200 hover:bg-purple-100",
        },
    ];

    const handleVehicleChange = (vehicleName) => {
        setSelectedVehicles((prev) =>
            prev.includes(vehicleName)
                ? prev.filter((v) => v !== vehicleName)
                : [...prev, vehicleName]
        );
    };

    const handleFileChange = (e, docType) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Le fichier est trop volumineux (max 5MB)");
            return;
        }

        if (
            !["image/jpeg", "image/png", "application/pdf"].includes(file.type)
        ) {
            toast.error("Format de fichier non valide (JPEG, PNG, PDF)");
            return;
        }

        setDocuments((prev) => ({ ...prev, [docType]: file }));
        setUploadProgress((prev) => ({ ...prev, [docType]: 100 }));
    };

    const handleSubmitVehicles = () => {
        if (selectedVehicles.length === 0) {
            toast.error("Veuillez sélectionner au moins un véhicule.");
            return;
        }
        setStep("documents");
    };

    const getRequiredDocs = () => {
        const docs = ["carte d'identité", "photo de votre tête"];
        selectedVehicles.forEach((vehicle) => {
            if (vehicle === "Moto" || vehicle === "Voiture") {
                docs.push(
                    `permis ${vehicle}`,
                    `carte grise ${vehicle}`,
                    `assurance ${vehicle}`
                );
            }
        });
        return docs;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData();
        const requiredDocs = getRequiredDocs();
        let allDocsPresent = true;

        requiredDocs.forEach((doc) => {
            if (documents[doc]) {
                formData.append("documents", documents[doc]);
            } else {
                toast.error(`Veuillez ajouter le fichier pour ${doc}`);
                allDocsPresent = false;
            }
        });

        if (allDocsPresent) {
            uploadDocument(formData, {
                onSuccess: () => {
                    setTimeout(() => {
                        refetchAuthUser();
                    }, 1000);
                },
            });
        }
    };

    const getDocumentTypeLabel = (docType) => {
        return docType
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };

    const getFileIcon = (fileName) => {
        if (!fileName) return null;
        const extension = fileName.split(".").pop()?.toLowerCase();

        if (extension === "pdf") {
            return <FaFilePdf className="text-red-500 h-4 w-4" />;
        } else if (["jpg", "jpeg", "png"].includes(extension || "")) {
            return <FaFileImage className="text-blue-500 h-4 w-4" />;
        }

        return <FaFile className="text-gray-500 h-4 w-4" />;
    };

    const getFileType = (fileName) => {
        if (!fileName) return "Document";
        const extension = fileName.split(".").pop()?.toLowerCase();

        if (extension === "pdf") {
            return "PDF";
        } else if (["jpg", "jpeg", "png"].includes(extension || "")) {
            return "Image";
        }

        return "Document";
    };

    const getStatusIcon = (statut) => {
        switch (statut) {
            case "en attente":
                return <FaHourglassHalf className="text-yellow-500" />;
            case "validé":
                return <FaCheckCircle className="text-green-500" />;
            case "refusé":
                return <FaTimesCircle className="text-red-500" />;
            default:
                return <FaSpinner className="text-gray-500 animate-spin" />;
        }
    };

    const getStatusText = (statut) => {
        switch (statut) {
            case "en attente":
                return "En attente de vérification";
            case "validé":
                return "Validé";
            case "refusé":
                return "Refusé";
            default:
                return "En attente";
        }
    };

    const getStatusClass = (statut) => {
        switch (statut) {
            case "en attente":
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "validé":
                return "bg-green-100 text-green-800 border-green-200";
            case "refusé":
                return "bg-red-100 text-red-800 border-red-200";
            default:
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
        }
    };

    const handleUpdateDocument = (documentId) => {
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = "image/*,application/pdf";
        fileInput.onchange = (e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            if (file.size > 5 * 1024 * 1024) {
                toast.error("Le fichier est trop volumineux (max 5MB)");
                return;
            }

            if (
                !["image/jpeg", "image/png", "application/pdf"].includes(
                    file.type
                )
            ) {
                toast.error("Format de fichier non valide (JPEG, PNG, PDF)");
                return;
            }

            updateDocument({ documentId, file });
        };
        fileInput.click();
    };

    const handleDeleteDocument = (documentId, statut) => {
        if (statut === "approuvé") {
            toast.error("Impossible de supprimer un document approuvé");
            return;
        }

        if (
            window.confirm("Êtes-vous sûr de vouloir supprimer ce document ?")
        ) {
            deleteDocument(documentId);
        }
    };

    // Si l'utilisateur est en cours de vérification, afficher le tableau des documents
    if (authUser?.statut !== "non vérifié") {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        Statut de vos pièces justificatives
                    </h1>
                    <p className="text-gray-600">
                        Vos documents sont en cours de vérification par notre
                        équipe
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold">
                            Documents soumis
                        </h2>
                        <button
                            onClick={() => {
                                refetchAuthUser();
                                toast.success("Statut actualisé");
                            }}
                            className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                        >
                            <FaSync className="mr-1" />
                            Actualiser
                        </button>
                    </div>

                    {authUser?.statut === "vérifié" ? (
                        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <FaCheckCircle className="h-5 w-5 text-green-400" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-green-700">
                                        Félicitations! Votre compte est{" "}
                                        <span className="font-semibold">
                                            vérifié
                                        </span>
                                        . Vous pouvez maintenant accéder à
                                        toutes les fonctionnalités.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <FaHourglassHalf className="h-5 w-5 text-yellow-400" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-yellow-700">
                                        Votre compte est actuellement{" "}
                                        <span className="font-semibold">
                                            en vérification
                                        </span>
                                        . Nos équipes examinent vos documents.
                                        Vous recevrez une notification lorsque
                                        la vérification sera terminée.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {authUser?.documents && authUser.documents.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="text-left py-4 px-4 font-semibold text-gray-600 rounded-tl-lg">
                                            Document
                                        </th>
                                        <th className="text-left py-4 px-4 font-semibold text-gray-600">
                                            Type
                                        </th>
                                        <th className="text-left py-4 px-4 font-semibold text-gray-600">
                                            Statut
                                        </th>
                                        <th className="text-right py-4 px-4 font-semibold text-gray-600 rounded-tr-lg">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {UserDocuments.map((doc, index) => {
                                        const isDeleted = !doc.url;

                                        return (
                                            <tr
                                                key={doc._id}
                                                className={`hover:bg-emerald-50 transition-colors duration-150 ${
                                                    index ===
                                                    UserDocuments.length - 1
                                                        ? "rounded-b-lg"
                                                        : ""
                                                }`}
                                            >
                                                <td className="py-4 px-4 font-medium text-gray-900">
                                                    {doc.nom}
                                                </td>

                                                <td className="py-4 px-4 text-gray-500">
                                                    <div className="flex items-center">
                                                        {getFileIcon(doc.nom)}
                                                        <span className="ml-2 text-xs">
                                                            {getFileType(
                                                                doc.nom
                                                            )}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="py-4 px-4">
                                                    <div
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(
                                                            doc.statut
                                                        )}`}
                                                    >
                                                        {getStatusIcon(
                                                            doc.statut
                                                        )}
                                                        <span className="ml-1.5">
                                                            {getStatusText(
                                                                doc.statut
                                                            )}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="py-4 px-4 text-right">
                                                    {isDeleted ? (
                                                        <button
                                                            onClick={() =>
                                                                handleUpdateDocument(
                                                                    doc._id
                                                                )
                                                            }
                                                            className="text-green-600 hover:text-green-800 flex items-center justify-end ml-auto"
                                                        >
                                                            <FaUpload className="mr-1" />
                                                            <span>
                                                                Re-soumettre
                                                            </span>
                                                        </button>
                                                    ) : (
                                                        <div className="flex space-x-3 justify-end">
                                                            <button
                                                                onClick={() =>
                                                                    window.open(
                                                                        getDocumentUrl(
                                                                            doc.url
                                                                        ),
                                                                        "_blank"
                                                                    )
                                                                }
                                                                className="text-blue-600 hover:text-blue-800 flex items-center"
                                                            >
                                                                <FaEye className="mr-1" />
                                                                <span>
                                                                    Voir
                                                                </span>
                                                            </button>

                                                            <button
                                                                onClick={() =>
                                                                    handleUpdateDocument(
                                                                        doc._id
                                                                    )
                                                                }
                                                                className="text-amber-600 hover:text-amber-800 flex items-center"
                                                            >
                                                                <FaSync className="mr-1" />
                                                                <span>
                                                                    Modifier
                                                                </span>
                                                            </button>

                                                            {doc.statut !==
                                                                "validé" && (
                                                                <button
                                                                    onClick={() =>
                                                                        handleDeleteDocument(
                                                                            doc._id,
                                                                            doc.statut
                                                                        )
                                                                    }
                                                                    className="text-red-600 hover:text-red-800 flex items-center"
                                                                >
                                                                    <FaTrash className="mr-1" />
                                                                    <span>
                                                                        Supprimer
                                                                    </span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <FaSpinner className="animate-spin h-8 w-8 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">
                                Chargement des documents...
                            </p>
                        </div>
                    )}

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={() =>
                                (window.location.href = "/dashboard")
                            }
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                            Aller au tableau de bord
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Sinon, afficher le formulaire normal avec les étapes
    return (
        <div className="max-w-4xl mx-auto p-6 ">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    Soumettre vos pièces justificatives
                </h1>
                <p className="text-gray-600">
                    Veuillez compléter les informations ci-dessous pour
                    finaliser votre inscription
                </p>
            </div>

            <div className="mb-6">
                <div className="flex items-center mb-2">
                    <div
                        className={`rounded-full w-8 h-8 flex items-center justify-center ${
                            step === "vehicles"
                                ? "bg-green-500 text-white"
                                : "bg-green-100 text-green-800"
                        } mr-2`}
                    >
                        1
                    </div>
                    <div className="h-1 w-12 bg-gray-200"></div>
                    <div
                        className={`rounded-full w-8 h-8 flex items-center justify-center ${
                            step === "documents"
                                ? "bg-green-500 text-white"
                                : "bg-gray-200 text-gray-500"
                        } mx-2`}
                    >
                        2
                    </div>
                </div>
                <div className="flex text-sm">
                    <div className="w-8 text-center mr-2">Véhicules</div>
                    <div className="w-12"></div>
                    <div className="w-8 text-center mx-2">Documents</div>
                </div>
            </div>

            {step === "vehicles" ? (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-6">
                        Quel(s) véhicule(s) utilisez-vous ?
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Sélectionnez tous les véhicules que vous utiliserez pour
                        vos livraisons
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {vehicleOptions.map((vehicle) => (
                            <div
                                key={vehicle.name}
                                className={`cursor-pointer border-2 rounded-lg transition-all duration-200 relative ${
                                    selectedVehicles.includes(vehicle.name)
                                        ? "border-green-500 ring-2 ring-green-200"
                                        : "border-gray-200"
                                } ${vehicle.color}`}
                                onClick={() =>
                                    handleVehicleChange(vehicle.name)
                                }
                            >
                                <div className="p-6 flex flex-col items-center justify-center">
                                    <div className="mb-4">{vehicle.icon}</div>
                                    <p className="font-medium text-lg">
                                        {vehicle.name}
                                    </p>
                                    {selectedVehicles.includes(
                                        vehicle.name
                                    ) && (
                                        <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                                            <FaCheck className="h-4 w-4" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={handleSubmitVehicles}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center transition-colors duration-200"
                        >
                            Continuer
                            <FaArrowRight className="ml-2 h-4 w-4" />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-6">
                        Télécharger vos pièces justificatives
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Veuillez fournir les documents suivants pour valider
                        votre compte. Formats acceptés: JPEG, PNG, PDF (max 5MB)
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {getRequiredDocs().map((doc) => (
                                <div key={doc} className="relative">
                                    <div
                                        className={`border-2 rounded-lg p-4 ${
                                            documents[doc]
                                                ? "border-green-500 bg-green-50"
                                                : "border-dashed border-gray-300"
                                        }`}
                                    >
                                        <label className="block mb-2 font-medium text-gray-700">
                                            {getDocumentTypeLabel(doc)}
                                        </label>

                                        <input
                                            type="file"
                                            accept="image/*,application/pdf"
                                            onChange={(e) =>
                                                handleFileChange(e, doc)
                                            }
                                            className="hidden"
                                            id={`file-input-${doc}`}
                                        />

                                        {!documents[doc] ? (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    document
                                                        .getElementById(
                                                            `file-input-${doc}`
                                                        )
                                                        ?.click()
                                                }
                                                className="w-full py-8 border border-gray-300 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                                            >
                                                <FaUpload className="h-6 w-6 text-gray-500" />
                                                <span className="text-sm text-gray-500">
                                                    Cliquez pour sélectionner
                                                </span>
                                            </button>
                                        ) : (
                                            <div className="flex items-center justify-between bg-white p-3 rounded border">
                                                <div className="flex items-center">
                                                    {getFileIcon(
                                                        documents[doc].name
                                                    )}
                                                    <span className="ml-2 text-sm truncate max-w-[180px]">
                                                        {documents[doc].name}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        document
                                                            .getElementById(
                                                                `file-input-${doc}`
                                                            )
                                                            ?.click()
                                                    }
                                                    className="text-xs text-gray-600 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100"
                                                >
                                                    Modifier
                                                </button>
                                            </div>
                                        )}

                                        {uploadProgress[doc] && (
                                            <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                                                <div
                                                    className="bg-green-500 h-1 rounded-full"
                                                    style={{
                                                        width: `${uploadProgress[doc]}%`,
                                                    }}
                                                ></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-between pt-4">
                            <button
                                type="button"
                                onClick={() => setStep("vehicles")}
                                className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                                Retour
                            </button>

                            <button
                                type="submit"
                                className={`bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors ${
                                    isUploading
                                        ? "opacity-70 cursor-not-allowed"
                                        : ""
                                }`}
                                disabled={isUploading}
                            >
                                {isUploading
                                    ? "Envoi en cours..."
                                    : "Soumettre les documents"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default JustificativePage;
