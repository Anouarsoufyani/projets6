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
            })
            .populate({
                path: "commande_id",
                select: "livreur_id",
            });

        await Notification.updateMany({ receiver: userId }, { read: true });

        return res.status(200).json({ success: true, notifications });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

export const deleteAllNotifications = async (req, res) => {
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

export const deleteNotifications = async (req, res) => {
    const notificationId = req.params.notificationId;

    try {
        const notification = await Notification.findByIdAndDelete(
            notificationId
        );
        if (!notification) {
            return res.status(404).json({
                success: false,
                error: "Notification non trouv e",
            });
        }
        return res.status(200).json({ success: true, notification });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

export const markAsReadNotifications = async (req, res) => {
    const notificationId = req.params.notificationId;

    try {
        const notification = await Notification.findByIdAndUpdate(
            notificationId,
            { read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                error: "Notification non trouvée",
            });
        }

        return res.status(200).json({ success: true, notification });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};
