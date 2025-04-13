import { FaStar, FaRegStar } from "react-icons/fa"
import PropTypes from "prop-types"

export const StarRating = ({ rating }) => (
  <div className="flex items-center">
    {[...Array(5)].map((_, i) => (
      <span key={i} className="mr-0.5">
        {i < rating ? <FaStar className="text-yellow-500 h-5 w-5" /> : <FaRegStar className="text-gray-300 h-5 w-5" />}
      </span>
    ))}
  </div>
)

StarRating.propTypes = {
  rating: PropTypes.number.isRequired,
}

export const ReviewCard = ({ review }) => (
  <div className="bg-white p-5 rounded-xl shadow-md mb-5 border-l-4 border-emerald-500 hover:shadow-lg transition-shadow duration-300">
    <div className="flex items-center justify-between mb-2">
      <h3 className="font-semibold text-emerald-700 text-lg">{review.clientName || "Client anonyme"}</h3>
      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
        {new Date(review.createdAt).toLocaleDateString()}
      </span>
    </div>
    <div className="mb-2">
      <StarRating rating={review.rating} />
    </div>
    <p className="text-gray-700 mt-2 italic">{review.comment}</p>
  </div>
)

ReviewCard.propTypes = {
  review: PropTypes.shape({
    clientName: PropTypes.string,
    createdAt: PropTypes.string.isRequired,
    rating: PropTypes.number.isRequired,
    comment: PropTypes.string.isRequired,
  }).isRequired,
}

export const getAverageRating = (reviews) => {
  if (!reviews || !reviews.length) return 0
  const total = reviews.reduce((sum, review) => sum + review.rating, 0)
  return (total / reviews.length).toFixed(1)
}
