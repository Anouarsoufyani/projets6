import User from "../Models/User.js";
import jwt from "jsonwebtoken";
export const protectRoute = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;
        if (!token) {
            return res.status(401).json({success: false, error: 'Unauthorized : No token provided'});
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if(!decoded) {
            return res.status(401).json({success: false, error: 'Unauthorized : Invalid token'});
        }

        const user = await User.findById(decoded.userId).select('-password');
        if (!user) {
            return res.status(401).json({success: false, error: 'Unauthorized : User not found'});
        }

        req.user = user;
        next();
    }
    catch (error) {
        console.log("Error protecting route", error.message);
        return res.status(500).json({success: false, error: 'Internal server error'});
    }
}