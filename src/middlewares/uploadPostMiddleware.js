// middlewares/uploadPost.js

import multer from "multer";
import path from "path";
import fs from "fs";

const postUploadPath = "uploads/posts";

// bikin folder otomatis kalau belum ada
if (!fs.existsSync(postUploadPath)) {
    fs.mkdirSync(postUploadPath, {
        recursive: true
    });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, postUploadPath);
    },

    filename: (req, file, cb) => {
        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1e9) +
            path.extname(file.originalname);

        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp"
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("File harus berupa gambar"));
    }
};

export const uploadPost = multer({
    storage,
    fileFilter,

    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});