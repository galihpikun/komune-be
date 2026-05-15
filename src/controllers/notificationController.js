import connection from "../lib/db.js";


export const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;

        const [notifications] = await connection.query(
            `
            SELECT 
                notifications.*,
                senders.username AS sender_name,
                senders.avatar AS sender_avatar
            FROM notifications
            LEFT JOIN users AS senders ON notifications.sender_id = senders.id
            WHERE notifications.user_id = ?
            ORDER BY notifications.created_at DESC
            `,
            [userId]
        );

  
        if (notifications.length > 0) {
            await connection.query(
                "UPDATE notifications SET is_read = TRUE WHERE user_id = ?",
                [userId]
            );
        }

        return res.status(200).json({
            success: true,
            data: notifications
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


export const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const [result] = await connection.query(
            "DELETE FROM notifications WHERE id = ? AND user_id = ?",
            [id, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Notifikasi tidak ditemukan atau bukan milik Anda"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Notifikasi berhasil dihapus"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


export const clearAllNotifications = async (req, res) => {
    try {
        const userId = req.user.id;

        await connection.query(
            "DELETE FROM notifications WHERE user_id = ?",
            [userId]
        );

        return res.status(200).json({
            success: true,
            message: "Semua notifikasi berhasil dihapus"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};