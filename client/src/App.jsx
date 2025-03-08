import { Route, Routes, Navigate } from "react-router";
import SignupPage from "./Pages/Auth/SignUp/SignupPage";
import LoginPage from "./Pages/Auth/Login/LoginPage";
import HomePage from "./Pages/Home/HomePage";
// import NotificationPage from "./Pages/Notification/NotificationPage"
import ProfilePage from "./Pages/User/ProfilePage";
import DashboardPage from "./Pages/User/DashboardPage";
import Navbar from "./Components/Navigation/Navbar";
import Sidebar from "./Components/Navigation/Sidebar";
// import RightPanel from "./Components/common/RightPanel"
import { Toaster } from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";

function App() {
    const { data: authUser, isLoading } = useQuery({
        queryKey: ["authUser"],
        queryFn: async () => {
            const res = await fetch("/api/auth/dashboard");
            const data = await res.json();
            if (data.error) {
                return null;
            }
            if (!res.ok) {
                throw new Error(data.error || "Something went wrong");
            }
            console.log("authUser", data);

            return data.data;
        },
        retry: false,
    });

    if (isLoading) {
        return (
            <div className="h-screen flex justify-center items-center">
                <span className="loading loading-dots loading-lg"></span>
            </div>
        );
    }

    return (
        <div className="flex flex-col w-full m-0 min-h-screen">
            {authUser && <Sidebar />}
            <Navbar isLoggedIn={!!authUser} />
            <Routes>
                <Route
                    path="/"
                    element={
                        !authUser ? <HomePage /> : <Navigate to="/dashboard" />
                    }
                />
                <Route
                    path="/signup"
                    element={!authUser ? <SignupPage /> : <Navigate to="/" />}
                />
                <Route
                    path="/login"
                    element={!authUser ? <LoginPage /> : <Navigate to="/" />}
                />
                <Route
                    path="/dashboard"
                    element={
                        authUser ? <DashboardPage /> : <Navigate to="/login" />
                    }
                />
                <Route
                    path="/profil"
                    element={
                        authUser ? <ProfilePage /> : <Navigate to="/login" />
                    }
                />
                {/* <Route
                    path="/notifications"
                    element={
                        authUser ? (
                            <NotificationPage />
                        ) : (
                            <Navigate to="/login" />
                        )
                    }
                /> */}
                <Route
                    path="/profile/:username"
                    element={
                        authUser ? <ProfilePage /> : <Navigate to="/login" />
                    }
                />
            </Routes>
            {/* {authUser && <RightPanel />} */}
            <Toaster />
        </div>
    );
}

export default App;
