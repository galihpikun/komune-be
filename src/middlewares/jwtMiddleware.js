import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export function jwtMiddleware (req, res, next) {
  console.log("masuk middleware...");
  // ambil token dari header
  const headerToken = req.headers.authorization;
  if (!headerToken) {
    return res.status(401).json({
      message: "Token tidak ditemukan, akses ditolak",
    });
  }
  
  // console.log("token dari cookie: ", token);

  const token = headerToken.split(" ")[1];
  
  // ngecek toketnya bener kaga
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({
        message: "Token tidak valid, akses ditolak",
      });
    }
    req.user = decoded;
    next();
  });
  // data user ada di decoded
}



