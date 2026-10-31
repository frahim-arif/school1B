
import express from "express";
import {
  getAttendance,
  markAttendance,
  checkIn,
  checkOut,
} from "../controllers/staffAttendance.controller.js";

const router = express.Router();

router.get("/", getAttendance);
router.post("/", markAttendance);
router.post("/check-in", checkIn);
router.post("/check-out", checkOut);

export default router;
