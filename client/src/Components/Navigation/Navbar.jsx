"use client";

import { Link } from "react-router";
import { FaSignInAlt, FaUserPlus, FaBars } from "react-icons/fa";
import PropTypes from "prop-types";

const Navbar = ({ isLoggedIn, navbarHeight, toggleSidebar, isMobile }) => {
    return (
        <nav
            className="fixed top-0 left-0 right-0 bg-gradient-to-r from-emerald-500 to-emerald-700 p-4 flex justify-between items-center z-50 shadow-lg"
            style={{ height: navbarHeight }}
        >
            <Link
                to="/"
                className="text-2xl font-extrabold text-white tracking-wide"
            >
                Proximity
            </Link>

            <div className="flex items-center space-x-3">
                {isLoggedIn && isMobile && (
                    <button
                        onClick={toggleSidebar}
                        className="text-white p-2 hover:bg-emerald-600 rounded-md transition-colors"
                        aria-label="Toggle menu"
                    >
                        <FaBars size={20} />
                    </button>
                )}

                {!isLoggedIn && (
                    <div className="flex items-center gap-2">
                        <Link
                            to="/login"
                            className="flex items-center justify-center bg-white text-emerald-700 p-2 rounded-full hover:bg-emerald-100 transition duration-300 shadow-md"
                            aria-label="Connexion"
                        >
                            <FaSignInAlt size={18} />
                            <span className="hidden md:inline ml-2">
                                Connexion
                            </span>
                        </Link>
                        <Link
                            to="/signup"
                            className="flex items-center justify-center bg-white text-emerald-700 p-2 rounded-full hover:bg-emerald-100 transition duration-300 shadow-md"
                            aria-label="S'inscrire"
                        >
                            <FaUserPlus size={18} />
                            <span className="hidden md:inline ml-2">
                                S'inscrire
                            </span>
                        </Link>
                    </div>
                )}
            </div>
        </nav>
    );
};

Navbar.propTypes = {
    isLoggedIn: PropTypes.bool.isRequired,
    navbarHeight: PropTypes.string,
    toggleSidebar: PropTypes.func,
    isMobile: PropTypes.bool,
};

export default Navbar;
