
import express from "express";

import {
  createTeacher,
  getTeachers,
  getTeacherById,
  deleteTeacher,
} from "../controllers/teacher.controller.js";

const router = express.Router();

// Create a new teacher
router.post("/", createTeacher);

// Get all teachers
router.get("/", getTeachers);

// Get a single teacher by MongoDB ID
router.get("/:id", getTeacherById);

// Delete a teacher by MongoDB ID
router.delete("/:id", deleteTeacher);

export default router;
