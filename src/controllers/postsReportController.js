import connection from "../lib/db.js";

// 1. Ambil semua post yang memiliki report untuk dikelola status kerjanya
export const getReportWorkList = async (req, res) => {
  const user = req.user;
  const isAdmin = user.role === "admin" || user.role === "super_admin";

  if (!isAdmin) {
    return res.status(403).json({
      success: false,
      message: "Tidak memiliki akses",
    });
  }

  try {
    // Query mengambil post yang setidaknya punya 1 report
    const [posts] = await connection.query(`
      SELECT 
        posts.id,
        posts.title,
        posts.status_kerja,
        posts.created_at,
        users.username AS author_username,
        (SELECT image_url FROM post_images WHERE post_id = posts.id LIMIT 1) AS thumbnail,
        (SELECT COUNT(*) FROM reports WHERE reports.post_id = posts.id) AS total_reports
      FROM posts
      JOIN users ON users.id = posts.user_id
      WHERE EXISTS (SELECT 1 FROM reports WHERE reports.post_id = posts.id)
      ORDER BY posts.created_at DESC
    `);

    return res.status(200).json({
      success: true,
      data: posts,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 2. Update status kerja (not_reviewed, in_progress, resolved)
export const updateWorkStatus = async (req, res) => {
  const { id } = req.params;
  const { status_kerja } = req.body;
  const user = req.user;

  const isAdmin = user.role === "admin" || user.role === "super_admin";

  if (!isAdmin) {
    return res.status(403).json({
      success: false,
      message: "Tidak memiliki akses",
    });
  }

  try {
    const allowedStatus = ['not_reviewed', 'in_progress', 'resolved'];
    if (!allowedStatus.includes(status_kerja)) {
      return res.status(400).json({
        success: false,
        message: "Status kerja tidak valid",
      });
    }

    const [result] = await connection.query(
      "UPDATE posts SET status_kerja = ? WHERE id = ?",
      [status_kerja, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Post tidak ditemukan",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Status kerja berhasil diubah menjadi ${status_kerja}`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};