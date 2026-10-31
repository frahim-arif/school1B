
import express from "express";

import {
  createTimetable,
  getTimetables,
  updateTimetable,
  deleteTimetable,
} from "../controllers/timetable.controller.js";

const router = express.Router();

router.post("/", createTimetable);
router.get("/", getTimetables);
router.put("/:id", updateTimetable);
router.delete("/:id", deleteTimetable);

export default router;
