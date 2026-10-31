
import express from "express";

import {
  createSection,
  getSections,
  updateSection,
  deleteSection,
} from "../controllers/section.controller.js";

const router = express.Router();

router.post("/", createSection);
router.get("/", getSections);
router.put("/:id", updateSection);
router.delete("/:id", deleteSection);

export default router;
