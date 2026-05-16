import multer from "multer";
import path from "path";
import fs from "fs";

const avatarPath = "uploads/users";

if (!fs.existsSync(avatarPath)) {
  fs.mkdirSync(avatarPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarPath);
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

export const uploadAvatarMiddleware = multer({
  storage,

  fileFilter: (req, file, cb) => {
    const allowed = /jpg|jpeg|png|webp/;

    const isValid = allowed.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (isValid) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed"));
    }
  },

  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});