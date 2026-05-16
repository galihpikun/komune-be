import connection from "../lib/db.js";
import bcrypt from "bcrypt";

// Cek super admin bukan, dipake lagi lagi
const checkSuperAdmin = async (userId) => {
  const [users] = await connection.query("SELECT * FROM users WHERE id = ?", [
    userId,
  ]);

  if (users.length === 0 || users[0].role !== "super_admin") {
    return false;
  }

  return true;
};

export const getUsers = async (req, res) => {
  try {
    const isSuperAdmin = await checkSuperAdmin(req.user.id);

    if (!isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Hanya super admin yang dapat melihat semua user",
      });
    }

    const [users] = await connection.query(`
            SELECT
                id,
                username,
                email,
                role,
                avatar,
                bio,
                created_at
            FROM users
        `);

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const [users] = await connection.query(
      `
            SELECT
                id,
                username,
                email,
                role,
                avatar,
                bio,
                created_at
            FROM users
            WHERE id = ?
            `,
      [id],
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    return res.status(200).json({
      success: true,
      data: users[0],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAvatar = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await connection.query(
      "SELECT username, avatar FROM users WHERE id = ?",
      [userId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];

    res.status(200).json({
      success: true,
      data: {
        username: user.username,
        avatar: user.avatar ? user.avatar : null,
      },
    });
  } catch (error) {
    console.error("Error fetching avatar:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const createUser = async (req, res) => {
  try {
    const isSuperAdmin = await checkSuperAdmin(req.user.id);

    if (!isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Hanya super admin yang dapat membuat user",
      });
    }

    const { username, email, password, role } = req.body;

    if (!username || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Semua field wajib diisi",
      });
    }

    const [emailExists] = await connection.query(
      `
                SELECT * FROM users
                WHERE email = ?
                `,
      [email],
    );

    if (emailExists.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email sudah digunakan",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await connection.query(
      `
                INSERT INTO users
                (
                    username,
                    email,
                    password,
                    role
                )
                VALUES (?, ?, ?, ?)
                `,
      [username, email, hashedPassword, role],
    );

    return res.status(201).json({
      success: true,
      message: "User berhasil dibuat",
      data: {
        id: result.insertId,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateUserAdmin = async (req, res) => {
  try {
    const isSuperAdmin = await checkSuperAdmin(req.user.id);

    if (!isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Hanya super admin yang dapat update user",
      });
    }

    const { id } = req.params;

    const { username, email, role } = req.body;

    const [users] = await connection.query(
      `
            SELECT * FROM users
            WHERE id = ?
            `,
      [id],
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    await connection.query(
      `
            UPDATE users
            SET
                username = ?,
                email = ?,
                role = ?
            WHERE id = ?
            `,
      [
        username || users[0].username,
        email || users[0].email,
        role || users[0].role,
        id,
      ],
    );

    return res.status(200).json({
      success: true,
      message: "User berhasil diupdate",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMe = async (req, res) => {
  const userId = req.user.id;

  try {
    const [users] = await connection.query(
      `SELECT * FROM users WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Berhasil mendapatkan data user",
      data: users[0],
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateMe = async (req, res) => {
  try {
    const userId = req.user.id;

    const { username, email, bio } = req.body;

    await connection.query(
      `
            UPDATE users
            SET
                username = ?,
                email = ?,
                bio = ?
            WHERE id = ?
            `,
      [username, email, bio, userId],
    );

    return res.status(200).json({
      success: true,
      message: "Profile berhasil diupdate",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image uploaded",
      });
    }

    const avatar = req.file.filename;

    await connection.query(
      `
      UPDATE users
      SET avatar = ?
      WHERE id = ?
      `,
      [avatar, userId]
    );

    return res.status(200).json({
      success: true,
      message: "Avatar updated successfully",
      data: {
        avatar,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteMe = async (req, res) => {
  try {
    const userId = req.user.id;

    await connection.query(
      `
            DELETE FROM users
            WHERE id = ?
            `,
      [userId],
    );

    return res.status(200).json({
      success: true,
      message: "Akun berhasil dihapus",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteUserAdmin = async (req, res) => {
  try {
    const isSuperAdmin = await checkSuperAdmin(req.user.id);

    if (!isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Hanya super admin yang dapat menghapus user",
      });
    }

    const { id } = req.params;

    // prevent self delete
    if (Number(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "Tidak dapat menghapus akun sendiri",
      });
    }

    const [users] = await connection.query(
      `
                    SELECT * FROM users
                    WHERE id = ?
                    `,
      [id],
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    await connection.query(
      `
                DELETE FROM users
                WHERE id = ?
                `,
      [id],
    );

    return res.status(200).json({
      success: true,
      message: "User berhasil dihapus",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
