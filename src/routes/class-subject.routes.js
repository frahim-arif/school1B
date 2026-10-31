
import express from "express";

import {
  getClassSubjects,
  createClassSubject,
  updateClassSubject,
  deleteClassSubject,
} from "../controllers/class-subject.controller.js";

const router = express.Router();

router.get("/", getClassSubjects);
router.post("/", createClassSubject);
router.put("/:id", updateClassSubject);
router.delete("/:id", deleteClassSubject);

export default router;
