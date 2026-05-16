import connection from "../lib/db.js";

export const getReports = async (req, res) => {
  const user = req.user;
  const isAdmin = user.role === "admin" || user.role === "super_admin";

  if (!isAdmin) {
    return res.status(403).json({
      success: false,
      message: "Tidak memiliki akses",
    });
  }

  try {
    const [reports] = await connection.query(`
      SELECT
        reports.*,
        users.username AS reporter_username,
        users.avatar AS reporter_avatar,
        posts.id AS post_id,
        posts.title AS post_title,
        posts.content AS post_content,
        posts.status AS post_status,
        posts.user_id AS author_id,
        reported_user.username AS author_username,
        reported_user.avatar AS author_avatar,
        (
          SELECT JSON_ARRAYAGG(image_url)
          FROM post_images
          WHERE post_images.post_id = posts.id
        ) AS post_images
      FROM reports
      LEFT JOIN users ON users.id = reports.reporter_id
      LEFT JOIN posts ON posts.id = reports.post_id
      LEFT JOIN users AS reported_user ON reported_user.id = posts.user_id
      ORDER BY reports.created_at DESC
    `);

    return res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createReport = async (req, res) => {
  try {
    const { post_id, reason } = req.body;
    const userId = req.user.id;

    if (!post_id) {
      return res.status(400).json({
        success: false,
        message: "Report harus memiliki post_id",
      });
    }

    // cek post
    const [posts] = await connection.query(
      "SELECT * FROM posts WHERE id = ?",
      [post_id]
    );

    if (posts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Post tidak ditemukan",
      });
    }

    // cek duplicate report
    const [reports] = await connection.query(
      "SELECT * FROM reports WHERE reporter_id = ? AND post_id = ?",
      [userId, post_id]
    );

    if (reports.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Kamu sudah mereport konten ini",
      });
    }

    const [result] = await connection.query(
      "INSERT INTO reports (reporter_id, post_id, reason) VALUES (?, ?, ?)",
      [userId, post_id, reason]
    );

    return res.status(201).json({
      success: true,
      message: "Report berhasil dikirim",
      data: { id: result.insertId },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const resolveReport = async (req, res) => {
  const { id } = req.params;
  const user = req.user;
  const isAdmin = user.role === "admin" || user.role === "super_admin";

  if (!isAdmin) {
    return res.status(403).json({
      success: false,
      message: "Tidak memiliki akses",
    });
  }

  try {
    const { action } = req.body; // "delete" atau "keep"

    const [[report]] = await connection.query(
      "SELECT * FROM reports WHERE id = ?",
      [id]
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    if (action === "delete") {
      await connection.query(
        "UPDATE posts SET status = 'rejected' WHERE id = ?",
        [report.post_id]
      );
    }

    await connection.query(
      "UPDATE reports SET status = 'resolved' WHERE id = ?",
      [id]
    );

    return res.status(200).json({
      success: true,
      message: action === "delete" 
        ? "Post rejected and report resolved" 
        : "Report resolved",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const reviewReport = async (req, res) => {
  const { id } = req.params;
  const user = req.user;
  const isAdmin = user.role === "admin" || user.role === "super_admin";

  if (!isAdmin) {
    return res.status(403).json({
      success: false,
      message: "Tidak memiliki akses",
    });
  }

  try {
    await connection.query(
      "UPDATE reports SET status = 'reviewed' WHERE id = ?",
      [id]
    );

    return res.status(200).json({
      success: true,
      message: "Report marked as reviewed",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteReport = async (req, res) => {
  const { id } = req.params;
  const user = req.user;
  const isAdmin = user.role === "admin" || user.role === "super_admin";

  if (!isAdmin) {
    return res.status(403).json({
      success: false,
      message: "Tidak memiliki akses",
    });
  }

  try {
    const [reports] = await connection.query(
      "SELECT * FROM reports WHERE id = ?",
      [id]
    );

    if (reports.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Report tidak ditemukan",
      });
    }

    await connection.query("DELETE FROM reports WHERE id = ?", [id]);

    return res.status(200).json({
      success: true,
      message: "Report berhasil dihapus",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};