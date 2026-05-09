import connection from "../lib/db.js";

export const reactPost = async (req, res) => {
    try {
        const { postId } = req.params;

        const { type } = req.body;

        const userId = req.user.id;

        // validasi type
        if (
            type !== "like" &&
            type !== "dislike"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Reaction hanya like atau dislike"
            });
        }

        // cek post
        const [posts] = await connection.query(
            `
            SELECT * FROM posts
            WHERE id = ?
            `,
            [postId]
        );

        if (posts.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Post tidak ditemukan"
            });
        }

        // cek existing reaction
        const [reactions] =
            await connection.query(
                `
                SELECT * FROM post_reactions
                WHERE post_id = ?
                AND user_id = ?
                `,
                [postId, userId]
            );

        // belum react
        if (reactions.length === 0) {
            await connection.query(
                `
                INSERT INTO post_reactions
                (
                    post_id,
                    user_id,
                    type
                )
                VALUES (?, ?, ?)
                `,
                [postId, userId, type]
            );

            return res.status(201).json({
                success: true,
                message:
                    `Berhasil ${type} post`
            });
        }

        const reaction = reactions[0];

        // toggle off kalau reaction sama
        if (reaction.type === type) {
            await connection.query(
                `
                DELETE FROM post_reactions
                WHERE id = ?
                `,
                [reaction.id]
            );

            return res.status(200).json({
                success: true,
                message:
                    `Berhasil menghapus ${type}`
            });
        }

        // update reaction
        await connection.query(
            `
            UPDATE post_reactions
            SET type = ?
            WHERE id = ?
            `,
            [type, reaction.id]
        );

        return res.status(200).json({
            success: true,
            message:
                `Reaction berhasil diubah menjadi ${type}`
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getPostReactions = async (
    req,
    res
) => {
    try {
        const { postId } = req.params;

        // cek post
        const [posts] = await connection.query(
            `
            SELECT * FROM posts
            WHERE id = ?
            `,
            [postId]
        );

        if (posts.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Post tidak ditemukan"
            });
        }

        const [[counts]] =
            await connection.query(
                `
                SELECT
                    COUNT(
                        CASE
                            WHEN type = 'like'
                            THEN 1
                        END
                    ) AS total_likes,

                    COUNT(
                        CASE
                            WHEN type = 'dislike'
                            THEN 1
                        END
                    ) AS total_dislikes

                FROM post_reactions
                WHERE post_id = ?
                `,
                [postId]
            );

        return res.status(200).json({
            success: true,
            data: counts
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};