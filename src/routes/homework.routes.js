
import express from "express";
import upload from "../middleware/homeworkUpload.js";
import {
  createHomework,
  getHomeworks,
  getHomeworkStats,
  updateHomework,
  deleteHomework,
  getSubmissions,
  reviewSubmission,
  getHomeworkSettings,
  saveHomeworkSettings,
  uploadHomeworkAttachment,
} from "../controllers/homework.controller.js";

const router = express.Router();

router.get("/stats", getHomeworkStats);

router.get("/settings", getHomeworkSettings);
router.put("/settings", saveHomeworkSettings);
router.post(
  "/upload",
  upload.single("file"),
  uploadHomeworkAttachment
);

router.get("/submissions", getSubmissions);
router.patch("/submissions/:id/review", reviewSubmission);

router.post("/", createHomework);
router.get("/", getHomeworks);
router.patch("/:id", updateHomework);
router.delete("/:id", deleteHomework);

export default router;
