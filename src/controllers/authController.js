import connection from "../lib/db.js";
import bcrypt from "bcrypt";
import {generateToken} from "../utils/generateToken.js";

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

export const getUsersById = async (req, res) => {
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


export const register = async (req, res) => {
  const { username, email, password } = req.body;

  try {

    if (!username || !email || !password) {
      return res.status(400).json({
        code: 400,
        message: "Belum diisi inputnya",
      });
    }

    const [emailExists] = await connection.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (emailExists.length > 0) {
      return res.status(400).json({
        code: 400,
        message: "Email sudah ada yang punya",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPw = await bcrypt.hash(password, salt);

    const [result] = await connection.query(
      `
      INSERT INTO users
      (username, email, password)
      VALUES (?, ?, ?)
      `,
      [username, email, hashedPw]
    );

    const [newUser] = await connection.query(
      "SELECT id, username, email, role, created_at FROM users WHERE id = ?",
      [result.insertId]
    );

    return res.status(201).json({
      code: 201,
      success: true,
      message: "Berhasil register",
      data: newUser[0],
    });

  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {

    const [users] = await connection.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        code: 401,
        message: "Invalid email or password",
      });
    }

    const user = users[0];

    const isPwValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPwValid) {
      return res.status(401).json({
        code: 401,
        message: "Invalid email or password",
      });
    }

    const token = generateToken(
      {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      res
    );

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        },
        token,
      },
    });

  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
};

export const logout = async (req, res) => {

  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  return res.status(200).json({
    code: 200,
    success: true,
    message: "Berhasil logout",
  });
};

