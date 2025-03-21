import { Route, Routes, Navigate } from "react-router";
import SignupPage from "./Pages/Auth/SignUp/SignupPage";
import LoginPage from "./Pages/Auth/Login/LoginPage";
import HomePage from "./Pages/Home/HomePage";
// import NotificationPage from "./Pages/Notification/NotificationPage"
import ProfilePage from "./Pages/Profile/ProfilePage";
import DashboardPage from "./Pages/User/DashboardPage";
import Navbar from "./Components/Navigation/Navbar";
import Sidebar from "./Components/Navigation/Sidebar";
import SelectLivreurPage from "./Pages/Livraisons/SelectLivreurPage";
import CommandesListePage from "./Pages/Commandes/CommandesListePage";
// import RightPanel from "./Components/common/RightPanel"
import { Toaster } from "react-hot-toast";
import { useAuthUserQuery } from "./Hooks/useAuthQueries";
import CreateCommandePage from "./Pages/Commandes/CreateCommandePage";
import CommandeSuivi from "./Pages/Commandes/CommandeSuivi";

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
        <div className={`flex flex-col w-full m-0 min-h-screen`}>
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
                        : {}
                }
            >
                <Routes>
                    <Route
                        path="/"
                        element={
                            !authUser ? (
                                <HomePage navbarHeight={navbarSize} />
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
                                <DashboardPage />
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
                            authUser && authUser.role == "commercant" ? (
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
                        path="/livraison/:id"
                        element={
                            authUser ? (
                                <CommandeSuivi />
                            ) : (
                                <Navigate to="/login" />
                            )
                        }
                    />
                </Routes>
            </div>

            {/* {authUser && <RightPanel />} */}
            <Toaster />
        </div>
    );
}

export default App;
