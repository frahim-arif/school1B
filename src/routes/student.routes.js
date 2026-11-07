
import express from "express";

import {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
} from "../controllers/student.controller.js";

import {
  assignStudentsToHouse,
} from "../controllers/studentHouse.controller.js";

const router = express.Router();

// Create Student
router.post("/", createStudent);

// Get All Students
router.get("/", getStudents);

// Assign or Remove Students from House
router.patch("/house/assign", assignStudentsToHouse);

// Get Single Student
router.get("/:id", getStudentById);

// Update Student
router.put("/:id", updateStudent);

// Delete Student
router.delete("/:id", deleteStudent);

export default router;
