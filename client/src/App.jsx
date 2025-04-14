"use client";

import { useState, useEffect } from "react";
import { Route, Routes, Navigate, useLocation } from "react-router";
import SignupPage from "./Pages/Auth/SignUp/SignupPage";
import LoginPage from "./Pages/Auth/Login/LoginPage";
import HomePage from "./Pages/Home/HomePage";
import ProfilePage from "./Pages/Profile/ProfilePage";
import DashboardPageLivreur from "./Pages/User/DashboardPageLivreur";
import DashboardPageCommercant from "./Pages/User/DashboardPageCommercant";
import Navbar from "./Components/Navigation/Navbar";
import Sidebar from "./Components/Navigation/Sidebar";
import SelectLivreurPage from "./Pages/Livraisons/SelectLivreurPage";
import CommandesListePage from "./Pages/Commandes/CommandesListePage";
import JustificativePage from "./Pages/Livraisons/JustificativePage";
import { Toaster } from "react-hot-toast";
import { useAuthUserQuery } from "./Hooks";
import CreateCommandePage from "./Pages/Commandes/CreateCommandePage";
import CommandeSuivi from "./Pages/Commandes/CommandeSuivi";
import NotificationsPage from "./Pages/User/NotificationsPage";
import useDeliveryPosition from "./Hooks/mutations/useDeliveryPosition";
import { useFilteredNotifications } from "./Hooks";

import DetailCommande from "./Pages/Commandes/DetailCommande";

import GestionPiecesPage from "./Pages/Admin/GestionPiecesPage";
import DashboardPageAdmin from "./Pages/Admin/DashboardPageAdmin";
import GestionUsersPage from "./Pages/Admin/GestionUsersPage";

import ViewDocs from "./Pages/Documents/ViewDocs";
import GestionCommandePage from "./Pages/Admin/GestionCommandePage";

function App() {
    const navbarSize = "4rem";
    const sidebarSize = "18rem";
    const [isMobile, setIsMobile] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    // Close sidebar on route change
    useEffect(() => {
        if (isMobile) {
            setSidebarOpen(false);
        }
    }, [location.pathname, isMobile]);

    // Check if screen is mobile
    useEffect(() => {
        const checkIfMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        // Initial check
        checkIfMobile();

        // Add event listener
        window.addEventListener("resize", checkIfMobile);

        // Cleanup
        return () => window.removeEventListener("resize", checkIfMobile);
    }, []);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const { data: authUser, isLoading } = useAuthUserQuery();

    // Récupérer les notifications
    const { data: notifications } = useFilteredNotifications();

    // Utiliser le hook de position pour les livreurs
    const isLivreur = authUser?.role === "livreur";
    const isLivreurActive = isLivreur && authUser?.disponibilite;
    useDeliveryPosition(isLivreurActive, authUser?._id);

    if (isLoading) {
        return (
            <div className="h-screen flex justify-center items-center">
                <span className="loading loading-dots loading-lg"></span>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen w-full bg-gradient-to-br from-emerald-50 to-teal-100">
            <Navbar
                isLoggedIn={!!authUser}
                navbarHeight={navbarSize}
                toggleSidebar={toggleSidebar}
                isMobile={isMobile}
            />

            {authUser && (
                <Sidebar
                    authUser={authUser}
                    sidebarSize={sidebarSize}
                    navbarHeight={navbarSize}
                    isOpen={sidebarOpen}
                    isMobile={isMobile}
                    notifications={notifications}
                />
            )}

            <main
                className="flex-1 transition-all duration-300 ease-in-out"
                style={{
                    marginTop: navbarSize,
                    marginLeft: isMobile ? 0 : authUser ? sidebarSize : 0,
                    width: isMobile
                        ? "100%"
                        : authUser
                        ? `calc(100% - ${sidebarSize})`
                        : "100%",
                }}
                onClick={() => isMobile && sidebarOpen && setSidebarOpen(false)}
            >
                <Routes>
                    <Route
                        path="/"
                        element={
                            !authUser ? (
                                <HomePage navbarHeight={navbarSize} />
                            ) : authUser.role === "client" ? (
                                <Navigate to="/commandes" />
                            ) : (
                                <Navigate to="/dashboard" />
                            )
                        }
                    />
                    <Route
                        path="/signup"
                        element={
                            !authUser ? <SignupPage /> : <Navigate to="/" />
                        }
                    />
                    <Route
                        path="/login"
                        element={
                            !authUser ? <LoginPage /> : <Navigate to="/" />
                        }
                    />
                    <Route
                        path="/dashboard"
                        element={
                            authUser ? (
                                authUser.role === "livreur" ? (
                                    <DashboardPageLivreur />
                                ) : authUser.role === "commercant" ? (
                                    <DashboardPageCommercant />
                                ) : authUser.role === "admin" ? (
                                    <DashboardPageAdmin />
                                ) : authUser.role === "client" ? (
                                    <Navigate to="/commandes" />
                                ) : (
                                    <Navigate to="/login" />
                                )
                            ) : (
                                <Navigate to="/login" />
                            )
                        }
                    />
                    <Route
                        path="/profil"
                        element={
                            authUser ? (
                                <ProfilePage />
                            ) : (
                                <Navigate to="/login" />
                            )
                        }
                    />
                    <Route
                        path="/profile/:username"
                        element={
                            authUser ? (
                                <ProfilePage />
                            ) : (
                                <Navigate to="/login" />
                            )
                        }
                    />

                    <Route
                        path="/livreurs"
                        element={
                            authUser &&
                            (authUser.role === "commercant" ||
                                authUser.role === "admin") ? (
                                <SelectLivreurPage />
                            ) : (
                                <Navigate to="/login" />
                            )
                        }
                    />
                    <Route
                        path="/livreurs/:commandeId"
                        element={
                            authUser &&
                            (authUser.role === "commercant" ||
                                authUser.role === "admin") ? (
                                <SelectLivreurPage />
                            ) : (
                                <Navigate to="/login" />
                            )
                        }
                    />

                    <Route
                        path="/commandes"
                        element={
                            authUser ? (
                                <CommandesListePage />
                            ) : (
                                <Navigate to="/login" />
                            )
                        }
                    />
                    <Route
                        path="/commandes/create"
                        element={
                            authUser ? (
                                <CreateCommandePage />
                            ) : (
                                <Navigate to="/login" />
                            )
                        }
                    />
                    <Route
                        path="/justificative"
                        element={
                            authUser &&
                            (authUser.role === "livreur" ||
                                authUser.role === "admin") ? (
                                <JustificativePage />
                            ) : (
                                <Navigate to="/dashboard" />
                            )
                        }
                    />
                    <Route
                        path="/livraison/:id"
                        element={
                            authUser ? (
                                <CommandeSuivi />
                            ) : (
                                <Navigate to="/login" />
                            )
                        }
                    />
                    <Route
                        path="/gestion/:role"
                        element={
                            authUser && authUser.role === "admin" ? (
                                <GestionUsersPage />
                            ) : (
                                <Navigate to="/login" />
                            )
                        }
                    />

                    <Route
                        path="/gestion-commande"
                        element={
                            authUser && authUser.role === "admin" ? (
                                <GestionCommandePage />
                            ) : (
                                <Navigate to="/login" />
                            )
                        }
                    />

                    <Route
                        path="/livreur/:id/pieces"
                        element={
                            authUser && authUser.role === "admin" ? (
                                <GestionPiecesPage />
                            ) : (
                                <Navigate to="/login" />
                            )
                        }
                    />

                    <Route
                        path="/uploads/:id/:filename"
                        element={
                            authUser ? <ViewDocs /> : <Navigate to="/login" />
                        }
                    />

                    <Route
                        path="/notifications"
                        element={
                            authUser ? (
                                <NotificationsPage />
                            ) : (
                                <Navigate to="/login" />
                            )
                        }
                    />

                    <Route
                        path="/commande/:id"
                        element={
                            authUser ? (
                                <DetailCommande />
                            ) : (
                                <Navigate to="/login" />
                            )
                        }
                    />
                </Routes>
            </main>
            <Toaster />
        </div>
    );
}

export default App;
