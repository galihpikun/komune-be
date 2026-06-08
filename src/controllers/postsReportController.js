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
        posts.content,
        posts.category,
        posts.status_kerja,
        posts.location,
        posts.created_at,
        posts.is_locked,
        users.username AS author_username,
        (SELECT image_url FROM post_images WHERE post_id = posts.id LIMIT 1) AS thumbnail,
        (SELECT COUNT(*) FROM reports WHERE reports.post_id = posts.id) AS total_reports
      FROM posts
      JOIN users ON users.id = posts.user_id
      WHERE posts.category = 'Report' 
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
export const lockPost = async (req, res) => {
  const { id } = req.params;
  const { is_locked } = req.body; 
  const user = req.user;

  const isAdmin = user.role === "admin" || user.role === "super_admin";

  if (!isAdmin) {
    return res.status(403).json({
      success: false,
      message: "Tidak memiliki akses",
    });
  }

  // Validasi input parameter body
  if (is_locked === undefined) {
    return res.status(400).json({
      success: false,
      message: "Status lock harus dikirim",
    });
  }

  try {
    const [result] = await connection.query(
      "UPDATE posts SET is_locked = ? WHERE id = ?",
      [is_locked, id] // Nilai dinamis masuk ke sini
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Post tidak ditemukan",
      });
    }

    return res.status(200).json({
      success: true,
      message: is_locked === 1 ? "Report berhasil ditutup dan dikunci" : "Report berhasil dibuka kembali",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};