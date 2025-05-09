import userModels from "../Models/User.js";
const { User } = userModels;

export const updateUserStatus = async (userId, status) => {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    user.status = status;
    await user.save();

    return user;
};


export const deleteUser = async (userId) => {
    const user = await User.findByIdAndDelete(userId);
    if (!user) throw new Error("User not found");

    return user;
};


export const updateUserProfile = async (userData) => {
    
    const user = await User.findById(userData._id);
    if (!user) throw new Error("User not found");

    Object.assign(user, userData);
    await user.save();

    return user;
};
