import connection from "../lib/db.js";


export const getUsers = async (req, res) => {
  try {
    const [users] = await connection.query(
      "SELECT * FROM users"
    );

    return res.status(200).json({
      code: 200,
      success: true,
      message: "Berhasil ngambil users",
      data: users,
    });

  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
};

export const getUserById = async (req, res) => {
  const { userId } = req.params;

  try {
    const [users] = await connection.query(
      "SELECT * FROM users WHERE id = ?",
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        code: 404,
        success: false,
        message: "User Ga Ditemukan",
      });
    }

    return res.status(200).json({
      code: 200,
      success: true,
      message: "Berhasil ngambil user",
      data: users[0],
    });

  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
};

export const updateUserAdmin = async (req, res) => {
    const { userId } = req.params;
    const { username, email, role} = req.body;
    const adminId = req.user.id;

    if (!username || !email || !role) {
        return res.status(400).json({
            code:400,
            success:false,
            message: "Username, email dan role harus diisi",
        })
    }
    
    const [admin] = await connection.query(
      "SELECT * FROM users WHERE id = ?",
      [adminId]
    );

    if (admin.length === 0 || admin[0].role !== "admin") {
      return res.status(403).json({
        code: 403,
        success: false,
        message: "Akses ditolak, hanya admin yang bisa mengupdate user",
      });
    }

    try {
        const [update] = await connection.query(
            "UPDATE users SET username = ?, email = ?, role = ? WHERE id = ?",
            [username, email, role, userId]
        );

        return res.status(200).json({
            code: 200,
            success: true,
            message: "User berhasil diupdate",
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            code : 500,
            message : "Gagal update user"
        });
    }
};

export const deleteUser = async (req,res) => {
    const {userId} = req.params;

    try {
        const [deleteUser] =  await connection.query(
            "DELETE FROM users WHERE id = ?",
            [userId]
        );

        if (deleteUser.affectedRows === 0) {
            return res.status(404).json({
                code: 404,
                success: false,
                message: "User tidak ditemukan",
            });
        }
        return res.status(200).json({
            code: 200,
            success: true,
            message: "User berhasil dihapus",
        });
        
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            code : 500,
            message : "Gagal update user"
        });
    }
}