import connection from "../lib/db.js";
import slugify from "slugify";
import fs from "fs";

export const getForums = async (req, res) => {
  try {
    const [forums] = await connection.query("SELECT * FROM forums");

    return res.status(200).json({
      code: 200,
      message: "Berhasil ngambil forums",
      success: true,
      data: forums,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
};

export const getForumById = async (req, res) => {
    const forumId = req.params;
    try {
        const [forum] = await connection.query("SELECT * FROM forums WHERE id = ?", [forumId]);

        if (forum.length === 0) {
            return res.status(404).json({
                code: 404,
                message: "Forum dengan ID " + forumId + " tidak ditemukan",
            });
        }

        return res.status(200).json({
            code:200,
            message: "Berhasil mengambil forum dengan ID " + forumId,
            success: true,
            data: forum
        })
    } catch (error) {
        console.error(error);
    return res.status(500).json({
      code: 500,
      message: "Gagal mengambil forum dengan ID" + forumId,
    });
    }
};

export const createForum = async (req, res) => {
    try {
        const { name, description } = req.body;

        const userId = req.user.id;

        const slug = slugify(name, {
            lower: true,
            strict: true
        });

        const iconImage = req.files["icon_image"]
            ? req.files["icon_image"][0].filename
            : null;

        const bannerImage = req.files["banner_image"]
            ? req.files["banner_image"][0].filename
            : null;

        const [result] = await connection.query(
            `
            INSERT INTO forums
            (
                name,
                slug,
                description,
                icon_image,
                banner_image,
                created_by
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                name,
                slug,
                description,
                iconImage,
                bannerImage,
                userId
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Forum berhasil dibuat",
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

export const updateForum = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        const user = req.user;

        const [forums] = await connection.query(
            "SELECT * FROM forums WHERE id = ?",
            [id]
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

        const slug = name
            ? slugify(name, {
                  lower: true,
                  strict: true
              })
            : forum.slug;

        let iconImage = forum.icon_image;
        let bannerImage = forum.banner_image;

        // replace icon
        if (req.files["icon_image"]) {
            if (forum.icon_image) {
                fs.unlinkSync(
                    `uploads/forums/${forum.icon_image}`
                );
            }

            iconImage =
                req.files["icon_image"][0].filename;
        }

        // replace banner
        if (req.files["banner_image"]) {
            if (forum.banner_image) {
                fs.unlinkSync(
                    `uploads/forums/${forum.banner_image}`
                );
            }

            bannerImage =
                req.files["banner_image"][0].filename;
        }

        await connection.query(
            `
            UPDATE forums
            SET
                name = ?,
                slug = ?,
                description = ?,
                icon_image = ?,
                banner_image = ?
            WHERE id = ?
            `,
            [
                name || forum.name,
                slug,
                description || forum.description,
                iconImage,
                bannerImage,
                id
            ]
        );

        return res.status(200).json({
            success: true,
            message: "Forum berhasil diupdate"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const deleteForum = async (req, res) => {
    try {
        const { id } = req.params;

        const user = req.user;

        const [forums] = await connection.query(
            "SELECT * FROM forums WHERE id = ?",
            [id]
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

        // delete icon
        if (forum.icon_image) {
            fs.unlinkSync(
                `uploads/forums/${forum.icon_image}`
            );
        }

        // delete banner
        if (forum.banner_image) {
            fs.unlinkSync(
                `uploads/forums/${forum.banner_image}`
            );
        }

        await connection.query(
            "DELETE FROM forums WHERE id = ?",
            [id]
        );

        return res.status(200).json({
            success: true,
            message: "Forum berhasil dihapus"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};