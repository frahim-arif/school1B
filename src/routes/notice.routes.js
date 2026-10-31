
import express from "express";
import multer from "multer";
import fs from "node:fs";
import path from "node:path";
import * as controller from "../controllers/notice.controller.js";

const router = express.Router();

const uploadDir = path.resolve(process.cwd(), "uploads", "notices");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = [".pdf", ".png", ".jpg", ".jpeg"];

    if (!allowed.includes(ext)) {
      return cb(new Error("Only PDF, PNG, JPG and JPEG files are allowed"));
    }

    cb(null, `notice-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    const allowed = ["application/pdf", "image/png", "image/jpeg"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only PDF, PNG, JPG and JPEG files are allowed"));
    }
    cb(null, true);
  },
});

router.get("/stats", controller.getNoticeStats);
router.get("/", controller.getNotices);
router.get("/:id", controller.getNoticeById);
router.post("/", upload.single("attachment"), controller.createNotice);
router.post("/:id/view", controller.recordNoticeView);
router.put("/:id", upload.single("attachment"), controller.updateNotice);
router.delete("/:id", controller.deleteNotice);

export default router;
