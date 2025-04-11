import { FaStar, FaRegStar } from "react-icons/fa";
import { useAuthUserQuery } from "../../Hooks/useAuthQueries";
import PropTypes from "prop-types";
// import useReviews from "../../hooks/useReviews";

const fakeReviews = [
    {
        id: 1,
        name: "Jean Dupont",
        comment: "Service impeccable et livraison rapide !",
        rating: 5,
        date: "12 Mars 2025",
    },
    {
        id: 2,
        name: "Sophie Martin",
        comment: "Bon service mais un peu de retard sur la commande.",
        rating: 4,
        date: "10 Mars 2025",
    },
    {
        id: 3,
        name: "Paul Bernard",
        comment: "Très satisfait, je recommande !",
        rating: 5,
        date: "8 Mars 2025",
    },
    {
        id: 4,
        name: "Alice Morel",
        comment: "Peut mieux faire sur le service client.",
        rating: 3,
        date: "6 Mars 2025",
    },
];

const getAverageRating = (reviews) => {
    if (!reviews.length) return 0;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / reviews.length).toFixed(1);
};

const StarRating = ({ rating }) => (
    <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
            <span key={i}>
                {i < rating ? (
                    <FaStar className="text-yellow-500" />
                ) : (
                    <FaRegStar className="text-gray-300" />
                )}
            </span>
        ))}
    </div>
);

StarRating.propTypes = {
    rating: PropTypes.number.isRequired,
};

const ReviewCard = ({ review }) => (
    <div className="bg-white p-4 rounded-lg shadow-md mb-4">
        <div className="flex items-center justify-between">
            <h3 className="font-semibold text-emerald-700">{review.name}</h3>
            <span className="text-sm text-gray-500">{review.date}</span>
        </div>
        <StarRating rating={review.rating} />
        <p className="text-gray-700 mt-2">{review.comment}</p>
    </div>
);

ReviewCard.propTypes = {
    review: PropTypes.shape({
        name: PropTypes.string.isRequired,
        date: PropTypes.string.isRequired,
        rating: PropTypes.number.isRequired,
        comment: PropTypes.string.isRequired,
    }).isRequired,
};

const DashboardPageAdmin = () => {
    const { data: authUser } = useAuthUserQuery();

    return (
        <div className="w-full h-full bg-gray-100 p-6">
            <h1 className="text-2xl font-bold text-emerald-700 mb-6">
                Bienvenue {authUser.nom}
            </h1>

            <>
                <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
                    <h2 className="text-lg font-semibold text-emerald-800 mb-2">
                        Note Globale
                    </h2>
                    <div className="flex items-center text-2xl font-bold text-yellow-500">
                        {getAverageRating(fakeReviews)}
                        <span className="ml-2">
                            <StarRating
                                rating={Math.round(
                                    getAverageRating(fakeReviews)
                                )}
                            />
                        </span>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <h2 className="text-lg font-semibold text-emerald-800 mb-4">
                        Avis des Clients
                    </h2>
                    {fakeReviews.map((review) => (
                        <ReviewCard key={review.id} review={review} />
                    ))}
                </div>
            </>
        </div>
    );
};

export default DashboardPageAdmin;
