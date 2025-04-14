"use client";

import { useState, useEffect } from "react";
import { FaStar } from "react-icons/fa";
import PropTypes from "prop-types";
import { useSubmitReview } from "../../Hooks/mutations/useSubmitReview";
import { useGetUserReviews } from "../../Hooks/queries/useGetReviews";

const ReviewForm = ({
    targetId,
    targetType,
    commandeId,
    onReviewSubmitted,
}) => {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState("");
    const { mutate: submitReview, isLoading } = useSubmitReview();
    const { data: userReviews, isLoading: isLoadingReviews } =
        useGetUserReviews();
    const [hasReviewed, setHasReviewed] = useState(false);

    // Vérifier si l'utilisateur a déjà laissé un avis pour cette commande et ce destinataire
    useEffect(() => {
        if (userReviews && !isLoadingReviews) {
            const alreadyReviewed = userReviews.some(
                (review) =>
                    review.commandeId === commandeId &&
                    review.targetId === targetId
            );
            setHasReviewed(alreadyReviewed);
        }
    }, [userReviews, commandeId, targetId, isLoadingReviews]);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (rating === 0) {
            alert("Veuillez attribuer une note");
            return;
        }

        if (comment.trim() === "") {
            alert("Veuillez laisser un commentaire");
            return;
        }

        submitReview(
            {
                targetId,
                targetType,
                rating,
                comment,
                commandeId,
            },
            {
                onSuccess: () => {
                    setRating(0);
                    setComment("");
                    setHasReviewed(true);
                    if (onReviewSubmitted) {
                        onReviewSubmitted();
                    }
                },
            }
        );
    };

    if (isLoadingReviews) {
        return <div className="text-center py-4">Chargement...</div>;
    }

    if (hasReviewed) {
        return (
            <div className="bg-green-50 p-4 rounded-lg text-center">
                <p className="text-green-700">
                    Vous avez déjà évalué ce{" "}
                    {targetType === "commercant" ? "commerçant" : "livreur"}.
                </p>
                <p className="text-green-600 text-sm mt-1">
                    Merci pour votre avis !
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Votre note
                </label>
                <div className="flex">
                    {[...Array(5)].map((_, index) => {
                        const ratingValue = index + 1;

                        return (
                            <label key={index} className="cursor-pointer">
                                <input
                                    type="radio"
                                    name="rating"
                                    value={ratingValue}
                                    onClick={() => setRating(ratingValue)}
                                    className="hidden"
                                />
                                <FaStar
                                    className="w-8 h-8 transition-colors duration-200"
                                    color={
                                        ratingValue <= (hover || rating)
                                            ? "#FBBF24"
                                            : "#D1D5DB"
                                    }
                                    onMouseEnter={() => setHover(ratingValue)}
                                    onMouseLeave={() => setHover(0)}
                                />
                            </label>
                        );
                    })}
                </div>
            </div>

            <div>
                <label
                    htmlFor="comment"
                    className="block text-sm font-medium text-gray-700 mb-1"
                >
                    Votre commentaire
                </label>
                <textarea
                    id="comment"
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Partagez votre expérience..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                    required
                />
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={isLoading}
                    className={`px-4 py-2 rounded-md text-white font-medium ${
                        isLoading
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                    }`}
                >
                    {isLoading ? "Envoi en cours..." : "Soumettre"}
                </button>
            </div>
        </form>
    );
};

ReviewForm.propTypes = {
    targetId: PropTypes.string.isRequired,
    targetType: PropTypes.oneOf(["commercant", "livreur"]).isRequired,
    commandeId: PropTypes.string.isRequired,
    onReviewSubmitted: PropTypes.func,
};

export default ReviewForm;
