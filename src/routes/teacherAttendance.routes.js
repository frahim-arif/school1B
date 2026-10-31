import express from "express";

import {
  getTeacherAttendance,
  saveTeacherAttendance,
  getTeacherAttendanceHistory,
} from "../controllers/teacherAttendance.controller.js";

const router = express.Router();

router.get("/", getTeacherAttendance);
router.post("/", saveTeacherAttendance);
router.get("/teacher/:teacherId", getTeacherAttendanceHistory);

export default router;