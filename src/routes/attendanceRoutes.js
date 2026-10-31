
import express from "express";
import {
  markAttendance,
  getAttendanceByDate,
  getStudentAttendance,
} from "../controllers/attendanceController.js";

const router = express.Router();

router.post("/", markAttendance);
router.get("/", getAttendanceByDate);
router.get("/student/:studentId", getStudentAttendance);

export default router;
