import connection from "../lib/db.js";

export const reactComment = async (req, res) => {
    try {
        const { commentId } = req.params;

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

        // cek comment
        const [comments] =
            await connection.query(
                `
                SELECT * FROM comments
                WHERE id = ?
                `,
                [commentId]
            );

        if (comments.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Komentar tidak ditemukan"
            });
        }

        // cek existing reaction
        const [reactions] =
            await connection.query(
                `
                SELECT * FROM comment_reactions
                WHERE comment_id = ?
                AND user_id = ?
                `,
                [commentId, userId]
            );

        // belum react
        if (reactions.length === 0) {
            await connection.query(
                `
                INSERT INTO comment_reactions
                (
                    comment_id,
                    user_id,
                    type
                )
                VALUES (?, ?, ?)
                `,
                [commentId, userId, type]
            );

            return res.status(201).json({
                success: true,
                message:
                    `Berhasil ${type} komentar`
            });
        }

        const reaction = reactions[0];

        // toggle off kalau reaction sama
        if (reaction.type === type) {
            await connection.query(
                `
                DELETE FROM comment_reactions
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
            UPDATE comment_reactions
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

export const getCommentReactions = async (
    req,
    res
) => {
    try {
        const { commentId } = req.params;

        // cek comment
        const [comments] =
            await connection.query(
                `
                SELECT * FROM comments
                WHERE id = ?
                `,
                [commentId]
            );

        if (comments.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Komentar tidak ditemukan"
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

                FROM comment_reactions
                WHERE comment_id = ?
                `,
                [commentId]
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