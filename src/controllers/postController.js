import connection from "../lib/db.js";
import fs from "fs";
import { createNotification } from "../service/notificationService.js";

export const getPosts = async (req, res) => {
  try {
    const [posts] = await connection.query(`
  SELECT
    posts.*,
    posts.user_id as post_owner_id,

    users.username,
    users.avatar,

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

  WHERE posts.status = 'approved'


  ORDER BY posts.created_at DESC
`);

    return res.status(200).json({
      success: true,
      data: posts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPostsMods = async (req, res) => {

    const user = req.user;

    const isAdmin = user.role === "admin" || user.role === "super_admin";

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Tidak memiliki akses",
      });
    }
  try {
    const { status } = req.query;
    const allowedStatus = ["pending", "approved", "rejected"];
    const filterStatus = allowedStatus.includes(status) ? status : "pending";

    const [posts] = await connection.query(
      `
      SELECT 
        posts.*,
        posts.user_id as post_owner_id,
        users.username,
        users.avatar,
        users.created_at AS user_joined_at,
        

        (SELECT COUNT(*) FROM posts p2 WHERE p2.user_id = posts.user_id AND p2.status = 'approved') AS user_approved_count,
        (SELECT COUNT(*) FROM posts p3 WHERE p3.user_id = posts.user_id) AS user_post_count,

        (SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id) AS total_comments,
        (SELECT COUNT(*) FROM post_reactions WHERE post_reactions.post_id = posts.id AND type = 'like') AS total_likes,
        (SELECT COUNT(*) FROM post_reactions WHERE post_reactions.post_id = posts.id AND type = 'dislike') AS total_dislikes,

        (SELECT JSON_ARRAYAGG(image_url) FROM post_images WHERE post_images.post_id = posts.id) AS images
      FROM posts
      JOIN users ON users.id = posts.user_id
      WHERE posts.status = ?
      ORDER BY posts.created_at DESC
      `,
      [filterStatus]
    );

  
    const formattedPosts = posts.map(post => ({
      ...post,
      images: typeof post.images === 'string' ? JSON.parse(post.images) : (post.images || [])
    }));

    return res.status(200).json({
      success: true,
      status: filterStatus,
      data: formattedPosts,
    });
  } catch (error) {
    console.error("Error getPostsMods:", error);
    return res.status(500).json({ success: false, message: error.message });
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
            posts.user_id as post_owner_id,
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
      JOIN users ON users.id = posts.user_id
      WHERE posts.id = ?
      `,
      [id]
    );

    if (posts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Post tidak ditemukan",
      });
    }

    // Karena query di atas sudah menghasilkan objek lengkap (termasuk images),
    // kita tidak perlu query images terpisah lagi.
    return res.status(200).json({
      success: true,
      data: posts[0], // Ambil index ke-0 karena result query mysql2 selalu array
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const userId = req.user.id; 

    const [posts] = await connection.query(
      `
      SELECT
        posts.*,
        posts.user_id as post_owner_id,
        users.username,
        users.avatar,
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
      JOIN users ON users.id = posts.user_id
      WHERE posts.user_id = ? 
      ORDER BY posts.created_at DESC
      `,
      [userId]
    );

    return res.status(200).json({
      success: true,
      count: posts.length,
      data: posts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getTrendingPosts = async (req, res) => {
  const user = req.user;

    const isAdmin = user.role === "admin" || user.role === "super_admin";

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Tidak memiliki akses",
      });
    }

  try {
    const [posts] = await connection.query(`
      SELECT
        posts.id,
        posts.title,
        posts.category,
        posts.location,
        posts.created_at,

        users.username,
        users.avatar,

        (
          SELECT COUNT(*)
          FROM post_reactions
          WHERE post_reactions.post_id = posts.id
          AND post_reactions.type = 'like'
        ) AS total_likes,

        (
          SELECT JSON_ARRAYAGG(image_url)
          FROM post_images
          WHERE post_images.post_id = posts.id
        ) AS images

      FROM posts

      JOIN users
      ON users.id = posts.user_id

      WHERE posts.status = 'approved'


      ORDER BY total_likes DESC, posts.created_at DESC

      LIMIT 3
    `);

    return res.status(200).json({
      success: true,
      data: posts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const createPost = async (req, res) => {
  try {
    const { title, content, category, location } = req.body;

    const userId = req.user.id;

    const statusKerja = category.toLowerCase() === 'report' ? 'not_reviewed' : null;

    const [result] = await connection.query(
      `
      INSERT INTO posts
      (
        user_id,
        title,
        content,
        category,
        location,
        status_kerja
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        userId,
        title,
        content,
        category || "Others",
        location || null,
        statusKerja
      ],
    );

    const postId = result.insertId;

    // upload images
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
          [postId, file.filename],
        );
      }
    }

    return res.status(201).json({
      success: true,
      message: "Laporan berhasil dibuat",
      data: {
        id: postId,
        user_id: userId,
        title,
        content,
        category,
        location,
        status: "pending",
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;

    const { title, content, category, location, status_kerja } = req.body;

    const user = req.user;

    const [posts] = await connection.query("SELECT * FROM posts WHERE id = ?", [
      id,
    ]);

    if (posts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Post tidak ditemukan",
      });
    }

    const post = posts[0];

    const isOwner = post.user_id === user.id;

    const isAdmin = user.role === "admin" || user.role === "super_admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Tidak memiliki akses",
      });
    }

    await connection.query(
      `
      UPDATE posts
      SET
        title = ?,
        content = ?,
        category = ?,
        location = ?,
        status_kerja = ?
      WHERE id = ?
      `,
      [
        title || post.title,
        content || post.content,
        category || post.category,
        location || post.location,
        status_kerja || post.status_kerja,
        id,
      ],
    );

    if (status_kerja && status_kerja !== post.status_kerja && user.role !== 'user') {
      await createNotification({
        user_id: post.user_id,
        sender_id: user.id,
        type: "report_update",
        reference_id: id
      });
    }

    // upload new images
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
          [id, file.filename],
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Post berhasil diupdate",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    const user = req.user;

    const [posts] = await connection.query("SELECT * FROM posts WHERE id = ?", [
      id,
    ]);

    if (posts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Post tidak ditemukan",
      });
    }

    const post = posts[0];

    const isOwner = post.user_id === user.id;

    const isAdmin = user.role === "admin" || user.role === "super_admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Tidak memiliki akses",
      });
    }

    // delete images from storage
    const [images] = await connection.query(
      `
      SELECT *
      FROM post_images
      WHERE post_id = ?
      `,
      [id],
    );

    if (user.id !== post.user_id) {
      await createNotification({
        user_id: post.user_id,
        sender_id: user.id,
        type: "post_deleted", 
        reference_id: null     
      });
    }

    for (const image of images) {
      const path = `uploads/posts/${image.image_url}`;

      if (fs.existsSync(path)) {
        fs.unlinkSync(path);
      }
    }

    await connection.query("DELETE FROM posts WHERE id = ?", [id]);

    return res.status(200).json({
      success: true,
      message: "Post berhasil dihapus",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const approvePost = async (req, res) => {
  try {
    const { id } = req.params;

    const user = req.user;

    const isAdmin = user.role === "admin" || user.role === "super_admin";

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Tidak memiliki akses",
      });
    }

    const [posts] = await connection.query("SELECT * FROM posts WHERE id = ?", [
      id,
    ]);

    if (posts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Post tidak ditemukan",
      });
    }

    await connection.query(
      `
      UPDATE posts
      SET status = 'approved'
      WHERE id = ?
      `,
      [id],
    );

    await createNotification({
      user_id: posts[0].user_id, 
      sender_id: user.id,        
      type: "post_approved",     
      reference_id: id           
    });

    return res.status(200).json({
      success: true,
      message: "Post berhasil disetujui",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const rejectPost = async (req, res) => {
  try {
    const { id } = req.params;

    const user = req.user;

    const isAdmin = user.role === "admin" || user.role === "super_admin";

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Tidak memiliki akses",
      });
    }

    const [posts] = await connection.query("SELECT * FROM posts WHERE id = ?", [
      id,
    ]);

    if (posts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Post tidak ditemukan",
      });
    }

    await connection.query(
      `
      UPDATE posts
      SET status = 'rejected'
      WHERE id = ?
      `,
      [id],
    );

    await createNotification({
      user_id: posts[0].user_id, 
      sender_id: user.id,       
      type: "post_rejected",     
      reference_id: id           
    });

    return res.status(200).json({
      success: true,
      message: "Post berhasil ditolak",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
