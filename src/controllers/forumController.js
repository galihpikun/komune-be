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

export const getForumBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const [forums] = await connection.query(
      `
      SELECT
          forums.*,

          users.id AS creator_id,
          users.username AS creator_username,
          users.avatar AS creator_avatar,

          COUNT(DISTINCT forum_members.id)
          AS total_members,

          COUNT(DISTINCT posts.id)
          AS total_posts,

          COUNT(DISTINCT comments.id) AS total_comments

      FROM forums

      JOIN users
      ON users.id = forums.created_by

      LEFT JOIN forum_members
      ON forum_members.forum_id = forums.id
      AND forum_members.status = 'approved'

      LEFT JOIN posts
      ON posts.forum_id = forums.id
      AND posts.status = 'approved'

      WHERE forums.slug = ?

      GROUP BY forums.id
      `,
      [slug],
    );

    if (forums.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Forum tidak ditemukan",
      });
    }

    return res.status(200).json({
      success: true,
      data: forums[0],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createForum = async (req, res) => {
  try {
    const { name, description } = req.body;

    const userId = req.user.id;

    const slug = slugify(name, {
      lower: true,
      strict: true,
    });

    const iconImage = req.files["icon_image"]
      ? req.files["icon_image"][0].filename
      : null;

    const bannerImage = req.files["banner_image"]
      ? req.files["banner_image"][0].filename
      : null;

    // create forum
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
      [name, slug, description, iconImage, bannerImage, userId],
    );

    const forumId = result.insertId;

    // auto join owner
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
      [forumId, userId, "approved"],
    );

    return res.status(201).json({
      success: true,
      message: "Forum berhasil dibuat",
      data: {
        id: forumId,
        name,
        slug,
        description,
        icon_image: iconImage,
        banner_image: bannerImage,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
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
      [id],
    );

    if (forums.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Forum tidak ditemukan",
      });
    }

    const forum = forums[0];

    // authorization
    const isOwner = forum.created_by === user.id;
    const isAdmin = user.role === "admin" || user.role === "super_admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Tidak memiliki akses",
      });
    }

    const slug = name
      ? slugify(name, {
          lower: true,
          strict: true,
        })
      : forum.slug;

    let iconImage = forum.icon_image;
    let bannerImage = forum.banner_image;

    // replace icon
    if (req.files["icon_image"]) {
      if (forum.icon_image) {
        fs.unlinkSync(`uploads/forums/${forum.icon_image}`);
      }

      iconImage = req.files["icon_image"][0].filename;
    }

    // replace banner
    if (req.files["banner_image"]) {
      if (forum.banner_image) {
        fs.unlinkSync(`uploads/forums/${forum.banner_image}`);
      }

      bannerImage = req.files["banner_image"][0].filename;
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
        id,
      ],
    );

    return res.status(200).json({
      success: true,
      message: "Forum berhasil diupdate",
      data: {
        id: forum.id,
        name: name || forum.name,
        slug: slug,
        description: description || forum.description,
        icon_image: iconImage,
        banner_image: bannerImage,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteForum = async (req, res) => {
  try {
    const { id } = req.params;

    const user = req.user;

    const [forums] = await connection.query(
      "SELECT * FROM forums WHERE id = ?",
      [id],
    );

    if (forums.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Forum tidak ditemukan",
      });
    }

    const forum = forums[0];

    // authorization
    const isOwner = forum.created_by === user.id;
    const isAdmin = user.role === "admin" || user.role === "super_admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Tidak memiliki akses",
      });
    }

    // delete icon
    if (forum.icon_image) {
      fs.unlinkSync(`uploads/forums/${forum.icon_image}`);
    }

    // delete banner
    if (forum.banner_image) {
      fs.unlinkSync(`uploads/forums/${forum.banner_image}`);
    }

    await connection.query("DELETE FROM forums WHERE id = ?", [id]);

    return res.status(200).json({
      success: true,
      message: "Forum berhasil dihapus",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMostTrendingForums = async (req, res) => {
  try {
    const [forums] = await connection.query(
      `
            SELECT
                forums.*,

                COUNT(forum_members.id)
                AS total_members

            FROM forums

            LEFT JOIN forum_members
            ON forum_members.forum_id = forums.id
            AND forum_members.status = 'approved'

            GROUP BY forums.id

            ORDER BY total_members DESC

            LIMIT 3
            `,
    );

    return res.status(200).json({
      success: true,
      data: forums,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const joinForum = async (req, res) => {
  try {
    const { forumId } = req.params;

    const userId = req.user.id;

    // cek forum
    const [forums] = await connection.query(
      `
            SELECT * FROM forums
            WHERE id = ?
            `,
      [forumId],
    );

    if (forums.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Forum tidak ditemukan",
      });
    }

    // cek membership
    const [members] = await connection.query(
      `
                SELECT * FROM forum_members
                WHERE forum_id = ?
                AND user_id = ?
                `,
      [forumId, userId],
    );

    if (members.length > 0) {
      const member = members[0];

      // sudah approved
      if (member.status === "approved") {
        return res.status(400).json({
          success: false,
          message: "Kamu sudah join forum ini",
        });
      }

      // masih pending
      if (member.status === "pending") {
        return res.status(400).json({
          success: false,
          message: "Permintaan join masih menunggu persetujuan",
        });
      }

      // rejected -> ubah jadi pending lagi
      await connection.query(
        `
                UPDATE forum_members
                SET status = 'pending'
                WHERE id = ?
                `,
        [member.id],
      );

      return res.status(200).json({
        success: true,
        message: "Permintaan join berhasil dikirim ulang",
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
      [forumId, userId, "pending"],
    );

    return res.status(201).json({
      success: true,
      message: "Berhasil request join forum",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
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
                WHERE forum_id = ?
                AND user_id = ?
                `,
      [forumId, userId],
    );

    if (members.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Kamu bukan member forum ini",
      });
    }

    const member = members[0];

    // owner forum gaboleh leave
    const [forums] = await connection.query(
      `
            SELECT * FROM forums
            WHERE id = ?
            `,
      [forumId],
    );

    if (forums[0].created_by === userId) {
      return res.status(400).json({
        success: false,
        message: "Owner forum tidak dapat keluar dari forum",
      });
    }

    await connection.query(
      `
            DELETE FROM forum_members
            WHERE id = ?
            `,
      [member.id],
    );

    return res.status(200).json({
      success: true,
      message: "Berhasil keluar dari forum",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
