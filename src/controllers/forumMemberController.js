import connection from "../lib/db.js";
import { createNotification } from "../service/notificationService.js";

export const joinForum = async (req, res) => {
    try {
        const { forumId } = req.params;

        const userId = req.user.id;

        // cek forum ada atau tidak
        const [forums] = await connection.query(
            "SELECT * FROM forums WHERE id = ?",
            [forumId]
        );

        if (forums.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Forum tidak ditemukan"
            });
        }

        // cek apakah sudah join/request
        const [members] = await connection.query(
            `
            SELECT * FROM forum_members
            WHERE forum_id = ? AND user_id = ?
            `,
            [forumId, userId]
        );

        if (members.length > 0) {
            return res.status(400).json({
                success: false,
                message:
                    "Kamu sudah join atau sedang menunggu persetujuan"
            });
        }

        // insert join request
        await connection.query(
            `
            INSERT INTO forum_members
            (
                forum_id,
                user_id,
                status
            )
            VALUES (?, ?, ?)
            `,
            [forumId, userId, "pending"]
        );

        return res.status(201).json({
            success: true,
            message:
                "Berhasil mengirim permintaan join forum"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const leaveForum = async (req, res) => {
    try {
        const { forumId } = req.params;

        const userId = req.user.id;

        // cek membership
        const [members] = await connection.query(
            `
            SELECT * FROM forum_members
            WHERE forum_id = ? AND user_id = ?
            `,
            [forumId, userId]
        );

        if (members.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Kamu bukan anggota forum ini"
            });
        }

        await connection.query(
            `
            DELETE FROM forum_members
            WHERE forum_id = ? AND user_id = ?
            `,
            [forumId, userId]
        );

        return res.status(200).json({
            success: true,
            message: "Berhasil keluar dari forum"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getPendingMembers = async (req, res) => {
    try {
        const { forumId } = req.params;

        const user = req.user;

        // cek forum
        const [forums] = await connection.query(
            "SELECT * FROM forums WHERE id = ?",
            [forumId]
        );

        if (forums.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Forum tidak ditemukan"
            });
        }

        const forum = forums[0];

        // authorization
        const isOwner = forum.created_by === user.id;
        const isAdmin =
            user.role === "admin" ||
            user.role === "super_admin";

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "Tidak memiliki akses"
            });
        }

        const [members] = await connection.query(
            `
            SELECT
                forum_members.id,
                forum_members.status,
                forum_members.created_at,

                users.id AS user_id,
                users.username,
                users.avatar

            FROM forum_members

            JOIN users
            ON users.id = forum_members.user_id

            WHERE forum_members.forum_id = ?
            AND forum_members.status = 'pending'

            ORDER BY forum_members.created_at DESC
            `,
            [forumId]
        );

        return res.status(200).json({
            success: true,
            data: members
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const approveMember = async (req, res) => {
    try {
        const { memberId } = req.params;

        const user = req.user;

        // cek membership
        const [members] = await connection.query(
            `
            SELECT
                forum_members.*,
                forums.created_by

            FROM forum_members

            JOIN forums
            ON forums.id = forum_members.forum_id

            WHERE forum_members.id = ?
            `,
            [memberId]
        );

        if (members.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Member request tidak ditemukan"
            });
        }

        const member = members[0];

        // authorization
        const isOwner =
            member.created_by === user.id;

        const isAdmin =
            user.role === "admin" ||
            user.role === "super_admin";

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message:
                    "Tidak memiliki akses"
            });
        }

        // sudah approved
        if (member.status === "approved") {
            return res.status(400).json({
                success: false,
                message:
                    "Member sudah disetujui"
            });
        }

        await connection.query(
            `
            UPDATE forum_members
            SET status = 'approved'
            WHERE id = ?
            `,
            [memberId]
        );

        // notification
        await createNotification({
            user_id: member.user_id,
            sender_id: user.id,
            type: "join_approved",
            reference_id: member.forum_id
        });

        return res.status(200).json({
            success: true,
            message:
                "Member berhasil disetujui"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const rejectMember = async (req, res) => {
    try {
        const { memberId } = req.params;

        const user = req.user;

        // cek membership
        const [members] = await connection.query(
            `
            SELECT
                forum_members.*,
                forums.created_by
            FROM forum_members

            JOIN forums
            ON forums.id = forum_members.forum_id

            WHERE forum_members.id = ?
            `,
            [memberId]
        );

        if (members.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Member request tidak ditemukan"
            });
        }

        const member = members[0];

        // authorization
        const isOwner =
            member.created_by === user.id;

        const isAdmin =
            user.role === "admin" ||
            user.role === "super_admin";

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "Tidak memiliki akses"
            });
        }

        await connection.query(
            `
            UPDATE forum_members
            SET status = 'rejected'
            WHERE id = ?
            `,
            [memberId]
        );

        return res.status(200).json({
            success: true,
            message: "Member berhasil ditolak"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};