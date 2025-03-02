import { generateTokenAndSetCookie } from "../Lib/utils/generateToken.js";
import User from "../Models/User.js";
import bcrypt from "bcryptjs";

export const signup = async (req, res) => {
    // validation for req.body
    const { username, email, password, fullName, userType } = req.body;
    // Regular expression for email validation (i dont understand but ok)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    try {
        // validation for email
        if (!emailRegex.test(email)) {
            return res
                .status(400)
                .json({ success: false, error: "Invalid email address" });
        }
        // checking if username already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res
                .status(400)
                .json({ success: false, error: "Username already taken" });
        }
        // checking if email already exists
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res
                .status(400)
                .json({ success: false, error: "Email already taken" });
        }
        // checking if password is at least 6 characters
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: "Password must be at least 6 characters",
            });
        }

        if (
            userType !== "livreur" &&
            userType !== "client" &&
            userType !== "commercant"
        ) {
            return res
                .status(400)
                .json({ success: false, error: "Invalid user type" });
        }
        //hash password
        // example : pass os 123456 -> it will be something like wuijfowebf327423gr784vbf47
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        if (!username || !email || !password || !fullName || !userType) {
            return res
                .status(400)
                .json({ success: false, error: "All fields are required" });
        }

        const newUser = new User({
            username,
            fullName,
            email,
            userType,
            password: hashedPassword,
        });

        if (newUser) {
            generateTokenAndSetCookie(newUser._id, res);
            await newUser.save();
            return res.status(201).json({
                success: true,
                message: "User created successfully",
                _id: newUser._id,
                fullName: newUser.fullName,
                username: newUser.username,
                email: newUser.email,
                profilePic: newUser.profilePic,
                userType: newUser.userType,
            });
        } else {
            console.log("error", error.message);
            return res
                .status(400)
                .json({ success: false, error: "Invalid user data" });
        }
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const login = async (req, res) => {
    const { username, password } = req.body;

    try {
        // validation
        if (!username || !password) {
            return res
                .status(400)
                .json({ success: false, error: "All fields are required" });
        }

        const user = await User.findOne({ username });
        const isPasswordValid = await bcrypt.compare(
            password,
            user?.password || ""
        );

        if (user && isPasswordValid) {
            generateTokenAndSetCookie(user._id, res);
            res.status(200).json({
                success: true,
                message: "User logged in successfully",
                _id: user._id,
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                profilePic: user.profilePic,
                userType: user.userType,
            });
        } else {
            console.log("error", error.message);
            return res.status(400).json({
                success: false,
                error: "Invalid username or password",
            });
        }
    } catch (error) {
        console.log("Error logging in", error.message);
        return res
            .status(400)
            .json({ success: false, error: "Invalid username or password" });
    }
};
export const logout = async (req, res) => {
    try {
        res.cookie("jwt", "", { maxAge: 0 });
        return res
            .status(200)
            .json({ success: true, message: "Logged out successfully" });
    } catch (error) {
        console.log("Error logging out", error.message);
        return res.status(400).json({ success: false, error: "Logout failed" });
    }
};

export const getDashboard = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");
        return res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: "Not connected" });
    }
};
