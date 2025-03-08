import { Link, useLocation } from "react-router";
import {
    FaSignInAlt,
    FaUser,
    FaShoppingCart,
    FaClipboardList,
} from "react-icons/fa";
import { FaRegListAlt } from "react-icons/fa";
import { LuUserRound } from "react-icons/lu";
import { AiOutlineShoppingCart } from "react-icons/ai";
import { TbTruckDelivery } from "react-icons/tb";
import { MdOutlineSpaceDashboard } from "react-icons/md";
import PropTypes from "prop-types";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

const Sidebar = ({ navbarHeight = "4rem" }) => {
    const location = useLocation();
    const queryClient = useQueryClient();

    // Mutation pour la déconnexion
    const { mutate: logout } = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/auth/logout", {
                method: "POST",
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Something went wrong");
            }
            return data;
        },
        onSuccess: () => {
            toast.success("Logout successful");
            queryClient.invalidateQueries({ queryKey: ["authUser"] });
        },
        onError: (error) => {
            toast.error(error.message || "Logout failed");
        },
    });

    // Récupération des données utilisateur
    const { data: authUser, isLoading } = useQuery({ queryKey: ["authUser"] });

    // Liste des liens selon le type d'utilisateur
    const navItems = authUser?.userType
        ? {
              livreur: [
                  {
                      to: "/dashboard",
                      icon: <MdOutlineSpaceDashboard className="w-6 h-6" />,
                      label: "Dashboard",
                  },
                  {
                      to: "/profil",
                      icon: <LuUserRound className="w-6 h-6" />,
                      label: "Profil",
                  },
                  {
                      to: "/livraisons",
                      icon: <TbTruckDelivery className="w-6 h-6" />,
                      label: "Livraisons",
                  },
                  {
                      to: "/commandes",
                      icon: <FaRegListAlt className="w-6 h-6" />,
                      label: "Commandes",
                  },
              ],
              client: [
                  {
                      to: "/profil",
                      icon: <LuUserRound className="w-6 h-6" />,
                      label: "Profil",
                  },
                  {
                      to: "/commandes",
                      icon: <FaRegListAlt className="w-6 h-6" />,
                      label: "Commandes",
                  },
                  {
                      to: "/commander",
                      icon: <FaRegListAlt className="w-6 h-6" />,
                      label: "Passer une Commande",
                  },
              ],
              commercant: [
                  {
                      to: "/dashboard",
                      icon: <MdOutlineSpaceDashboard className="w-6 h-6" />,
                      label: "Dashboard",
                  },
                  {
                      to: "/profil",
                      icon: <LuUserRound className="w-6 h-6" />,
                      label: "Profil",
                  },
                  {
                      to: "/produits",
                      icon: <AiOutlineShoppingCart className="w-6 h-6" />,
                      label: "Produits",
                  },
                  {
                      to: "/livraison",
                      icon: <TbTruckDelivery className="w-6 h-6" />,
                      label: "Livraisons",
                  },
                  {
                      to: "/commandes",
                      icon: <FaRegListAlt className="w-6 h-6" />,
                      label: "Commandes",
                  },
              ],
          }[authUser.userType] || []
        : [];

    // Gestion du chargement
    if (isLoading) {
        return (
            <aside className="h-screen fixed top-0 left-0 bg-white w-64 border-r border-gray-200 shadow-lg flex items-center justify-center">
                <span className="text-emerald-700">Chargement...</span>
            </aside>
        );
    }

    return (
        <aside
            className="fixed left-0 bg-white text-emerald-700 w-72 border-r border-gray-200 shadow-lg flex flex-col justify-between transition-all duration-300"
            style={{
                top: navbarHeight,
                height: `calc(100vh - ${navbarHeight})`,
            }} // Ajustement pour la navbar
        >
            {/* Navigation principale */}
            <nav className="flex flex-col">
                {navItems.map((item) => (
                    <Link
                        key={item.to}
                        to={item.to}
                        className={`flex items-center gap-4 py-4 px-6 transition-colors duration-200 ${
                            location.pathname === item.to
                                ? "bg-emerald-100 text-emerald-900 font-semibold"
                                : "hover:bg-emerald-50"
                        }`}
                    >
                        {item.icon}
                        <span className="text-lg">{item.label}</span>
                    </Link>
                ))}
            </nav>

            {/* Bouton de déconnexion */}
            <div className="p-4">
                <button
                    onClick={(e) => {
                        // e.preventDefault();
                        logout();
                    }}
                    className="flex items-center gap-2 w-full bg-emerald-500 text-white px-4 py-2 rounded-md hover:bg-emerald-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                    <FaSignInAlt />
                    <span className="text-lg">Déconnexion</span>
                </button>
            </div>
        </aside>
    );
};

// Validation des props
Sidebar.propTypes = {
    navbarHeight: PropTypes.string, // Hauteur de la navbar en tant que string (ex. "4rem")
};

// Valeurs par défaut
Sidebar.defaultProps = {
    navbarHeight: "4rem", // Hauteur par défaut de la navbar
};

export default Sidebar;
