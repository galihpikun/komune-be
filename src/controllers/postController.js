import connection from "../lib/db.js";
import fs from "fs";

export const getPosts = async (req, res) => {
    try {
        const [posts] = await connection.query(
            `
            SELECT
                posts.*,

                users.username,
                users.avatar,

                forums.name AS forum_name,
                forums.slug AS forum_slug,

                (
                    SELECT COUNT(*)
                    FROM comments
                    WHERE comments.post_id = posts.id
                ) AS total_comments,

                (
                    SELECT COUNT(*)
                    FROM post_reactions
                    WHERE post_reactions.post_id = posts.id
                    AND type = 'like'
                ) AS total_likes,

                (
                    SELECT COUNT(*)
                    FROM post_reactions
                    WHERE post_reactions.post_id = posts.id
                    AND type = 'dislike'
                ) AS total_dislikes,

                (
                    SELECT JSON_ARRAYAGG(image_url)
                    FROM post_images
                    WHERE post_images.post_id = posts.id
                ) AS images

            FROM posts

            JOIN users
            ON users.id = posts.user_id

            JOIN forums
            ON forums.id = posts.forum_id

            WHERE posts.status = 'approved'
            AND posts.is_deleted = FALSE

            ORDER BY posts.created_at DESC
            `
        );

        return res.status(200).json({
            success: true,
            data: posts
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getPostById = async (req, res) => {
    try {
        const { id } = req.params;

        const [posts] = await connection.query(
            `
            SELECT
                posts.*,

                users.username,
                users.avatar,

                forums.name AS forum_name,
                forums.slug AS forum_slug

            FROM posts

            JOIN users
            ON users.id = posts.user_id

            JOIN forums
            ON forums.id = posts.forum_id

            WHERE posts.id = ?
            `,
            [id]
        );

        if (posts.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Post tidak ditemukan"
            });
        }

        const [images] = await connection.query(
            `
            SELECT *
            FROM post_images
            WHERE post_id = ?
            `,
            [id]
        );

        const post = {
            ...posts[0],
            images
        };

        return res.status(200).json({
            success: true,
            data: post
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const createPost = async (req, res) => {
    try {
        const { forum_id, title, content } = req.body;

        const userId = req.user.id;

        // cek forum
        const [forums] = await connection.query(
            "SELECT * FROM forums WHERE id = ?",
            [forum_id]
        );

        if (forums.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Forum tidak ditemukan"
            });
        }

        // cek membership
        const [members] = await connection.query(
            `
            SELECT *
            FROM forum_members
            WHERE forum_id = ?
            AND user_id = ?
            AND status = 'approved'
            `,
            [forum_id, userId]
        );

        if (members.length === 0) {
            return res.status(403).json({
                success: false,
                message:
                    "Kamu belum bergabung di forum ini"
            });
        }

        const [result] = await connection.query(
            `
            INSERT INTO posts
            (
                forum_id,
                user_id,
                title,
                content,
                status
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                forum_id,
                userId,
                title,
                content,
                "pending"
            ]
        );

        const postId = result.insertId;

        // upload multiple images
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                await connection.query(
                    `
                    INSERT INTO post_images
                    (
                        post_id,
                        image_url
                    )
                    VALUES (?, ?)
                    `,
                    [postId, file.filename]
                );
            }
        }

        return res.status(201).json({
            success: true,
            message: "Post berhasil dibuat",
            data: {
                id: postId,
                forum_id: forum_id,
                user_id: userId,
                title: title,
                content: content,
                status: "pending"
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const updatePost = async (req, res) => {
    try {
        const { id } = req.params;

        const { title, content } = req.body;

        const user = req.user;

        const [posts] = await connection.query(
            "SELECT * FROM posts WHERE id = ?",
            [id]
        );

        if (posts.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Post tidak ditemukan"
            });
        }

        const post = posts[0];

        // authorization
        const isOwner = post.user_id === user.id;

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
            UPDATE posts
            SET
                title = ?,
                content = ?
            WHERE id = ?
            `,
            [
                title || post.title,
                content || post.content,
                id
            ]
        );

        // add new images
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                await connection.query(
                    `
                    INSERT INTO post_images
                    (
                        post_id,
                        image_url
                    )
                    VALUES (?, ?)
                    `,
                    [id, file.filename]
                );
            }
        }

        return res.status(200).json({
            success: true,
            message: "Post berhasil diupdate"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const deletePost = async (req, res) => {
    try {
        const { id } = req.params;

        const user = req.user;

        const [posts] = await connection.query(
            "SELECT * FROM posts WHERE id = ?",
            [id]
        );

        if (posts.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Post tidak ditemukan"
            });
        }

        const post = posts[0];

        // authorization
        const isOwner = post.user_id === user.id;

        const isAdmin =
            user.role === "admin" ||
            user.role === "super_admin";

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "Tidak memiliki akses"
            });
        }

        // delete images
        const [images] = await connection.query(
            `
            SELECT *
            FROM post_images
            WHERE post_id = ?
            `,
            [id]
        );

        for (const image of images) {
            const path =
                `uploads/posts/${image.image_url}`;

            if (fs.existsSync(path)) {
                fs.unlinkSync(path);
            }
        }

        await connection.query(
            "DELETE FROM posts WHERE id = ?",
            [id]
        );

        return res.status(200).json({
            success: true,
            message: "Post berhasil dihapus"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const approvePost = async (req, res) => {
    try {
        const { id } = req.params;

        const user = req.user;

        const isAdmin =
            user.role === "admin" ||
            user.role === "super_admin";

        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                message: "Tidak memiliki akses"
            });
        }

        const [posts] = await connection.query(
            "SELECT * FROM posts WHERE id = ?",
            [id]
        );

        if (posts.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Post tidak ditemukan"
            });
        }

        await connection.query(
            `
            UPDATE posts
            SET status = 'approved'
            WHERE id = ?
            `,
            [id]
        );

        return res.status(200).json({
            success: true,
            message: "Post berhasil disetujui"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const rejectPost = async (req, res) => {
    try {
        const { id } = req.params;

        const user = req.user;

        const isAdmin =
            user.role === "admin" ||
            user.role === "super_admin";

        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                message: "Tidak memiliki akses"
            });
        }

        const [posts] = await connection.query(
            "SELECT * FROM posts WHERE id = ?",
            [id]
        );

        if (posts.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Post tidak ditemukan"
            });
        }

        await connection.query(
            `
            UPDATE posts
            SET status = 'rejected'
            WHERE id = ?
            `,
            [id]
        );

        return res.status(200).json({
            success: true,
            message: "Post berhasil ditolak"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};