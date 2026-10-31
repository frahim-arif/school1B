
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const uploadDir = path.resolve("uploads/gallery");

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`);
  },
});

const allowedTypes = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "application/pdf": ".pdf",
};

const upload = multer({
  storage,

  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },

  fileFilter: (req, file, cb) => {
    const expectedExt = allowedTypes[file.mimetype];
    const actualExt = path.extname(file.originalname).toLowerCase();

    if (!expectedExt || actualExt !== expectedExt) {
      return cb(
        new Error("Sirf JPG, PNG, WEBP, GIF aur PDF files allowed hain.")
      );
    }

    cb(null, true);
  },
});

export default upload;
