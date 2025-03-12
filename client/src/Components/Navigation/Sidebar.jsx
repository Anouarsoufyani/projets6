import { Link, useLocation } from "react-router";
import { FaSignInAlt } from "react-icons/fa";
import { FaRegListAlt } from "react-icons/fa";
import { LuUserRound } from "react-icons/lu";
import { AiOutlineShoppingCart } from "react-icons/ai";
import { TbTruckDelivery } from "react-icons/tb";
import { MdOutlineSpaceDashboard } from "react-icons/md";
import PropTypes from "prop-types";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

const Sidebar = ({ authUser, sidebarSize, navbarHeight }) => {
    const location = useLocation();
    const queryClient = useQueryClient();

    // Mutation for logout
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

    // Define navigation items based on user type

    const navItems = authUser?.role
        ? {
              livreur: [
                  {
                      to: "/dashboard",
                      icon: <MdOutlineSpaceDashboard className="w-5 h-5" />,
                      label: "Dashboard",
                  },
                  {
                      to: "/profil",
                      icon: <LuUserRound className="w-5 h-5" />,
                      label: "Profil",
                  },
                  {
                      to: "/livraisons",
                      icon: <TbTruckDelivery className="w-5 h-5" />,
                      label: "Livraisons",
                  },
                  {
                      to: "/commandes",
                      icon: <FaRegListAlt className="w-5 h-5" />,
                      label: "Commandes",
                  },
              ],
              client: [
                  {
                      to: "/profil",
                      icon: <LuUserRound className="w-5 h-5" />,
                      label: "Profil",
                  },
                  {
                      to: "/commandes",
                      icon: <FaRegListAlt className="w-5 h-5" />,
                      label: "Commandes",
                  },
                  {
                      to: "/commander",
                      icon: <FaRegListAlt className="w-5 h-5" />,
                      label: "Passer une Commande",
                  },
              ],
              commercant: [
                  {
                      to: "/dashboard",
                      icon: <MdOutlineSpaceDashboard className="w-5 h-5" />,
                      label: "Dashboard",
                  },
                  {
                      to: "/profil",
                      icon: <LuUserRound className="w-5 h-5" />,
                      label: "Profil",
                  },
                  {
                      to: "/produits",
                      icon: <AiOutlineShoppingCart className="w-5 h-5" />,
                      label: "Produits",
                  },
                  {
                      to: "/livraison",
                      icon: <TbTruckDelivery className="w-5 h-5" />,
                      label: "Livraisons",
                  },
                  {
                      to: "/commandes",
                      icon: <FaRegListAlt className="w-5 h-5" />,
                      label: "Commandes",
                  },
              ],
          }[authUser.role] || []
        : [];

    console.log(sidebarSize, navbarHeight);

    return (
        <aside
            className={`fixed left-0 bg-white text-gray-700 border-r border-gray-100 shadow-sm flex flex-col transition-all duration-300 z-10`}
            style={{
                top: navbarHeight,
                height: `calc(100vh - ${navbarHeight})`,
                width: sidebarSize,
            }}
        >
            {/* Navigation Section */}
            <nav className="flex-1 flex flex-col pt-6">
                <div className="px-6 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Menu
                </div>
                {navItems.map((item) => (
                    <Link
                        key={item.to}
                        to={item.to}
                        className={`flex items-center gap-3 py-3 px-6 transition-all duration-300 ease-in-out ${
                            location.pathname === item.to
                                ? "bg-emerald-50 text-emerald-700 font-medium border-l-4 border-emerald-500"
                                : "text-gray-600 hover:bg-gray-50 hover:text-emerald-700 hover:pl-7"
                        }`}
                    >
                        <div className="flex items-center justify-center w-5 h-5">
                            {item.icon}
                        </div>
                        <span className="text-sm font-medium">
                            {item.label}
                        </span>
                    </Link>
                ))}
            </nav>

            {/* Logout Button */}
            <div className="p-6 border-t border-gray-100">
                <button
                    onClick={() => logout()}
                    className="flex items-center gap-3 w-full text-gray-600 py-3 px-6 rounded-lg hover:bg-gray-50 hover:text-emerald-700 transition-all duration-300 ease-in-out hover:pl-7 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                >
                    <div className="flex items-center justify-center w-5 h-5">
                        <FaSignInAlt className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium">Déconnexion</span>
                </button>
            </div>
        </aside>
    );
};

// Prop validation
Sidebar.propTypes = {
    navbarHeight: PropTypes.string,
    sidebarSize: PropTypes.string,
    authUser: PropTypes.object,
};

// Default props
Sidebar.defaultProps = {
    navbarHeight: "4rem",
    sidebarSize: "16rem",
};

export default Sidebar;
