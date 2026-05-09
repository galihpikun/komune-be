import connection from "../lib/db.js";

export const getReports = async (req, res) => {
    try {
        const user = req.user;

        // authorization
        const isAdmin =
            user.role === "admin" ||
            user.role === "super_admin";

        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                message: "Tidak memiliki akses"
            });
        }

        const [reports] = await connection.query(
            `
            SELECT
                reports.*,

                reporter.username AS reporter_username,
                reporter.avatar AS reporter_avatar,

                posts.title AS post_title,

                comments.content AS comment_content

            FROM reports

            JOIN users AS reporter
            ON reporter.id = reports.reporter_id

            LEFT JOIN posts
            ON posts.id = reports.post_id

            LEFT JOIN comments
            ON comments.id = reports.comment_id

            ORDER BY reports.created_at DESC
            `
        );

        return res.status(200).json({
            success: true,
            data: reports
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const createReport = async (
    req,
    res
) => {
    try {
        const {
            post_id,
            comment_id,
            reason
        } = req.body;

        const userId = req.user.id;

        // harus salah satu
        if (!post_id && !comment_id) {
            return res.status(400).json({
                success: false,
                message:
                    "Report harus memiliki post_id atau comment_id"
            });
        }

        // tidak boleh dua-duanya
        if (post_id && comment_id) {
            return res.status(400).json({
                success: false,
                message:
                    "Hanya boleh report post atau comment"
            });
        }

        // cek post
        if (post_id) {
            const [posts] =
                await connection.query(
                    `
                    SELECT * FROM posts
                    WHERE id = ?
                    `,
                    [post_id]
                );

            if (posts.length === 0) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Post tidak ditemukan"
                });
            }
        }

        // cek comment
        if (comment_id) {
            const [comments] =
                await connection.query(
                    `
                    SELECT * FROM comments
                    WHERE id = ?
                    `,
                    [comment_id]
                );

            if (comments.length === 0) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Komentar tidak ditemukan"
                });
            }
        }

        // cek duplicate report
        const [reports] =
            await connection.query(
                `
                SELECT * FROM reports
                WHERE reporter_id = ?
                AND (
                    post_id = ?
                    OR comment_id = ?
                )
                `,
                [
                    userId,
                    post_id || null,
                    comment_id || null
                ]
            );

        if (reports.length > 0) {
            return res.status(400).json({
                success: false,
                message:
                    "Kamu sudah mereport konten ini"
            });
        }

        const [result] =
            await connection.query(
                `
                INSERT INTO reports
                (
                    reporter_id,
                    post_id,
                    comment_id,
                    reason
                )
                VALUES (?, ?, ?, ?)
                `,
                [
                    userId,
                    post_id || null,
                    comment_id || null,
                    reason
                ]
            );

        return res.status(201).json({
            success: true,
            message:
                "Report berhasil dikirim",
            data: {
                id: result.insertId
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const resolveReport = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        const user = req.user;

        // authorization
        const isAdmin =
            user.role === "admin" ||
            user.role === "super_admin";

        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                message: "Tidak memiliki akses"
            });
        }

        const [reports] =
            await connection.query(
                `
                SELECT * FROM reports
                WHERE id = ?
                `,
                [id]
            );

        if (reports.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Report tidak ditemukan"
            });
        }

        await connection.query(
            `
            UPDATE reports
            SET status = 'resolved'
            WHERE id = ?
            `,
            [id]
        );

        return res.status(200).json({
            success: true,
            message:
                "Report berhasil diselesaikan"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const reviewReport = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        const user = req.user;

        // authorization
        const isAdmin =
            user.role === "admin" ||
            user.role === "super_admin";

        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                message: "Tidak memiliki akses"
            });
        }

        const [reports] =
            await connection.query(
                `
                SELECT * FROM reports
                WHERE id = ?
                `,
                [id]
            );

        if (reports.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Report tidak ditemukan"
            });
        }

        await connection.query(
            `
            UPDATE reports
            SET status = 'reviewed'
            WHERE id = ?
            `,
            [id]
        );

        return res.status(200).json({
            success: true,
            message:
                "Report sedang direview"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const deleteReport = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        const user = req.user;

        // authorization
        const isAdmin =
            user.role === "admin" ||
            user.role === "super_admin";

        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                message: "Tidak memiliki akses"
            });
        }

        const [reports] =
            await connection.query(
                `
                SELECT * FROM reports
                WHERE id = ?
                `,
                [id]
            );

        if (reports.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Report tidak ditemukan"
            });
        }

        await connection.query(
            `
            DELETE FROM reports
            WHERE id = ?
            `,
            [id]
        );

        return res.status(200).json({
            success: true,
            message:
                "Report berhasil dihapus"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};