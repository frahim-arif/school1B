
import express from "express";
import multer from "multer";
import fs from "node:fs";
import path from "node:path";

import {
  createHoliday,
  getHolidays,
  getHolidayById,
  updateHoliday,
  deleteHoliday,
} from "../controllers/holiday.controller.js";

const router = express.Router();

const uploadDir = path.resolve(process.cwd(), "uploads", "holidays");

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },

  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${extension}`;

    cb(null, uniqueName);
  },
});

const fileFilter = (_req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();

  if (
    file.fieldname === "pdf" &&
    extension === ".pdf" &&
    file.mimetype === "application/pdf"
  ) {
    return cb(null, true);
  }

  if (
    file.fieldname === "image" &&
    [".jpg", ".jpeg", ".png", ".webp"].includes(extension) &&
    ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)
  ) {
    return cb(null, true);
  }

  cb(new Error("Invalid file. Upload a PDF or JPG/PNG/WebP image."));
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 2,
  },
}).fields([
  { name: "pdf", maxCount: 1 },
  { name: "image", maxCount: 1 },
]);

function handleUpload(req, res, next) {
  upload(req, res, async (error) => {
    if (!error) return next();

    // Remove any file already saved by Multer if another upload fails.
    const uploadedFiles = [
      ...(req.files?.pdf || []),
      ...(req.files?.image || []),
    ];

    await Promise.all(
      uploadedFiles.map(async (file) => {
        try {
          await fs.promises.unlink(file.path);
        } catch {
          // Ignore cleanup errors.
        }
      })
    );

    const isSizeError = error instanceof multer.MulterError &&
      error.code === "LIMIT_FILE_SIZE";

    return res.status(400).json({
      success: false,
      message: isSizeError
        ? "Each file must be 5 MB or smaller."
        : error.message || "File upload failed",
    });
  });
}

router.get("/", getHolidays);
router.get("/:id", getHolidayById);

router.post("/", handleUpload, createHoliday);
router.put("/:id", handleUpload, updateHoliday);
router.patch("/:id", handleUpload, updateHoliday);
router.delete("/:id", deleteHoliday);

export default router;
