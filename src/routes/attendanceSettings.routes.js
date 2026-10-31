
import express from "express";

import {
  getAttendanceSettings,
  saveAttendanceSettings,
} from "../controllers/attendanceSettings.controller.js";

const router = express.Router();

router.get("/", getAttendanceSettings);
router.put("/", saveAttendanceSettings);

export default router;
