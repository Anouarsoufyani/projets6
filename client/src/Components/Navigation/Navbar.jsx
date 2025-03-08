import { Link } from "react-router";

const Navbar = () => {
    return (
        <nav className="sticky top-0 bg-transparent p-2 flex justify-between items-center z-50">
            <Link to="/" className="font-bold">
                SmartCity
            </Link>
            <div className="md:flex md:items-center space-x-4">
                <Link
                    to="/login"
                    className="bg-slate-800 px-4 py-2 rounded-md hover:bg-slate-700 text-slate-100"
                >
                    Connexion
                </Link>
                <Link
                    to="/signup"
                    className="bg-slate-800 px-4 py-2 rounded-md hover:bg-slate-700 text-slate-100"
                >
                    Sign Up
                </Link>
            </div>
        </nav>
    );
};
export default Navbar;
