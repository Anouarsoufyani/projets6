import { Route, Routes, Navigate } from "react-router";
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
import { useAuthUserQuery } from "./Hooks/useAuthQueries";
import CreateCommandePage from "./Pages/Commandes/CreateCommandePage";
import CommandeSuivi from "./Pages/Commandes/CommandeSuivi";
import NotificationsPage from "./Pages/User/NotificationsPage";

import GestionPiecesPage from "./Pages/Admin/GestionPiecesPage";
import DashboardPageAdmin from "./Pages/Admin/DashboardPageAdmin";
import GestionUsersPage from "./Pages/Admin/GestionUsersPage";

import ViewDocs from "./Pages/Documents/ViewDocs";

function App() {
    const navbarSize = "4rem";
    const sidebarSize = "18rem";

    const { data: authUser, isLoading } = useAuthUserQuery();

    if (isLoading) {
        return (
            <div className="h-screen flex justify-center items-center">
                <span className="loading loading-dots loading-lg"></span>
            </div>
        );
    }

    return (
        <div className={`flex flex-col w-full m-0 h-screen`}>
            {authUser && (
                <Sidebar
                    authUser={authUser}
                    sidebarSize={sidebarSize}
                    navbarHeight={navbarSize}
                />
            )}
            <Navbar isLoggedIn={!!authUser} navbarHeight={navbarSize} />
            <div
                className={`h-screen`}
                style={
                    authUser
                        ? {
                              marginLeft: sidebarSize,
                              width: `calc(100% - ${sidebarSize})`,
                              height: `calc(100vh - ${navbarSize})`,
                          }
                        : { height: `calc(100vh - ${navbarSize})` }
                }
            >
                <Routes>
                    <Route
                        path="/"
                        element={
                            !authUser ? (
                                <HomePage navbarHeight={navbarSize} />
                            ) : authUser.role === "client" ||
                              authUser.role === "admin" ? (
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
                    {/* <Route
                        path="/client/gestion"
                        element={
                            authUser && authUser.role === "admin" ? (
                                <GestionClientPage />
                            ) : (
                                <Navigate to="/login" />
                            )
                        }
                    />
                    <Route
                        path="/livreur/gestion"
                        element={
                            authUser && authUser.role === "admin" ? (
                                <GestionLivreurPage />
                            ) : (
                                <Navigate to="/login" />
                            )
                        }
                    />
                    <Route
                        path="/commercant/gestion"
                        element={
                            authUser && authUser.role === "admin" ? (
                                <GestionCommercantPage />
                            ) : (
                                <Navigate to="/login" />
                            )
                        }
                    /> */}
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
                </Routes>
            </div>
            <Toaster />
        </div>
    );
}

export default App;
