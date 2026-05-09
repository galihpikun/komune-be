import connection from "../lib/db.js";

export const getCommentsByPost = async (req, res) => {
    try {
        const { postId } = req.params;

        // cek post
        const [posts] = await connection.query(
            "SELECT * FROM posts WHERE id = ?",
            [postId]
        );

        if (posts.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Post tidak ditemukan"
            });
        }

        const [comments] = await connection.query(
            `
            SELECT
                comments.*,

                users.username,
                users.avatar,

                (
                    SELECT COUNT(*)
                    FROM comment_reactions
                    WHERE comment_reactions.comment_id = comments.id
                    AND type = 'like'
                ) AS total_likes,

                (
                    SELECT COUNT(*)
                    FROM comment_reactions
                    WHERE comment_reactions.comment_id = comments.id
                    AND type = 'dislike'
                ) AS total_dislikes

            FROM comments

            JOIN users
            ON users.id = comments.user_id

            WHERE comments.post_id = ?
            AND comments.is_deleted = FALSE

            ORDER BY comments.created_at ASC
            `,
            [postId]
        );

        return res.status(200).json({
            success: true,
            data: comments
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const createComment = async (req, res) => {
    try {
        const { post_id, content, parent_comment_id } =
            req.body;

        const userId = req.user.id;

        // cek post
        const [posts] = await connection.query(
            "SELECT * FROM posts WHERE id = ?",
            [post_id]
        );

        if (posts.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Post tidak ditemukan"
            });
        }

        const post = posts[0];

        // cek locked
        if (post.is_locked) {
            return res.status(403).json({
                success: false,
                message: "Komentar pada post ini dikunci"
            });
        }

        // cek parent comment kalau reply
        if (parent_comment_id) {
            const [parentComments] =
                await connection.query(
                    `
                    SELECT * FROM comments
                    WHERE id = ?
                    `,
                    [parent_comment_id]
                );

            if (parentComments.length === 0) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Parent comment tidak ditemukan"
                });
            }
        }

        const [result] = await connection.query(
            `
            INSERT INTO comments
            (
                post_id,
                user_id,
                parent_comment_id,
                content
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                post_id,
                userId,
                parent_comment_id || null,
                content
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Komentar berhasil dibuat",
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

export const updateComment = async (req, res) => {
    try {
        const { id } = req.params;

        const { content } = req.body;

        const user = req.user;

        const [comments] = await connection.query(
            `
            SELECT * FROM comments
            WHERE id = ?
            `,
            [id]
        );

        if (comments.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Komentar tidak ditemukan"
            });
        }

        const comment = comments[0];

        // authorization
        const isOwner =
            comment.user_id === user.id;

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
            UPDATE comments
            SET content = ?
            WHERE id = ?
            `,
            [content, id]
        );

        return res.status(200).json({
            success: true,
            message: "Komentar berhasil diupdate"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const deleteComment = async (req, res) => {
    try {
        const { id } = req.params;

        const user = req.user;

        const [comments] = await connection.query(
            `
            SELECT * FROM comments
            WHERE id = ?
            `,
            [id]
        );

        if (comments.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Komentar tidak ditemukan"
            });
        }

        const comment = comments[0];

        // authorization
        const isOwner =
            comment.user_id === user.id;

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
            DELETE FROM comments
            WHERE id = ?
            `,
            [id]
        );

        return res.status(200).json({
            success: true,
            message: "Komentar berhasil dihapus"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

