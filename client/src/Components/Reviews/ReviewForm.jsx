"use client"

// Ajouter un import pour useEffect et useState pour gérer l'état des avis déjà soumis
import { useState, useEffect } from "react"
import { FaStar } from "react-icons/fa"
import PropTypes from "prop-types"
import { useSubmitReview } from "../../Hooks/mutations/useSubmitReview"
import { useGetUserReviews } from "../../Hooks/queries/useGetReviews"

const ReviewForm = ({ targetId, targetType, commandeId, onReviewSubmitted }) => {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState("")
  const { mutate: submitReview, isLoading } = useSubmitReview()
  const { data: userReviews, isLoading: isLoadingReviews } = useGetUserReviews()
  const [hasReviewed, setHasReviewed] = useState(false)

  // Vérifier si l'utilisateur a déjà laissé un avis pour cette commande et ce destinataire
  useEffect(() => {
    if (userReviews && !isLoadingReviews) {
      const alreadyReviewed = userReviews.some(
        (review) => review.commandeId === commandeId && review.targetId === targetId,
      )
      setHasReviewed(alreadyReviewed)
    }
  }, [userReviews, commandeId, targetId, isLoadingReviews])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (rating === 0) {
      return
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
          setRating(0)
          setComment("")
          setHasReviewed(true)
          if (onReviewSubmitted) {
            onReviewSubmitted()
          }
        },
      },
    )
  }

  if (isLoadingReviews) {
    return <div className="text-center py-4">Chargement...</div>
  }

  if (hasReviewed) {
    return (
      <div className="bg-green-50 p-4 rounded-lg text-center">
        <p className="text-green-700">
          Vous avez déjà évalué ce {targetType === "commercant" ? "commerçant" : "livreur"}.
        </p>
        <p className="text-green-600 text-sm mt-1">Merci pour votre avis !</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl">
      <form onSubmit={handleSubmit}>
        <div className="flex mb-4 justify-center">
          {[...Array(5)].map((_, index) => {
            const ratingValue = index + 1
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
                  color={ratingValue <= (hover || rating) ? "#fbbf24" : "#e5e7eb"}
                  onMouseEnter={() => setHover(ratingValue)}
                  onMouseLeave={() => setHover(0)}
                />
              </label>
            )
          })}
        </div>
        <div className="mb-4">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Partagez votre expérience..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
            rows="3"
          ></textarea>
        </div>
        <button
          type="submit"
          disabled={isLoading || rating === 0}
          className={`w-full px-4 py-2 rounded-lg text-white font-medium transition-colors duration-200 ${
            isLoading || rating === 0 ? "bg-gray-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"
          }`}
        >
          {isLoading ? "Envoi en cours..." : "Soumettre l'avis"}
        </button>
      </form>
    </div>
  )
}

ReviewForm.propTypes = {
  targetId: PropTypes.string.isRequired,
  targetType: PropTypes.oneOf(["commercant", "livreur"]).isRequired,
  commandeId: PropTypes.string.isRequired,
  onReviewSubmitted: PropTypes.func,
}

export default ReviewForm
