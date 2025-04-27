import userModels from "../Models/User.js";
const { User } = userModels;
// Function to update user status (for livreurs)
export const updateUserStatus = async (userId, status) => {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    user.status = status;
    await user.save();

    return user;
};

// Function to delete a user
export const deleteUser = async (userId) => {
    const user = await User.findByIdAndDelete(userId);
    if (!user) throw new Error("User not found");

    return user;
};

// Function to update user profile as admin
export const updateUserProfile = async (userData) => {
    
    const user = await User.findById(userData._id);
    if (!user) throw new Error("User not found");

    Object.assign(user, userData);
    await user.save();

    return user;
};
