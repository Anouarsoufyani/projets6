import Notification from "../Models/Notification.js";

export const getNotifications = async (req, res) => {
    const userId = req.user.id;
    try {
        const notifications = await Notification.find({ receiver: userId })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate({
                path: "sender",
                select: "nom",
            });

        await Notification.updateMany({ receiver: userId }, { read: true });

        return res.status(200).json({ success: true, notifications });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

export const deleteNotifications = async (req, res) => {
    const userId = req.user.id;
    try {
        const notifications = await Notification.deleteMany({
            receiver: userId,
        });
        return res.status(200).json({ success: true, notifications });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};
