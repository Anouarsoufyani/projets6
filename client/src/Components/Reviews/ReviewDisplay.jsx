import { FaStar, FaRegStar, FaUser, FaCalendarAlt } from "react-icons/fa";
import PropTypes from "prop-types";


export const StarRating = ({ rating }) => {
    return (
        <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
                <span key={i} className="text-yellow-500">
                    {i < rating ? <FaStar /> : <FaRegStar />}
                </span>
            ))}
        </div>
    );
};

StarRating.propTypes = {
    rating: PropTypes.number.isRequired,
};


export const ReviewCard = ({ review }) => {
    return (
        <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-emerald-400">
            <div className="flex justify-between items-start">
                <div className="flex items-center mb-2">
                    <div className="bg-emerald-100 p-2 rounded-full mr-3">
                        <FaUser className="text-emerald-600" />
                    </div>
                    <div>
                        <h4 className="font-medium text-gray-800">
                            {review.clientName || "Client"}
                        </h4>
                        <div className="flex items-center mt-1">
                            <StarRating rating={review.rating} />
                        </div>
                    </div>
                </div>
                <div className="flex items-center text-xs text-gray-500">
                    <FaCalendarAlt className="mr-1" />
                    {new Date(review.createdAt).toLocaleDateString()}
                </div>
            </div>
            <p className="mt-3 text-gray-700">{review.comment}</p>
            {review.commandeId && (
                <div className="mt-2 text-xs bg-gray-200 px-2 py-1 rounded-full inline-block">
                    Commande #
                    {typeof review.commandeId === "string"
                        ? review.commandeId.slice(-6)
                        : ""}
                </div>
            )}
        </div>
    );
};

ReviewCard.propTypes = {
    review: PropTypes.shape({
        clientName: PropTypes.string,
        rating: PropTypes.number.isRequired,
        comment: PropTypes.string.isRequired,
        createdAt: PropTypes.string.isRequired,
        commandeId: PropTypes.string,
    }).isRequired,
};


export const getAverageRating = (reviews) => {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((total, review) => total + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
};


export const ReviewSummary = ({ reviews }) => {
    const averageRating = getAverageRating(reviews);


    const ratingDistribution = [0, 0, 0, 0, 0]; 
    reviews.forEach((review) => {
        if (review.rating >= 1 && review.rating <= 5) {
            ratingDistribution[review.rating - 1]++;
        }
    });

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <div className="mb-4 md:mb-0">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                        Évaluations des clients
                    </h3>
                    <p className="text-sm text-gray-500">
                        {reviews.length} avis au total
                    </p>
                </div>
                <div className="flex items-center">
                    <span className="text-3xl font-bold text-yellow-500 mr-3">
                        {averageRating}
                    </span>
                    <StarRating
                        rating={Math.round(Number.parseFloat(averageRating))}
                    />
                </div>
            </div>


            <div className="space-y-2">
                {ratingDistribution
                    .map((count, index) => {
                        const percentage =
                            reviews.length > 0
                                ? (count / reviews.length) * 100
                                : 0;
                        return (
                            <div key={index} className="flex items-center">
                                <span className="w-12 text-sm text-gray-600">
                                    {5 - index} étoiles
                                </span>
                                <div className="flex-1 mx-3 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                    <div
                                        className="bg-yellow-500 h-2.5 rounded-full"
                                        style={{ width: `${percentage}%` }}
                                    ></div>
                                </div>
                                <span className="text-xs text-gray-500 w-10 text-right">
                                    {count}
                                </span>
                            </div>
                        );
                    })
                    .reverse()}
            </div>
        </div>
    );
};

ReviewSummary.propTypes = {
    reviews: PropTypes.arrayOf(
        PropTypes.shape({
            rating: PropTypes.number.isRequired,
        })
    ).isRequired,
};
