import { FaUser, FaBiking, FaStore } from "react-icons/fa";
import { PropTypes } from "prop-types";
import { Link } from "react-router";
const HomePage = ({ navbarHeight }) => {
    return (
        <>
            <main className="w-full h-full">
                <header
                    className="flex flex-col md:flex-row w-full justify-center items-center bg-gradient-to-r from-emerald-500 to-emerald-700"
                    style={{
                        minHeight: "calc(100vh - " + navbarHeight + ")",
                    }}
                >
                    <div className="flex justify-center items-center w-full md:w-1/2 py-8 md:py-0">
                        <img
                            src="deliver_truck_banner.svg"
                            alt="Proximity Delivery"
                            className="w-3/4 max-w-sm"
                        />
                    </div>
                    <div className="w-full md:w-1/2 flex flex-col justify-center items-center gap-6 md:gap-8 px-4 sm:px-8 md:px-16 text-white py-8 md:py-0">
                        <div className="flex flex-col gap-4 text-center">
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center">
                                Révolutionnez vos livraisons avec Proximity
                            </h1>
                            <p className="text-lg md:text-xl lg:text-2xl text-center">
                                Rapidité, fiabilité et durabilité au service de
                                votre ville
                            </p>
                        </div>
                        <div className="flex flex-col gap-6 w-full max-w-md">
                            <h2 className="text-2xl font-semibold text-center">
                                Commencez dès aujourd’hui
                            </h2>
                            <div className="flex flex-col sm:flex-row md:flex-col lg:flex-col gap-4 w-full">
                                <Link
                                    to={`/signup/?role=client`}
                                    className="flex items-center justify-center gap-2 bg-white text-emerald-700 px-6 py-3 rounded-md hover:bg-emerald-100 transition duration-300 w-full"
                                >
                                    <FaUser /> Je suis un Client
                                </Link>
                                <Link
                                    to={`/signup/?role=livreur`}
                                    className="flex items-center justify-center gap-2 bg-white text-emerald-700 px-6 py-3 rounded-md hover:bg-emerald-100 transition duration-300 w-full"
                                >
                                    <FaBiking /> Je suis un Livreur
                                </Link>
                                <Link
                                    to={`/signup/?role=commercant`}
                                    className="flex items-center justify-center gap-2 bg-white text-emerald-700 px-6 py-3 rounded-md hover:bg-emerald-100 transition duration-300 w-full"
                                >
                                    <FaStore /> Je suis un Commerçant
                                </Link>
                            </div>
                        </div>
                    </div>
                </header>

                <section className="py-16 bg-gray-100">
                    <div className="container mx-auto px-4 sm:px-6">
                        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12">
                            Pourquoi choisir Proximity ?
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="flex flex-col items-center text-center">
                                <div className="bg-emerald-500 text-white p-4 rounded-full mb-4">
                                    <FaBiking size={32} />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">
                                    Livraisons Rapides
                                </h3>
                                <p>
                                    Recevez vos colis en un temps record grâce à
                                    notre réseau local.
                                </p>
                            </div>
                            <div className="flex flex-col items-center text-center">
                                <div className="bg-emerald-500 text-white p-4 rounded-full mb-4">
                                    <FaUser size={32} />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">
                                    Fiabilité Garantie
                                </h3>
                                <p>
                                    Un service de qualité assuré par des
                                    livreurs formés.
                                </p>
                            </div>
                            <div className="flex flex-col items-center text-center">
                                <div className="bg-emerald-500 text-white p-4 rounded-full mb-4">
                                    <FaStore size={32} />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">
                                    Écoresponsable
                                </h3>
                                <p>
                                    Réduisez votre impact environnemental avec
                                    des livraisons durables.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <footer className="bg-emerald-700 text-white py-8">
                    <div className="container mx-auto px-4 text-center">
                        <p className="mb-4">
                            Prêt à transformer vos livraisons ?
                        </p>
                        <Link to="/signup">
                            <button className="bg-white text-emerald-700 px-8 py-3 rounded-md hover:bg-emerald-100 transition duration-300">
                                S’inscrire maintenant
                            </button>
                        </Link>
                    </div>
                </footer>
            </main>
        </>
    );
};

HomePage.propTypes = {
    navbarHeight: PropTypes.string,
};

export default HomePage;
