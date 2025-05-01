"use client";

import { Link, useLocation } from "react-router";
import { FaSignInAlt, FaRegListAlt } from "react-icons/fa";
import { LuUserRound } from "react-icons/lu";
import { TbTruckDelivery } from "react-icons/tb";
import {
    MdOutlineSpaceDashboard,
    MdOutlineNotificationsNone,
} from "react-icons/md";
import { HiOutlineDocumentText } from "react-icons/hi";
import PropTypes from "prop-types";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
// Modifier la fonction Sidebar pour accepter les notifications en props
const Sidebar = ({
    authUser,
    sidebarSize,
    navbarHeight,
    isOpen,
    isMobile,
    notifications,
}) => {
    const location = useLocation();
    const queryClient = useQueryClient();

    // Ajouter après la déclaration de la variable location
    // Calculer le nombre de notifications non lues
    // Mutation for logout
    const { mutate: logout } = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/auth/logout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(
                    authUser?.role === "livreur" ? { id: authUser._id } : {}
                ),
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
                  {
                      to: "/notifications",
                      icon: <MdOutlineNotificationsNone className="w-5 h-5" />,

                      label: (
                          <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                  Notifications
                              </span>
                              {notifications > 0 && (
                                  <span className="inline-flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-5 h-5">
                                      {notifications}
                                  </span>
                              )}
                          </div>
                      ),
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
                  {
                      to: "/notifications",
                      icon: <MdOutlineNotificationsNone className="w-5 h-5" />,
                      label: (
                          <div className="flex items-center">
                              Notifications
                              {notifications > 0 && (
                                  <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                                      {notifications}
                                  </span>
                              )}
                          </div>
                      ),
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
                      to: "/commandes",
                      icon: <FaRegListAlt className="w-5 h-5" />,
                      label: "Commandes",
                  },
                  {
                      to: "/notifications",
                      icon: <MdOutlineNotificationsNone className="w-5 h-5" />,
                      label: (
                          <div className="flex items-center">
                              Notifications
                              {notifications > 0 && (
                                  <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                                      {notifications}
                                  </span>
                              )}
                          </div>
                      ),
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
                      to: "/gestion/client",
                      icon: <FaRegListAlt className="w-5 h-5" />,
                      label: "Gestion Clients",
                  },
                  {
                      to: "/gestion/commercant",
                      icon: <FaRegListAlt className="w-5 h-5" />,
                      label: "Gestion Commercants",
                  },
                  {
                      to: "/gestion/livreur",
                      icon: <FaRegListAlt className="w-5 h-5" />,
                      label: "Gestion Livreurs",
                  },
                  {
                      to: "/notifications",
                      icon: <MdOutlineNotificationsNone className="w-5 h-5" />,
                      label: (
                          <div className="flex items-center">
                              Notifications
                              {notifications > 0 && (
                                  <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                                      {notifications}
                                  </span>
                              )}
                          </div>
                      ),
                  },
              ],
          }[authUser.role] || []
        : [];

    return (
        <>
            <aside
                className={`fixed bg-white text-gray-700 border-r border-gray-100 shadow-sm flex flex-col z-30 transition-all duration-300 ease-in-out ${
                    isMobile && isOpen
                        ? "left-0"
                        : isMobile && !isOpen
                        ? "-left-full"
                        : "left-0"
                }`}
                style={{
                    top: navbarHeight,
                    height: `calc(100vh - ${navbarHeight})`,
                    width: isMobile ? "100%" : sidebarSize,
                }}
            >
                <nav className="flex-1 flex flex-col pt-6 overflow-y-auto">
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

            {/* Overlay for mobile when sidebar is open */}
            {isMobile && isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20"
                    onClick={() => {}} // This will be handled in App.jsx
                />
            )}
        </>
    );
};

Sidebar.propTypes = {
    navbarHeight: PropTypes.string,
    sidebarSize: PropTypes.string,
    authUser: PropTypes.object,
    isOpen: PropTypes.bool,
    isMobile: PropTypes.bool,
    notifications: PropTypes.number,
};

Sidebar.defaultProps = {
    navbarHeight: "4rem",
    sidebarSize: "16rem",
};

export default Sidebar;
