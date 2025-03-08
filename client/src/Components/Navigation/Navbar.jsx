import { Link } from "react-router";
import { FaSignInAlt, FaUserPlus } from "react-icons/fa";

const Navbar = () => {
    return (
        <nav className="sticky top-0 bg-gradient-to-r from-emerald-500 to-emerald-700 p-4 flex justify-between items-center z-50 shadow-lg">
            <Link
                to="/"
                className="text-2xl font-extrabold text-white tracking-wide"
            >
                SmartCity
            </Link>
            <div className="flex items-center space-x-6">
                <Link
                    to="/login"
                    className="flex items-center gap-2 bg-white text-emerald-700 px-4 py-2 rounded-full hover:bg-emerald-100 transition duration-300 shadow-md"
                >
                    <FaSignInAlt /> Connexion
                </Link>
                <Link
                    to="/signup"
                    className="flex items-center gap-2 bg-white text-emerald-700 px-4 py-2 rounded-full hover:bg-emerald-100 transition duration-300 shadow-md"
                >
                    <FaUserPlus /> S'inscrire
                </Link>
            </div>
        </nav>
    );
};

export default Navbar;
