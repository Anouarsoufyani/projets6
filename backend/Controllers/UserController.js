import User from "../Models/User.js";
import bcrypt from "bcryptjs";

export const getUserProfile = async (req, res) => {
    // validation for req.params
    const { username } = req.params;

    try {
        // checking if user exists
        const user = await User.findOne({ username }).select("-password");
        if (!user) {
            return res
                .status(404)
                .json({ success: false, error: "User not found" });
        }
        return res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const updateProfile = async (req, res) => {
    const {
        fullName,
        username,
        email,
        newPassword,
        currentPassword,
        bio,
        links,
    } = req.body;
    let { profilePic, coverPic } = req.body;

    try {
        let profile = await User.findById(req.user._id);

        if (!profile) {
            return res
                .status(404)
                .json({ success: false, error: "User not found" });
        }

        // Password validation
        if (
            (newPassword && !currentPassword) ||
            (!newPassword && currentPassword)
        ) {
            return res
                .status(400)
                .json({ success: false, error: "All fields are required" });
        } else if (newPassword && currentPassword) {
            const isPasswordValid = await bcrypt.compare(
                currentPassword,
                profile.password
            );
            if (!isPasswordValid) {
                return res.status(400).json({
                    success: false,
                    error: "The passwords don't match",
                });
            }
            if (newPassword.length < 6) {
                return res.status(400).json({
                    success: false,
                    error: "Password must be at least 6 characters",
                });
            }
            const salt = await bcrypt.genSalt(10);
            profile.password = await bcrypt.hash(newPassword, salt);
        }

        if (profilePic) {
            if (profile.profilePic) {
                await cloudinary.uploader.destroy(
                    profile.profilePic.split("/").pop().split(".")[0]
                );
                // console.log(path.basename(profile.profilePic));
                // console.log(profile.profilePic.split('/').pop().split('.')[0]);
                // console.log(profile.profilePic.split('/').pop());
            }
            const uploadResult = await cloudinary.uploader.upload(profilePic);
            profile.profilePic = uploadResult.secure_url;
            // console.log(uploadResult, uploadResult.secure_url);
        }
        if (coverPic) {
            if (profile.coverPic) {
                await cloudinary.uploader.destroy(
                    profile.coverPic.split("/").pop().split(".")[0]
                );
            }
            const uploadResult = await cloudinary.uploader.upload(coverPic);
            profile.coverPic = uploadResult.secure_url;
        }

        // if(fullName) {
        //     profile.fullName = fullName;
        // }
        // pareil mais plus simple
        profile.fullName = fullName || profile.fullName;
        profile.username = username || profile.username;
        profile.email = email || profile.email;
        profile.bio = bio || profile.bio;
        profile.links = links || profile.links;

        profile = await profile.save();

        // remove password from response
        profile.password = null;

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: profile,
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select("-password");
        return res.status(200).json({
            success: true,
            data: users,
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: "Not connected" });
    }
};
