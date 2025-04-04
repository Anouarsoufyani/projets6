import { Link, useLocation } from "react-router";
import { FaSignInAlt, FaRegListAlt } from "react-icons/fa";
import { LuUserRound } from "react-icons/lu";
import { TbTruckDelivery } from "react-icons/tb";
import { MdOutlineSpaceDashboard } from "react-icons/md";
import { HiOutlineDocumentText } from "react-icons/hi";
import PropTypes from "prop-types";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

const Sidebar = ({ authUser, sidebarSize, navbarHeight }) => {
    const location = useLocation();
    const queryClient = useQueryClient();

    // Mutation for logout
    const { mutate: logout } = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/auth/logout", { method: "POST" });
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
                      label: authUser.statut ? (
                          <div className="flex items-center">
                              Profil{"  "}
                              <span className="mx-1"></span>
                              <span
                                  className={`px-2 py-0.5 rounded-full ${
                                      authUser.statut === "non vérifié"
                                          ? "bg-gray-200 text-gray-800"
                                          : authUser.statut === "refusé"
                                          ? "bg-red-100 text-red-800"
                                          : authUser.statut ===
                                            "en vérification"
                                          ? "bg-orange-100 text-orange-800"
                                          : "bg-green-100 text-green-800"
                                  }`}
                              >
                                  {authUser.statut}
                              </span>
                          </div>
                      ) : (
                          "Profil"
                      ),
                  },
                  {
                      to: "/commandes",
                      icon: <FaRegListAlt className="w-5 h-5" />,
                      label: "Commandes",
                  },
                  {
                      to: "/justificative",
                      icon: <HiOutlineDocumentText className="w-5 h-5" />,
                      label: "Pièce Justificative",
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
                      to: "/commandes/create",
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
                      to: "/livreurs",
                      icon: <TbTruckDelivery className="w-5 h-5" />,
                      label: "Trouver un livreur",
                  },
                  {
                      to: "/commandes",
                      icon: <FaRegListAlt className="w-5 h-5" />,
                      label: "Commandes",
                  },
              ],
              admin: [
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
                      to: "/gestion-commande",
                      icon: <TbTruckDelivery className="w-5 h-5" />,
                      label: "Gestion Commandes",
                  },
                  {
                      to: "/gestion-client",
                      icon: <FaRegListAlt className="w-5 h-5" />,
                      label: "Gestion Clients",
                  },
                  {
                      to: "/gestion-commercant",
                      icon: <FaRegListAlt className="w-5 h-5" />,
                      label: "Gestion Commercants",
                  },
                  {
                      to: "/gestion-livreur",
                      icon: <FaRegListAlt className="w-5 h-5" />,
                      label: "Gestion Livreurs",
                  },
              ],
          }[authUser.role] || []
        : [];

    return (
        <aside
            className={`fixed left-0 bg-white text-gray-700 border-r border-gray-100 shadow-sm flex flex-col transition-all duration-300 z-10`}
            style={{
                top: navbarHeight,
                height: `calc(100vh - ${navbarHeight})`,
                width: sidebarSize,
            }}
        >
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

Sidebar.propTypes = {
    navbarHeight: PropTypes.string,
    sidebarSize: PropTypes.string,
    authUser: PropTypes.object,
};

Sidebar.defaultProps = {
    navbarHeight: "4rem",
    sidebarSize: "16rem",
};

export default Sidebar;
