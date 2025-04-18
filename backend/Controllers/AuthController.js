import { generateTokenAndSetCookie } from "../Lib/utils/generateToken.js";
import userModels from "../Models/User.js";
const { User, Client, Commercant, Livreur, Admin } = userModels;
import bcrypt from "bcryptjs";

export const signup = async (req, res) => {
    // validation for req.body
    const { email, nom, password, numero, role } = req.body;

    // Regular expression for email validation (i dont understand but ok)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    try {
        // validation for email
        if (!emailRegex.test(email)) {
            return res
                .status(400)
                .json({ success: false, error: "Invalid email address" });
        }

        // checking if email already exists
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res
                .status(400)
                .json({ success: false, error: "Email already taken" });
        }

        const existingNumber = await User.findOne({ numero });
        if (existingNumber) {
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

        //hash password
        // example : pass os 123456 -> it will be something like wuijfowebf327423gr784vbf47
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        if (!nom || !email || !password || !numero || !role) {
            return res
                .status(400)
                .json({ success: false, error: "All fields are required" });
        }

        if (
            role !== "livreur" &&
            role !== "client" &&
            role !== "commercant" &&
            role !== "admin"
        ) {
            return res
                .status(400)
                .json({ success: false, error: "Invalid user type" });
        }

        let newUser;

        if (role === "livreur") {
            newUser = new Livreur({
                nom,
                numero,
                email,
                role,
                statut: "non vérifié",
                password: hashedPassword,
            });
        } else if (role === "commercant") {
            newUser = new Commercant({
                nom,
                numero,
                email,
                role,
                password: hashedPassword,
            });
        } else if (role === "client") {
            newUser = new Client({
                nom,
                numero,
                email,
                role,
                password: hashedPassword,
            });
        } else if (role === "admin") {
            newUser = new Admin({
                nom,
                numero,
                email,
                role,
                password: hashedPassword,
            });
        }

        console.log(newUser);

        if (newUser) {
            await newUser.save();

            generateTokenAndSetCookie(newUser._id, res);

            return res.status(201).json({
                success: true,
                message: "User created successfully",
                _id: newUser._id,
                name: newUser.nom,
                numero: newUser.numero,
                email: newUser.email,
                profilePic: newUser.profilePic,
                role: newUser.role,
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
    const { email, password } = req.body;

    try {
        // validation
        if (!email || !password) {
            return res
                .status(400)
                .json({ success: false, error: "All fields are required" });
        }

        const user = await User.findOne({ email });
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
                nom: user.nom,
                numero: user.numero,
                email: user.email,
                profilePic: user.profilePic,
                role: user.role,
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
        const { id } = req.body;
        if (id) {
            const livreur = await User.findById(id).select("-password");
            if (livreur.isWorking == true && livreur.disponibilite == true) {
                livreur.isWorking = false;
                await livreur.save();
            }
        }
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
