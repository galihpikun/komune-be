import connection from "../lib/db.js";

export const getDashboardStats = async (req, res) => {
  try {
    // Pastikan nama tabel & kolom sesuai dengan yang lo kirim
    const [[stats]] = await connection.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM posts) as total_posts,
        (SELECT COUNT(*) FROM reports) as pending_reports, 
        (SELECT COUNT(*) FROM posts WHERE status_kerja = 'in_progress') as active_tasks
    `);

    // Ambil data chart (7 hari terakhir)
const [chartData] = await connection.query(`
  SELECT 
    DATE_FORMAT(created_at, '%d %b') as date,
    COUNT(*) as count
  FROM posts
  WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
  GROUP BY date, DATE(created_at)
  ORDER BY DATE(created_at) ASC
`);

    // Ambil aktivitas postingan terbaru
    const [recentPosts] = await connection.query(`
      SELECT 
        posts.id, 
        posts.title, 
        posts.created_at, 
        users.username, 
        posts.status
      FROM posts
      JOIN users ON posts.user_id = users.id
      ORDER BY posts.created_at DESC
      LIMIT 5
    `);

    return res.status(200).json({
      success: true,
      data: { stats, chartData, recentPosts }
    });
  } catch (error) {
    // Ini penting supaya lo bisa liat errornya di console backend
    console.error("Dashboard DB Error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal Server Error",
      error: error.message 
    });
  }
};