import { FaStar, FaRegStar } from "react-icons/fa";

const fakeReviews = [
    { id: 1, name: "Jean Dupont", comment: "Service impeccable et livraison rapide !", rating: 5, date: "12 Mars 2025" },
    { id: 2, name: "Sophie Martin", comment: "Bon service mais un peu de retard sur la commande.", rating: 4, date: "10 Mars 2025" },
    { id: 3, name: "Paul Bernard", comment: "Très satisfait, je recommande !", rating: 5, date: "8 Mars 2025" },
    { id: 4, name: "Alice Morel", comment: "Peut mieux faire sur le service client.", rating: 3, date: "6 Mars 2025" },
];


// Fonction pour calculer la note globale moyenne
const getAverageRating = (reviews) => {
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return total / reviews.length;
};

export const averageRating = getAverageRating(fakeReviews);

const ReviewCard = ({ review }) => {
    return (
        <div className="bg-white p-4 rounded-lg shadow-md mb-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-emerald-700">{review.name}</h3>
                <span className="text-sm text-gray-500">{review.date}</span>
            </div>
            <div className="flex items-center my-2">
                {[...Array(5)].map((_, i) =>
                    i < review.rating ? (
                        <FaStar key={i} className="text-yellow-500" />
                    ) : (
                        <FaRegStar key={i} className="text-gray-300" />
                    )
                )}
            </div>
            <p className="text-gray-700">{review.comment}</p>
        </div>
    );
};

const DashboardPage = () => {


    return (
        <div className="w-full min-h-screen bg-gray-100 p-6">
            <h1 className="text-2xl font-bold text-emerald-700 mb-6">Dashboard</h1>

            {/* Section Note Globale */}
            <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
                <h2 className="text-lg font-semibold text-emerald-800 mb-2">Note Globale</h2>
                <div className="flex items-center text-2xl font-bold text-yellow-500">
                    {averageRating.toFixed(1)}{" "}
                    <span className="ml-2 flex">
                        {[...Array(5)].map((_, i) =>
                            i < Math.round(averageRating) ? (
                                <FaStar key={i} className="text-yellow-500" />
                            ) : (
                                <FaRegStar key={i} className="text-gray-300" />
                            )
                        )}
                    </span>
                </div>
            </div>

            {/* Section Avis Clients */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-lg font-semibold text-emerald-800 mb-4">Avis des Clients</h2>
                {fakeReviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                ))}
            </div>
        </div>
    );
};

export default DashboardPage;
